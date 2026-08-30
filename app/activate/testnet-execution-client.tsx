'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BSC_TESTNET,
  ensureBscNetwork,
  getInjectedProvider,
  useBscWallet,
  walletError,
} from '@/components/use-bsc-wallet';
import {
  bindJobId,
  ERC8183_TESTNET,
  type IntegrityCheck,
  type ProviderCall,
  type SafeHirePlan,
} from '@/lib/erc8183';

type Props = {
  tokenId: string;
  agentName: string;
  defaultTask: string;
};

type RuntimeStep = {
  status: 'idle' | 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  error?: string;
};

type WalletCheck = {
  label: string;
  pass: boolean;
  observed: string;
};

type TestnetPlan = SafeHirePlan & {
  quote: SafeHirePlan['quote'] & {
    negotiationHash: string;
    providerSignature: string;
  };
  providerRuntime: {
    address: string;
    gasBalanceWei: string;
    gasBalanceDisplay: string;
    minimumGasWei: string;
    ready: boolean;
  };
};

type ProviderSnapshot = {
  provider: string;
  gasBalanceDisplay: string;
  ready: boolean;
  validReferenceJob?: boolean;
  canSubmit?: boolean;
  canSettle?: boolean;
  settlesAt?: number;
  secondsUntilSettle?: number | null;
  result?: Record<string, unknown> | null;
  job?: {
    id: string;
    client: string;
    provider: string;
    evaluator: string;
    description: string;
    budget: string;
    budgetDisplay: string;
    expiredAt: number;
    status: string;
    statusCode: number;
    hook: string;
    submittedAt: number;
    deliverable: string;
  };
  error?: string;
};

type StoredProgress = {
  tokenId: string;
  task: string;
  jobId: string | null;
  steps: RuntimeStep[];
};

type StrategyResultView = {
  category?: string;
  verdict?: string;
  summary?: string;
  dataQuality?: string;
  metrics?: Array<{ label?: string; value?: string; note?: string }>;
  actions?: string[];
  risks?: string[];
  evidence?: {
    sourceBlock?: string;
    gasPriceGwei?: string;
    observedAt?: string;
    externalSource?: string;
  };
};

type PreviewResponse = {
  preview?: boolean;
  onchainDeliverable?: boolean;
  disclaimer?: string;
  result?: StrategyResultView;
  error?: string;
};

const CONFIG = ERC8183_TESTNET;
const freshSteps = (): RuntimeStep[] => Array.from({ length: 5 }, () => ({ status: 'idle' }));

function addressWord(address: string) {
  return address.replace(/^0x/, '').toLowerCase().padStart(64, '0');
}

function formatUnits(value: bigint, decimals = 18, precision = 5) {
  const base = BigInt(10) ** BigInt(decimals);
  const whole = value / base;
  const remainder = (value % base).toString().padStart(decimals, '0').slice(0, precision).replace(/0+$/, '');
  return remainder ? `${whole}.${remainder}` : String(whole);
}

function compact(value: string) {
  if (value.length < 18) return value;
  return value.slice(0, 8) + '...' + value.slice(-6);
}

function stateLabel(status: RuntimeStep['status']) {
  if (status === 'pending') return 'WAITING';
  if (status === 'confirmed') return 'DONE';
  if (status === 'failed') return 'RETRY';
  return 'READY';
}

function StrategyResultCard({ result, preview = false }: { result: StrategyResultView; preview?: boolean }) {
  return (
    <div className={`testnet-result-panel${preview ? ' is-preview' : ''}`}>
      <div className="strategy-result-heading">
        <div>
          <span>{result.category || 'AGENT RESULT'}</span>
          <strong>{result.verdict || 'RESULT SUBMITTED'}</strong>
        </div>
        <b>{preview ? 'PREVIEW · ' : ''}{result.dataQuality || 'VERIFIED RESULT'}</b>
      </div>
      <p className="strategy-result-summary">{result.summary}</p>
      <div className="strategy-result-metrics">
        {(result.metrics || []).map((metric, index) => (
          <div key={`${metric.label || 'metric'}-${index}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.note}</small>
          </div>
        ))}
      </div>
      <div className="strategy-result-guidance">
        <section>
          <strong>NEXT ACTIONS</strong>
          <ol>{(result.actions || []).map((action) => <li key={action}>{action}</li>)}</ol>
        </section>
        <section>
          <strong>RISKS</strong>
          <ul>{(result.risks || []).map((risk) => <li key={risk}>{risk}</li>)}</ul>
        </section>
      </div>
      <footer className="strategy-result-evidence">
        <span>BLOCK {result.evidence?.sourceBlock || '?'}</span>
        <span>{result.evidence?.gasPriceGwei || '?'} GWEI</span>
        <span>{preview ? 'NO JOB · NO SIGNATURE' : 'ONCHAIN DELIVERABLE'}</span>
        <span>NO CAPITAL MOVED</span>
      </footer>
      <details className="strategy-result-raw">
        <summary>{preview ? 'VIEW RAW PREVIEW DATA' : 'VIEW RAW ONCHAIN RESULT'}</summary>
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </details>
    </div>
  );
}

export function TestnetHireConsole({ tokenId, agentName, defaultTask }: Props) {
  const wallet = useBscWallet();
  const [task, setTask] = useState(defaultTask);
  const [plan, setPlan] = useState<TestnetPlan | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [walletChecks, setWalletChecks] = useState<WalletCheck[]>([]);
  const [checkingWallet, setCheckingWallet] = useState(false);
  const [steps, setSteps] = useState<RuntimeStep[]>(freshSteps);
  const [jobId, setJobId] = useState<string | null>(null);
  const [providerSnapshot, setProviderSnapshot] = useState<ProviderSnapshot | null>(null);
  const [providerResult, setProviderResult] = useState<Record<string, unknown> | null>(null);
  const [previewResult, setPreviewResult] = useState<StrategyResultView | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [message, setMessage] = useState('No transaction has been sent.');
  const [runningStep, setRunningStep] = useState<number | null>(null);
  const [providerAction, setProviderAction] = useState<'submit' | 'settle' | null>(null);

  const storageKey = useMemo(
    () => wallet.account ? `grabit:testnet:erc8183:${tokenId}:${wallet.account.toLowerCase()}` : null,
    [tokenId, wallet.account],
  );
  const hasProgress = steps.some((step) => step.status === 'confirmed' || Boolean(step.txHash));
  const nextStep = steps.findIndex((step) => step.status !== 'confirmed');
  const walletReady = walletChecks.length > 0 && walletChecks.every((check) => check.pass);
  const providerReady = Boolean(plan?.providerRuntime.ready);
  const canExecute = Boolean(plan?.integrity.passed && providerReady && wallet.account && wallet.isTestnet && walletReady);

  const persist = useCallback((nextSteps: RuntimeStep[], nextJobId: string | null, nextTask = task) => {
    if (!storageKey) return;
    const value: StoredProgress = { tokenId, task: nextTask, jobId: nextJobId, steps: nextSteps };
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }, [storageKey, task, tokenId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!storageKey) {
        setSteps(freshSteps());
        setJobId(null);
        return;
      }
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) return;
        const saved = JSON.parse(raw) as StoredProgress;
        if (saved.tokenId !== tokenId || !Array.isArray(saved.steps) || saved.steps.length !== 5) return;
        setTask(saved.task || defaultTask);
        setSteps(saved.steps);
        setJobId(saved.jobId);
        setMessage(saved.jobId ? `Restored Testnet Job #${saved.jobId}.` : 'Restored your local transaction progress.');
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [defaultTask, storageKey, tokenId]);

  const loadQuote = useCallback(async (nextTask: string) => {
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const response = await fetch(
        `/api/hire/testnet-quote?registry=${encodeURIComponent(tokenId)}&task=${encodeURIComponent(nextTask)}`,
        { cache: 'no-store' },
      );
      const payload = await response.json() as TestnetPlan & { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Testnet provider quote unavailable.');
      setPlan(payload);
      setMessage(payload.providerRuntime.ready
        ? 'Signed Testnet quote loaded. Connect a wallet and run preflight.'
        : 'Provider is connected but needs Testnet BNB for result submission.');
    } catch (error) {
      setPlan(null);
      setQuoteError(error instanceof Error ? error.message : 'Testnet quote unavailable.');
    } finally {
      setQuoteLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadQuote(defaultTask), 0);
    return () => window.clearTimeout(timer);
  }, [defaultTask, loadQuote]);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const response = await fetch(
        `/api/hire/strategy-preview?registry=${encodeURIComponent(tokenId)}&task=${encodeURIComponent(task)}`,
        { cache: 'no-store' },
      );
      const payload = await response.json() as PreviewResponse;
      if (!response.ok || !payload.preview || !payload.result) {
        throw new Error(payload.error || 'Agent strategy preview unavailable.');
      }
      setPreviewResult(payload.result);
      setMessage('Read-only Agent preview generated. No wallet, Job or transaction was used.');
    } catch (error) {
      setPreviewResult(null);
      setPreviewError(error instanceof Error ? error.message : 'Agent strategy preview unavailable.');
    } finally {
      setPreviewLoading(false);
    }
  }, [task, tokenId]);

  const checkWallet = useCallback(async () => {
    setCheckingWallet(true);
    setWalletChecks([]);
    try {
      const account = wallet.account || await wallet.connect();
      if (!account) throw new Error('Connect a wallet before running preflight.');
      const provider = getInjectedProvider();
      await ensureBscNetwork(provider, BSC_TESTNET);
      await wallet.refresh();

      const balanceWord = CONFIG.selectors.balanceOf + addressWord(account);
      const [chainHex, nativeHex, tokenHex, codes] = await Promise.all([
        provider.request({ method: 'eth_chainId' }) as Promise<string>,
        provider.request({ method: 'eth_getBalance', params: [account, 'latest'] }) as Promise<string>,
        provider.request({
          method: 'eth_call',
          params: [{ to: CONFIG.paymentToken, data: balanceWord }, 'latest'],
        }) as Promise<string>,
        Promise.all(
          [CONFIG.kernel, CONFIG.router, CONFIG.policy, CONFIG.paymentToken].map(
            (address) => provider.request({ method: 'eth_getCode', params: [address, 'latest'] }) as Promise<string>,
          ),
        ),
      ]);
      const nativeBalance = BigInt(nativeHex);
      const tokenBalance = BigInt(tokenHex);
      const firstCall = plan?.calls[0];
      const approveCall = plan?.calls[3];
      let simulation = false;
      if (firstCall?.data && approveCall?.data) {
        await provider.request({
          method: 'eth_estimateGas',
          params: [{ from: account, to: firstCall.to, data: firstCall.data, value: '0x0' }],
        });
        await provider.request({
          method: 'eth_estimateGas',
          params: [{ from: account, to: approveCall.to, data: approveCall.data, value: '0x0' }],
        });
        simulation = true;
      }
      const checks: WalletCheck[] = [
        { label: 'Wallet on chain 97', pass: Number.parseInt(chainHex, 16) === CONFIG.chainId, observed: `chain ${Number.parseInt(chainHex, 16)}` },
        { label: 'Testnet gas available', pass: nativeBalance > BigInt(0), observed: `${formatUnits(nativeBalance)} tBNB` },
        { label: 'Exact test token available', pass: tokenBalance >= BigInt(CONFIG.amountAtomic), observed: `${formatUnits(tokenBalance)} test $U` },
        { label: 'Contracts have code', pass: codes.every((code) => code !== '0x'), observed: 'kernel / router / policy / token' },
        { label: 'Create + approval simulate', pass: simulation, observed: simulation ? 'no revert predicted' : 'not simulated' },
      ];
      setWalletChecks(checks);
      setMessage(checks.every((check) => check.pass)
        ? 'Preflight passed. Review and confirm one transaction at a time.'
        : 'Preflight found a missing requirement. No transaction was sent.');
    } catch (error) {
      setMessage(walletError(error));
    } finally {
      setCheckingWallet(false);
    }
  }, [plan, wallet]);

  const refreshProvider = useCallback(async (targetJobId = jobId) => {
    if (!targetJobId) return null;
    const response = await fetch(`/api/hire/testnet-provider?jobId=${encodeURIComponent(targetJobId)}`, { cache: 'no-store' });
    const payload = await response.json() as ProviderSnapshot;
    if (!response.ok) throw new Error(payload.error || 'Provider status unavailable.');
    setProviderSnapshot(payload);
    if (payload.result) setProviderResult(payload.result);
    return payload;
  }, [jobId]);

  const findCreatedJob = useCallback(async (account: string) => {
    if (!plan) throw new Error('Load a signed quote first.');
    const provider = getInjectedProvider();
    const counterHex = await provider.request({
      method: 'eth_call',
      params: [{ to: CONFIG.kernel, data: CONFIG.selectors.jobCounter }, 'latest'],
    }) as string;
    const counter = BigInt(counterHex);
    const floor = counter > BigInt(8) ? counter - BigInt(8) : BigInt(1);
    for (let cursor = counter; cursor >= floor; cursor -= BigInt(1)) {
      const response = await fetch(`/api/hire/testnet-provider?jobId=${cursor}`, { cache: 'no-store' });
      if (!response.ok) continue;
      const snapshot = await response.json() as ProviderSnapshot;
      const job = snapshot.job;
      if (
        job
        && job.client.toLowerCase() === account.toLowerCase()
        && job.provider.toLowerCase() === plan.provider.toLowerCase()
        && job.evaluator.toLowerCase() === CONFIG.router.toLowerCase()
        && job.description.includes(plan.quote.negotiationHash)
      ) {
        setJobId(job.id);
        setProviderSnapshot(snapshot);
        return job.id;
      }
    }
    throw new Error('The confirmed Create transaction was found, but its Job ID could not be recovered yet.');
  }, [plan]);

  useEffect(() => {
    if (!jobId) return;
    const starter = window.setTimeout(() => void refreshProvider(jobId).catch(() => undefined), 0);
    const timer = window.setInterval(() => void refreshProvider(jobId).catch(() => undefined), 15_000);
    return () => {
      window.clearTimeout(starter);
      window.clearInterval(timer);
    };
  }, [jobId, refreshProvider]);

  const runStep = useCallback(async (index: number) => {
    if (!plan || !wallet.account) return;
    if (index !== nextStep) {
      setMessage('Complete the previous transaction first.');
      return;
    }
    let boundJobId = jobId;
    if (index > 0 && !boundJobId) {
      setMessage('Recover the Job ID before continuing.');
      return;
    }
    setRunningStep(index);
    const pending = steps.map((step, cursor) => cursor === index
      ? { ...step, status: 'pending' as const, error: undefined }
      : step);
    setSteps(pending);
    persist(pending, boundJobId);
    try {
      const provider = getInjectedProvider();
      await ensureBscNetwork(provider, BSC_TESTNET);
      const call = plan.calls[index];
      const template = call.data || call.data_template;
      if (!template) throw new Error('This transaction has no calldata.');
      const data = index === 0 ? template : bindJobId(template, boundJobId!);
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: wallet.account,
          to: call.to,
          data,
          value: call.value || '0x0',
        }],
      }) as string;
      const sent = pending.map((step, cursor) => cursor === index ? { ...step, txHash } : step);
      setSteps(sent);
      persist(sent, boundJobId);
      setMessage(`Step ${index + 1} sent. Waiting for confirmation...`);
      await wallet.waitForReceipt(txHash);
      if (index === 0) {
        boundJobId = await findCreatedJob(wallet.account);
      }
      const confirmed = sent.map((step, cursor) => cursor === index
        ? { ...step, status: 'confirmed' as const, error: undefined }
        : step);
      setSteps(confirmed);
      persist(confirmed, boundJobId);
      setMessage(index === 4
        ? `Testnet Job #${boundJobId} is funded. The provider can now run the read-only task.`
        : `Step ${index + 1} confirmed. Review the next transaction.`);
      if (boundJobId) await refreshProvider(boundJobId).catch(() => undefined);
    } catch (error) {
      const reason = walletError(error);
      const failed = pending.map((step, cursor) => cursor === index
        ? { ...step, status: 'failed' as const, error: reason }
        : step);
      setSteps(failed);
      persist(failed, boundJobId);
      setMessage(reason);
    } finally {
      setRunningStep(null);
    }
  }, [findCreatedJob, jobId, nextStep, persist, plan, refreshProvider, steps, wallet]);

  const recoverJobId = useCallback(async () => {
    if (!wallet.account) return;
    try {
      const recovered = await findCreatedJob(wallet.account);
      persist(steps, recovered);
      setMessage(`Recovered Testnet Job #${recovered}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Job recovery failed.');
    }
  }, [findCreatedJob, persist, steps, wallet.account]);

  const runProviderAction = useCallback(async (action: 'submit' | 'settle') => {
    if (!jobId) return;
    setProviderAction(action);
    try {
      const response = await fetch('/api/hire/testnet-provider', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, jobId }),
      });
      const payload = await response.json() as {
        error?: string;
        txHash?: string;
        result?: Record<string, unknown>;
      };
      if (!response.ok || !payload.txHash) throw new Error(payload.error || 'Provider action failed.');
      if (payload.result) setProviderResult(payload.result);
      setMessage(`Provider ${action} transaction sent: ${compact(payload.txHash)}`);
      await wallet.waitForReceipt(payload.txHash);
      await refreshProvider(jobId);
      setMessage(action === 'submit'
        ? 'Read-only result submitted on-chain. The 15-minute dispute window is running.'
        : 'Job settled on BSC Testnet. The test-token payment is complete.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Provider action failed.');
    } finally {
      setProviderAction(null);
    }
  }, [jobId, refreshProvider, wallet]);

  const resetProgress = useCallback(() => {
    if (storageKey) window.localStorage.removeItem(storageKey);
    setSteps(freshSteps());
    setJobId(null);
    setProviderSnapshot(null);
    setProviderResult(null);
    setMessage('Local progress cleared. No on-chain state was changed.');
  }, [storageKey]);

  const allFunded = steps.every((step) => step.status === 'confirmed');
  const integrityChecks: IntegrityCheck[] = plan?.integrity.checks || [];
  const secondsUntilSettle = providerSnapshot?.secondsUntilSettle;
  const currentCall = nextStep >= 0 ? plan?.calls[nextStep] : null;
  const resultView = providerResult as StrategyResultView | null;

  return (
    <div className="hire-execution-console testnet-execution-console">
      <div className="execution-mode-banner">
        <span className="status-lamp is-live" aria-hidden="true" />
        <div>
          <strong>BSC TESTNET | LIVE TRANSACTIONS</strong>
          <p>Uses valueless tBNB and test $U. Nothing here can spend Mainnet assets.</p>
        </div>
      </div>

      <section className="hire-step-panel">
        <div className="hire-step-heading">
          <span>1A</span>
          <div>
            <strong>Prepare the test</strong>
            <small>{agentName} | ERC-8183 on chain 97</small>
          </div>
          <button
            type="button"
            className="retro-button compact"
            disabled={quoteLoading || hasProgress}
            onClick={() => void loadQuote(task)}
          >
            {quoteLoading ? 'LOADING...' : 'REFRESH QUOTE'}
          </button>
        </div>
        <div className="strategy-preview-launch">
          <div>
            <strong>See what this Agent actually returns</strong>
            <span>Read-only preview · no wallet · no signature · no payment</span>
          </div>
          <button
            type="button"
            className="retro-button primary"
            disabled={previewLoading}
            onClick={() => void loadPreview()}
          >
            {previewLoading ? 'RUNNING AGENT...' : previewResult ? 'REFRESH PREVIEW' : 'PREVIEW AGENT RESULT'}
          </button>
        </div>
        {previewError ? <div className="hire-alert is-error">{previewError}</div> : null}
        {previewResult ? <StrategyResultCard result={previewResult} preview /> : null}
        <details className="simple-technical-details">
          <summary>VIEW OR EDIT AGENT TASK</summary>
          <label className="hire-field">
            <span>READ-ONLY TASK</span>
            <textarea
              rows={4}
              value={task}
              disabled={hasProgress}
              onChange={(event) => setTask(event.target.value)}
            />
          </label>
        </details>
        {quoteError ? <div className="hire-alert is-error">{quoteError}</div> : null}
        {plan ? (
          <>
            <details className="simple-technical-details">
              <summary>TECHNICAL DETAILS · {integrityChecks.length}/{integrityChecks.length} VERIFIED</summary>
            <div className="hire-facts-grid">
              <div><span>PRICE</span><strong>{plan.quote.display}</strong></div>
              <div><span>EXPIRES</span><strong>{new Date(plan.quote.expiresAt * 1000).toLocaleTimeString()}</strong></div>
              <div><span>PROVIDER</span><strong>{compact(plan.provider)}</strong></div>
              <div><span>PROVIDER GAS</span><strong>{plan.providerRuntime.gasBalanceDisplay}</strong></div>
            </div>
            <div className="provider-address-box">
              <div>
                <span>TESTNET PROVIDER ADDRESS</span>
                <code>{plan.providerRuntime.address}</code>
              </div>
              <button type="button" className="retro-button compact" onClick={() => void navigator.clipboard.writeText(plan.providerRuntime.address)}>
                COPY
              </button>
            </div>
            </details>
            <div className={`hire-alert ${plan.integrity.passed ? 'is-success' : 'is-error'}`}>
              {plan.integrity.passed
                ? `SIGNED PLAN VERIFIED | ${integrityChecks.length}/${integrityChecks.length} checks`
                : 'SIGNED PLAN BLOCKED | integrity check failed'}
            </div>
            {!providerReady ? (
              <div className="hire-alert is-warning">
                Provider needs at least 0.002 tBNB before execution is unlocked. Send faucet tBNB to the address above, then refresh the quote.
              </div>
            ) : null}
          </>
        ) : null}
      </section>

      <section className="hire-step-panel">
        <div className="hire-step-heading">
          <span>1B</span>
          <div>
            <strong>Connect your Testnet wallet</strong>
            <small>Wallet balances, deployed bytecode and revert prediction</small>
          </div>
        </div>
        <div className="hire-action-row">
          {!wallet.account ? (
            <button type="button" className="retro-button primary" disabled={wallet.connecting} onClick={() => void wallet.connect()}>
              {wallet.connecting ? 'CONNECTING...' : 'CONNECT WALLET'}
            </button>
          ) : !wallet.isTestnet ? (
            <button type="button" className="retro-button primary" disabled={wallet.connecting} onClick={() => void wallet.switchNetwork(BSC_TESTNET)}>
              SWITCH TO BSC TESTNET
            </button>
          ) : (
            <button type="button" className="retro-button primary" disabled={checkingWallet || !plan} onClick={() => void checkWallet()}>
              {checkingWallet ? 'CHECKING...' : 'RUN PREFLIGHT'}
            </button>
          )}
          <span>{wallet.account ? `${compact(wallet.account)} | chain ${wallet.chainId ?? '?'}` : 'No wallet connected'}</span>
        </div>
        {wallet.error ? <div className="hire-alert is-error">{wallet.error}</div> : null}
        {walletChecks.length ? (
          <ul className="integrity-list">
            {walletChecks.map((check) => (
              <li key={check.label} className={check.pass ? 'is-pass' : 'is-fail'}>
                <strong>{check.pass ? '[PASS]' : '[FAIL]'} {check.label}</strong>
                <span>{check.observed}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="testnet-faucet-row">
          <a className="retro-button compact" href={CONFIG.faucets.gas} target="_blank" rel="noreferrer">GET TEST BNB</a>
          <a className="retro-button compact" href={CONFIG.faucets.token} target="_blank" rel="noreferrer">GET TEST $U</a>
        </div>
      </section>

      <section className="hire-step-panel">
        <div className="hire-step-heading">
          <span>02</span>
          <div>
            <strong>Hire the Agent</strong>
            <small>Create - Bind policy - Set budget - Approve exact amount - Fund</small>
          </div>
        </div>
        <div className="simple-job-progress">
          <strong>{allFunded ? '5 / 5 COMPLETE' : `${Math.max(0, nextStep)} / 5 COMPLETE`}</strong>
          <span>Each click opens exactly one Testnet wallet confirmation.</span>
        </div>
        <div className="transaction-step-list">
          {(plan?.calls || []).map((call: ProviderCall, index: number) => {
            const runtime = steps[index] || { status: 'idle' as const };
            return (
              <article className={`transaction-step is-${runtime.status}`} key={call.step}>
                <div className="transaction-step-index">{String(call.step).padStart(2, '0')}</div>
                <div className="transaction-step-copy">
                  <strong>{call.what}</strong>
                  <small>to {compact(call.to)} | value 0</small>
                  {runtime.txHash ? (
                    <a href={`${CONFIG.explorerUrl}/tx/${runtime.txHash}`} target="_blank" rel="noreferrer">
                      {compact(runtime.txHash)} OPEN
                    </a>
                  ) : null}
                  {runtime.error ? <em>{runtime.error}</em> : null}
                </div>
                <span className="transaction-state-label">{stateLabel(runtime.status)}</span>
              </article>
            );
          })}
        </div>
        {!allFunded && currentCall ? (
          <button
            type="button"
            className="retro-button primary simple-primary-action"
            disabled={!canExecute || runningStep !== null}
            onClick={() => void runStep(nextStep)}
          >
            {runningStep !== null ? 'WAITING FOR WALLET...' : `NEXT ${nextStep + 1}/5 · ${currentCall.what}`}
          </button>
        ) : null}
        {steps[0]?.status === 'confirmed' && !jobId ? (
          <button type="button" className="retro-button" onClick={() => void recoverJobId()}>
            RECOVER CONFIRMED JOB ID
          </button>
        ) : null}
        {jobId ? (
          <div className="hire-alert is-success">
            JOB #{jobId} | {providerSnapshot?.job?.status || 'SYNCING'}
          </div>
        ) : null}
      </section>

      {(allFunded || Boolean(providerSnapshot?.job)) ? (
      <section className="hire-step-panel">
        <div className="hire-step-heading">
          <span>03</span>
          <div>
            <strong>Run agent + settle</strong>
            <small>The server signs only the allowlisted Testnet provider actions</small>
          </div>
        </div>
        <div className="provider-action-grid">
          <button
            type="button"
            className="retro-button primary provider-action-button"
            disabled={!allFunded || !providerSnapshot?.canSubmit || providerAction !== null}
            onClick={() => void runProviderAction('submit')}
          >
            {providerAction === 'submit' ? 'SUBMITTING...' : 'RUN AGENT + SUBMIT RESULT'}
          </button>
          <button
            type="button"
            className="retro-button provider-action-button"
            disabled={!providerSnapshot?.canSettle || providerAction !== null}
            onClick={() => void runProviderAction('settle')}
          >
            {providerAction === 'settle' ? 'SETTLING...' : 'SETTLE TESTNET JOB'}
          </button>
        </div>
        {providerSnapshot?.job?.status === 'SUBMITTED' && typeof secondsUntilSettle === 'number' ? (
          <div className="hire-alert is-warning">
            DISPUTE WINDOW | {Math.floor(secondsUntilSettle / 60)}m {secondsUntilSettle % 60}s remaining
          </div>
        ) : null}
        {providerSnapshot?.job ? (
          <div className="hire-facts-grid">
            <div><span>JOB</span><strong>#{providerSnapshot.job.id}</strong></div>
            <div><span>STATUS</span><strong>{providerSnapshot.job.status}</strong></div>
            <div><span>BUDGET</span><strong>{providerSnapshot.job.budgetDisplay}</strong></div>
            <div><span>POLICY</span><strong>15 MIN OPTIMISTIC</strong></div>
          </div>
        ) : null}
        {providerResult && resultView ? <StrategyResultCard result={resultView} /> : null}
      </section>
      ) : null}

      <div className="execution-status-line" role="status">
        <span className={runningStep !== null || providerAction ? 'status-lamp is-busy' : 'status-lamp'} />
        <strong>{message}</strong>
      </div>
      <div className="hire-footer-actions">
        <a className="retro-button" href={CONFIG.explorerUrl} target="_blank" rel="noreferrer">OPEN TESTNET BSCSCAN</a>
        <button type="button" className="retro-button" disabled={!hasProgress && !jobId} onClick={resetProgress}>
          CLEAR LOCAL PROGRESS
        </button>
      </div>
    </div>
  );
}
