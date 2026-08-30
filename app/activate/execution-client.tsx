'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BSC_MAINNET,
  BSC_TESTNET,
  ensureBscNetwork,
  ensureBscMainnet,
  getInjectedProvider,
  useBscWallet,
  walletError,
} from '@/components/use-bsc-wallet';
import { bindJobId, ERC8183, ERC8183_TESTNET, type ProviderCall, type SafeHirePlan } from '@/lib/erc8183';
import { TestnetHireConsole } from '@/app/activate/testnet-execution-client';

type HireExecutionConsoleProps = {
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

type StoredProgress = {
  tokenId: string;
  task: string;
  jobId: string | null;
  steps: RuntimeStep[];
};

type TestnetReadinessReport = {
  observedAt: string;
  network: {
    chainId: number;
    name: string;
    blockNumber: number;
    explorerUrl: string;
  };
  contracts: {
    kernel: string;
    router: string;
    policy: string;
    paymentToken: string;
  };
  protocol: {
    jobCounter: string;
    disputeWindowSeconds: number;
  };
  integrity: {
    passed: boolean;
    checks: WalletCheck[];
  };
  execution: {
    enabled: boolean;
    blocker: string;
  };
  error?: string;
};

const freshSteps = (): RuntimeStep[] => Array.from({ length: 5 }, () => ({ status: 'idle' }));

function addressWord(address: string) {
  return address.replace(/^0x/, '').toLowerCase().padStart(64, '0');
}

function decodedAddress(value: string) {
  return '0x' + value.replace(/^0x/, '').slice(-40);
}

function formatUnits(value: bigint, decimals = 18, precision = 5) {
  const base = BigInt(10) ** BigInt(decimals);
  const whole = value / base;
  const remainder = (value % base).toString().padStart(decimals, '0').slice(0, precision).replace(/0+$/, '');
  return remainder ? `${whole}.${remainder}` : String(whole);
}

function compact(value: string) {
  return value.slice(0, 8) + '...' + value.slice(-6);
}

function stateLabel(status: RuntimeStep['status']) {
  if (status === 'pending') return 'WAITING';
  if (status === 'confirmed') return 'DONE';
  if (status === 'failed') return 'RETRY';
  return 'READY';
}

export function HireExecutionConsole(props: HireExecutionConsoleProps) {
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');

  return (
    <>
      <section className="network-mode-panel" aria-label="Execution network">
        <div>
          <p className="eyebrow">NETWORK SELECT</p>
          <strong>Choose the money environment before connecting a wallet.</strong>
        </div>
        <div className="network-mode-buttons">
          <button className={`win95-button ${network === 'testnet' ? 'is-selected' : ''}`} type="button" onClick={() => setNetwork('testnet')}>
            TESTNET · SAFE START
          </button>
          <button className={`win95-button ${network === 'mainnet' ? 'is-selected' : ''}`} type="button" onClick={() => setNetwork('mainnet')}>
            MAINNET · REAL FUNDS
          </button>
        </div>
      </section>
      {network === 'testnet'
        ? <TestnetHireConsole {...props} />
        : <MainnetHireExecutionConsole {...props} />}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- retained temporarily for rollback of the new live Testnet console
function TestnetReadinessConsole({ tokenId, agentName }: Pick<HireExecutionConsoleProps, 'tokenId' | 'agentName'>) {
  const wallet = useBscWallet();
  const [report, setReport] = useState<TestnetReadinessReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);
  const [walletChecks, setWalletChecks] = useState<WalletCheck[]>([]);
  const [checkingWallet, setCheckingWallet] = useState(false);
  const [message, setMessage] = useState('No transaction has been sent.');

  const loadReadiness = useCallback(async () => {
    setLoading(true);
    setReportError(null);
    try {
      const response = await fetch('/api/hire/testnet-readiness', { cache: 'no-store' });
      const body = await response.json() as TestnetReadinessReport;
      if (!response.ok || !body.integrity?.passed) throw new Error(body.error || 'Testnet contracts failed verification.');
      setReport(body);
      setMessage('Chain 97 contracts verified live. No transaction has been sent.');
    } catch (error) {
      setReport(null);
      setReportError(error instanceof Error ? error.message : 'Testnet readiness unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReadiness(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReadiness]);

  const checkWallet = useCallback(async () => {
    if (!report?.integrity.passed) return;
    setCheckingWallet(true);
    setWalletChecks([]);
    try {
      const provider = getInjectedProvider();
      let activeAccount = wallet.account;
      if (!activeAccount) activeAccount = await wallet.connect();
      if (!activeAccount) throw new Error('No wallet account was selected.');
      await ensureBscNetwork(provider, BSC_TESTNET);
      await wallet.refresh();

      const balanceCall = ERC8183_TESTNET.selectors.balanceOf + addressWord(activeAccount);
      const [chainHex, bnbHex, tokenHex, kernelCode, routerCode, policyCode, tokenCode, paymentTokenHex] = await Promise.all([
        provider.request({ method: 'eth_chainId' }) as Promise<string>,
        provider.request({ method: 'eth_getBalance', params: [activeAccount, 'latest'] }) as Promise<string>,
        provider.request({ method: 'eth_call', params: [{ to: ERC8183_TESTNET.paymentToken, data: balanceCall }, 'latest'] }) as Promise<string>,
        provider.request({ method: 'eth_getCode', params: [ERC8183_TESTNET.kernel, 'latest'] }) as Promise<string>,
        provider.request({ method: 'eth_getCode', params: [ERC8183_TESTNET.router, 'latest'] }) as Promise<string>,
        provider.request({ method: 'eth_getCode', params: [ERC8183_TESTNET.policy, 'latest'] }) as Promise<string>,
        provider.request({ method: 'eth_getCode', params: [ERC8183_TESTNET.paymentToken, 'latest'] }) as Promise<string>,
        provider.request({ method: 'eth_call', params: [{ to: ERC8183_TESTNET.kernel, data: ERC8183_TESTNET.selectors.paymentToken }, 'latest'] }) as Promise<string>,
      ]);
      const chainId = Number.parseInt(chainHex, 16);
      const bnb = BigInt(bnbHex);
      const token = BigInt(tokenHex);
      const checks: WalletCheck[] = [
        { label: 'BSC Testnet', pass: chainId === ERC8183_TESTNET.chainId, observed: `chain ${chainId}` },
        { label: 'Contract code', pass: [kernelCode, routerCode, policyCode, tokenCode].every((code) => code.length > 2), observed: 'kernel / router / policy / token' },
        { label: 'Kernel token', pass: decodedAddress(paymentTokenHex).toLowerCase() === ERC8183_TESTNET.paymentToken.toLowerCase(), observed: compact(decodedAddress(paymentTokenHex)) },
        { label: 'tBNB gas reserve', pass: bnb >= BigInt('2000000000000000'), observed: `${formatUnits(bnb)} tBNB` },
        { label: 'Test $U balance', pass: token >= BigInt(ERC8183_TESTNET.amountAtomic), observed: `${formatUnits(token)} test $U` },
      ];
      setWalletChecks(checks);
      setMessage(checks.every((check) => check.pass)
        ? 'Testnet wallet is funded and ready. Provider connection is the only remaining execution gate.'
        : 'Testnet wallet check stopped at a missing balance or contract requirement. Nothing was sent.');
    } catch (error) {
      setWalletChecks([{ label: 'Wallet preflight', pass: false, observed: walletError(error) }]);
      setMessage('Testnet wallet preflight failed. No transaction was sent.');
    } finally {
      setCheckingWallet(false);
    }
  }, [report, wallet]);

  const walletReady = walletChecks.length > 0 && walletChecks.every((check) => check.pass);

  return (
    <section className="hire-console testnet-console" aria-labelledby="testnet-console-title">
      <header className="panel-heading hire-console-heading">
        <div><p className="eyebrow">GRABIT.EXE / TEST LAB</p><h2 id="testnet-console-title">BSC Testnet readiness</h2></div>
        <span className="protocol-pill is-testnet">CHAIN 97 · TEST TOKENS</span>
      </header>

      <div className="hire-console-grid">
        <div className="hire-plan-pane">
          <div className="testnet-stage-summary">
            <span>SELECTED AGENT</span>
            <strong>#{tokenId} · {agentName}</strong>
            <p>We verify the real APEX deployment and your wallet first. Hire transactions stay locked until a chain-97 Agent provider is connected.</p>
          </div>

          <button className="win95-button" type="button" onClick={() => void loadReadiness()} disabled={loading}>
            {loading ? 'CHECKING CHAIN 97...' : 'REFRESH LIVE CONTRACT CHECK'}
          </button>
          {reportError && <div className="hire-alert is-error"><strong>TESTNET CHECK BLOCKED</strong><p>{reportError}</p></div>}

          {report && (
            <>
              <div className="quote-ticket testnet-ticket">
                <span>LIVE TESTNET</span><strong>{report.integrity.checks.filter((check) => check.pass).length} / {report.integrity.checks.length} PASS</strong>
                <dl>
                  <div><dt>Chain</dt><dd>{report.network.chainId}</dd></div>
                  <div><dt>Block</dt><dd>{report.network.blockNumber.toLocaleString()}</dd></div>
                  <div><dt>Jobs</dt><dd>{report.protocol.jobCounter}</dd></div>
                  <div><dt>Window</dt><dd>{report.protocol.disputeWindowSeconds / 60} min</dd></div>
                </dl>
              </div>
              <details className="integrity-details" open>
                <summary>{report.integrity.checks.length} live contract checks</summary>
                <div>{report.integrity.checks.map((check) => <p key={check.label}><b>{check.pass ? 'PASS' : 'FAIL'}</b> {check.label}<small>{check.observed}</small></p>)}</div>
              </details>
            </>
          )}

          <div className="wallet-preflight">
            <header><strong>TESTNET WALLET</strong><span>{wallet.account ? compact(wallet.account) : 'NOT CONNECTED'}</span></header>
            <button className="win95-button" type="button" disabled={!report || checkingWallet || !wallet.hasProvider} onClick={() => void checkWallet()}>
              {checkingWallet ? 'CHECKING...' : wallet.account ? 'SWITCH TO CHAIN 97 + CHECK' : 'CONNECT + CHECK TESTNET'}
            </button>
            {!wallet.hasProvider && <p>No injected wallet was detected in this browser.</p>}
            {walletChecks.map((check) => (
              <div className={'wallet-check ' + (check.pass ? 'is-pass' : 'is-fail')} key={check.label}>
                <b>{check.pass ? '✓' : '!'}</b><span>{check.label}<small>{check.observed}</small></span>
              </div>
            ))}
            <div className="testnet-faucet-links">
              <a href={ERC8183_TESTNET.faucets.gas} target="_blank" rel="noreferrer">GET tBNB GAS ↗</a>
              <a href={ERC8183_TESTNET.faucets.token} target="_blank" rel="noreferrer">GET TEST $U ↗</a>
            </div>
          </div>
        </div>

        <div className="hire-steps-pane">
          <div className="testnet-gate-stack">
            <article className={`transaction-step ${report?.integrity.passed ? 'is-confirmed' : 'is-idle'}`}>
              <span className="transaction-number">{report?.integrity.passed ? '✓' : '01'}</span>
              <div><header><strong>APEX contracts</strong><b>{report?.integrity.passed ? 'DONE' : 'CHECK'}</b></header><p>Kernel, router, allowed policy and test token are read directly from chain 97.</p></div>
            </article>
            <article className={`transaction-step ${walletReady ? 'is-confirmed' : 'is-active'}`}>
              <span className="transaction-number">{walletReady ? '✓' : '02'}</span>
              <div><header><strong>Client wallet</strong><b>{walletReady ? 'DONE' : 'NEXT'}</b></header><p>Connect the wallet, switch to BSC Testnet and obtain enough tBNB plus test $U.</p></div>
            </article>
            <article className="transaction-step is-failed">
              <span className="transaction-number">03</span>
              <div><header><strong>Agent provider</strong><b>LOCKED</b></header><p>{report?.execution.blocker || 'Waiting for live chain-97 provider verification.'}</p></div>
            </article>
            <article className="transaction-step">
              <span className="transaction-number">04</span>
              <div><header><strong>Five-step Hire</strong><b>0 / 5</b></header><p>Create → policy → budget → approval → escrow funding. It opens only after all three gates pass.</p></div>
            </article>
          </div>
          <div className="hire-alert is-warning">
            <strong>NO FAKE TEST TRANSACTIONS</strong>
            <p>The external Agent currently quotes only BSC Mainnet. Grabit will not rewrite its chain or addresses and pretend that the quote is valid on Testnet.</p>
          </div>
          <div className="hire-status-line" aria-live="polite"><b>STATUS</b><span>{message}</span></div>
          {report && <a className="testnet-explorer-link" href={`${report.network.explorerUrl}/address/${report.contracts.kernel}`} target="_blank" rel="noreferrer">OPEN TESTNET KERNEL ↗</a>}
        </div>
      </div>
    </section>
  );
}

function MainnetHireExecutionConsole({ tokenId, agentName, defaultTask }: HireExecutionConsoleProps) {
  const wallet = useBscWallet();
  const [task, setTask] = useState(defaultTask);
  const [plan, setPlan] = useState<SafeHirePlan | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [walletChecks, setWalletChecks] = useState<WalletCheck[]>([]);
  const [checkingWallet, setCheckingWallet] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [steps, setSteps] = useState<RuntimeStep[]>(freshSteps);
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [message, setMessage] = useState('No transaction has been sent.');
  const [runningStep, setRunningStep] = useState<number | null>(null);

  const storageKey = useMemo(
    () => wallet.account ? `grabit:erc8183:${tokenId}:${wallet.account.toLowerCase()}` : null,
    [tokenId, wallet.account],
  );
  const hasProgress = steps.some((step) => step.status === 'confirmed' || Boolean(step.txHash));
  const nextStep = steps.findIndex((step) => step.status !== 'confirmed');
  const walletReady = walletChecks.length > 0 && walletChecks.every((check) => check.pass);
  const canExecute = Boolean(plan?.integrity.passed && wallet.account && wallet.isMainnet && walletReady && acknowledged);

  const persist = useCallback((nextSteps: RuntimeStep[], nextJobId: string | null, nextTask = task) => {
    if (!storageKey) return;
    const value: StoredProgress = { tokenId, task: nextTask, jobId: nextJobId, steps: nextSteps };
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  }, [storageKey, task, tokenId]);

  useEffect(() => {
    if (!storageKey) return;
    const restoreTimer = window.setTimeout(() => {
      try {
        const stored = JSON.parse(window.localStorage.getItem(storageKey) || 'null') as StoredProgress | null;
        if (stored?.tokenId === tokenId && Array.isArray(stored.steps) && stored.steps.length === 5) {
          setTask(stored.task || defaultTask);
          setSteps(stored.steps.map((step) => step.status === 'pending' ? { ...step, status: 'failed' } : step));
          setJobId(stored.jobId || null);
          setMessage(stored.jobId ? `Resumed local record for Job #${stored.jobId}. Verify each transaction on BscScan.` : 'Resumed an incomplete local hire record.');
        }
      } catch {
        setMessage('Saved local progress was unreadable. No transaction was sent.');
      }
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, [defaultTask, storageKey, tokenId]);

  const loadQuote = useCallback(async () => {
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const response = await fetch(`/api/hire/quote?registry=${encodeURIComponent(tokenId)}&task=${encodeURIComponent(task)}`, { cache: 'no-store' });
      const body = await response.json() as SafeHirePlan & { error?: string };
      if (!response.ok || !body.integrity?.passed) throw new Error(body.error || 'The plan failed its execution allowlist.');
      setPlan(body);
      setMessage('Live quote and BSC contracts verified. Still no transaction sent.');
    } catch (error) {
      setPlan(null);
      setQuoteError(error instanceof Error ? error.message : 'Live quote unavailable.');
    } finally {
      setQuoteLoading(false);
    }
  }, [task, tokenId]);

  useEffect(() => {
    const quoteTimer = window.setTimeout(() => void loadQuote(), 0);
    return () => window.clearTimeout(quoteTimer);
  // A new quote is intentionally requested only when the identity changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId]);

  const checkWallet = useCallback(async (accountOverride?: string | null) => {
    if (!plan) throw new Error('Verify a live quote first.');
    setCheckingWallet(true);
    setWalletChecks([]);
    try {
      const provider = getInjectedProvider();
      let activeAccount = accountOverride || wallet.account;
      if (!activeAccount) activeAccount = await wallet.connect();
      if (!activeAccount) throw new Error('No wallet account was selected.');
      await ensureBscMainnet(provider);
      await wallet.refresh();

      const balanceCall = ERC8183.selectors.balanceOf + addressWord(activeAccount);
      const first = plan.calls[0];
      const approval = plan.calls[3];
      if (!first?.data || !approval?.data) throw new Error('The verified quote is missing ready call data.');
      const [chainHex, bnbHex, tokenHex, gasPriceHex, kernelCode, routerCode, policyCode, tokenCode, paymentTokenHex, createGasHex, approveGasHex] = await Promise.all([
        provider.request({ method: 'eth_chainId' }) as Promise<string>,
        provider.request({ method: 'eth_getBalance', params: [activeAccount, 'latest'] }) as Promise<string>,
        provider.request({ method: 'eth_call', params: [{ to: ERC8183.paymentToken, data: balanceCall }, 'latest'] }) as Promise<string>,
        provider.request({ method: 'eth_gasPrice' }) as Promise<string>,
        provider.request({ method: 'eth_getCode', params: [ERC8183.kernel, 'latest'] }) as Promise<string>,
        provider.request({ method: 'eth_getCode', params: [ERC8183.router, 'latest'] }) as Promise<string>,
        provider.request({ method: 'eth_getCode', params: [ERC8183.policy, 'latest'] }) as Promise<string>,
        provider.request({ method: 'eth_getCode', params: [ERC8183.paymentToken, 'latest'] }) as Promise<string>,
        provider.request({ method: 'eth_call', params: [{ to: ERC8183.kernel, data: ERC8183.selectors.paymentToken }, 'latest'] }) as Promise<string>,
        provider.request({ method: 'eth_estimateGas', params: [{ from: activeAccount, to: first.to, data: first.data, value: '0x0' }] }) as Promise<string>,
        provider.request({ method: 'eth_estimateGas', params: [{ from: activeAccount, to: approval.to, data: approval.data, value: '0x0' }] }) as Promise<string>,
      ]);
      const bnb = BigInt(bnbHex);
      const token = BigInt(tokenHex);
      const gasPrice = BigInt(gasPriceHex);
      const measuredGas = BigInt(createGasHex) + BigInt(approveGasHex);
      const conservativeGas = (measuredGas + BigInt(500_000)) * gasPrice * BigInt(125) / BigInt(100);
      const planAgeSeconds = Math.floor((Date.now() - new Date(plan.observedAt).getTime()) / 1000);
      const checks: WalletCheck[] = [
        { label: 'Fresh plan', pass: planAgeSeconds >= 0 && planAgeSeconds < 300, observed: `${planAgeSeconds}s old` },
        { label: 'BSC mainnet', pass: Number.parseInt(chainHex, 16) === ERC8183.chainId, observed: `chain ${Number.parseInt(chainHex, 16)}` },
        { label: 'Contract code', pass: [kernelCode, routerCode, policyCode, tokenCode].every((code) => code.length > 2), observed: 'kernel / router / policy / token' },
        { label: 'Kernel token', pass: decodedAddress(paymentTokenHex).toLowerCase() === ERC8183.paymentToken.toLowerCase(), observed: compact(decodedAddress(paymentTokenHex)) },
        { label: '$U balance', pass: token >= BigInt(ERC8183.amountAtomic), observed: `${formatUnits(token)} $U` },
        { label: 'BNB gas reserve', pass: bnb >= conservativeGas, observed: `${formatUnits(bnb)} BNB (guard ${formatUnits(conservativeGas)} BNB)` },
        { label: 'Simulation', pass: BigInt(createGasHex) > BigInt(0) && BigInt(approveGasHex) > BigInt(0), observed: `create ${Number(BigInt(createGasHex)).toLocaleString()} + approve ${Number(BigInt(approveGasHex)).toLocaleString()} gas` },
      ];
      setWalletChecks(checks);
      setMessage(checks.every((check) => check.pass) ? 'Wallet preflight passed. Review the warning and sign one step at a time.' : 'Wallet preflight stopped execution. Fix the failed item; nothing was sent.');
    } catch (error) {
      setWalletChecks([{ label: 'Wallet preflight', pass: false, observed: walletError(error) }]);
      setMessage('Preflight failed. No transaction was sent.');
    } finally {
      setCheckingWallet(false);
    }
  }, [plan, wallet]);

  const findCreatedJob = useCallback(async (client: string) => {
    if (!plan) return null;
    const provider = getInjectedProvider();
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const counterHex = await provider.request({ method: 'eth_call', params: [{ to: ERC8183.kernel, data: ERC8183.selectors.jobCounter }, 'latest'] }) as string;
      const top = BigInt(counterHex);
      for (let offset = BigInt(0); offset < BigInt(8) && top > offset; offset += BigInt(1)) {
        const candidateId = String(top - offset);
        const response = await fetch(`/api/hire/job?jobId=${candidateId}`, { cache: 'no-store' });
        if (!response.ok) continue;
        const candidateJob = await response.json() as Record<string, unknown>;
        let description: { task?: unknown; service?: unknown } = {};
        try { description = JSON.parse(String(candidateJob.description || '{}')) as { task?: unknown; service?: unknown }; } catch { description = {}; }
        if (
          String(candidateJob.client || '').toLowerCase() === client.toLowerCase()
          && String(candidateJob.provider || '').toLowerCase() === plan.provider.toLowerCase()
          && String(candidateJob.evaluator || '').toLowerCase() === ERC8183.router.toLowerCase()
          && String(candidateJob.hook || '').toLowerCase() === ERC8183.router.toLowerCase()
          && description.task === plan.task
          && description.service === plan.candidate.serviceId
        ) return candidateId;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 800));
    }
    return null;
  }, [plan]);

  const refreshJob = useCallback(async (idOverride?: string | null) => {
    const id = idOverride || jobId;
    if (!id) return;
    const response = await fetch(`/api/hire/job?jobId=${id}`, { cache: 'no-store' });
    const body = await response.json() as Record<string, unknown> & { error?: string };
    if (!response.ok) throw new Error(body.error || 'Job status unavailable.');
    setJob(body);
  }, [jobId]);

  useEffect(() => {
    if (!jobId) return;
    const jobTimer = window.setTimeout(() => void refreshJob().catch(() => undefined), 0);
    return () => window.clearTimeout(jobTimer);
  }, [jobId, refreshJob]);

  const runStep = useCallback(async (index: number) => {
    if (!plan || !wallet.account) return;
    if (index !== nextStep) {
      setMessage('Complete the preceding step first. No transaction was sent.');
      return;
    }
    if (!canExecute) {
      setMessage('Quote, wallet preflight and the risk acknowledgement must all pass first.');
      return;
    }
    const call: ProviderCall = plan.calls[index];
    if (!call) return;
    let transactionConfirmed = false;
    let sentHash: string | undefined;
    setRunningStep(index);
    setMessage(index === 4 ? 'Funding is the spending step. Confirm the exact 0.10 $U call in your wallet.' : 'Simulating this exact call before opening the wallet...');
    try {
      const provider = getInjectedProvider();
      await ensureBscMainnet(provider);
      if (index === 0 && Date.now() - new Date(plan.observedAt).getTime() >= 10 * 60_000) {
        throw new Error('The execution plan is older than ten minutes. Refresh the quote and rerun wallet checks.');
      }
      if (Math.floor(Date.now() / 1000) >= plan.quote.expiresAt) {
        throw new Error('The escrow expiry embedded in this plan has passed. Refresh the quote.');
      }
      let data = call.data;
      if (!data && call.data_template) {
        if (!jobId) throw new Error('Job ID is unknown. Recover it before continuing.');
        data = bindJobId(call.data_template, jobId);
      }
      if (!data) throw new Error('This quote has no call data for the selected step.');
      const tx = { from: wallet.account, to: call.to, data, value: call.value || '0x0' };
      await provider.request({ method: 'eth_estimateGas', params: [tx] });
      const txHash = String(await provider.request({ method: 'eth_sendTransaction', params: [tx] }));
      sentHash = txHash;
      const pending = steps.map((step, stepIndex) => stepIndex === index ? { status: 'pending' as const, txHash } : step);
      setSteps(pending);
      persist(pending, jobId);
      setMessage(`Transaction ${compact(txHash)} sent. Waiting for confirmation...`);
      await wallet.waitForReceipt(txHash);
      transactionConfirmed = true;
      const confirmed = pending.map((step, stepIndex) => stepIndex === index ? { status: 'confirmed' as const, txHash } : step);
      setSteps(confirmed);

      let activeJobId = jobId;
      if (index === 0) {
        activeJobId = await findCreatedJob(wallet.account);
        if (!activeJobId) {
          persist(confirmed, null);
          throw new Error('Create confirmed, but the matching Job ID was not located yet. Use Recover Job ID; do not create another job.');
        }
        setJobId(activeJobId);
        setMessage(`Job #${activeJobId} belongs to this wallet. Continue with policy binding.`);
      } else {
        setMessage(index === 4 ? `Job #${activeJobId} funded. Requesting provider delivery...` : `Step ${index + 1} confirmed. No later step was sent automatically.`);
      }
      persist(confirmed, activeJobId);

      if (index === 4 && activeJobId) {
        const response = await fetch('/api/hire/notify', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jobId: activeJobId }),
        });
        setMessage(response.ok
          ? `Job #${activeJobId} is funded and delivery was requested. SUBMITTED means a deliverable exists; COMPLETED means escrow released.`
          : `Job #${activeJobId} is funded, but delivery notification failed. Funds remain in escrow; retry notification before creating anything else.`);
        await refreshJob(activeJobId).catch(() => undefined);
      }
    } catch (error) {
      const description = walletError(error);
      if (!transactionConfirmed) {
        const failed = steps.map((step, stepIndex) => stepIndex === index ? { ...step, status: 'failed' as const, error: description, ...(sentHash ? { txHash: sentHash } : {}) } : step);
        setSteps(failed);
        persist(failed, jobId);
      }
      setMessage(description);
    } finally {
      setRunningStep(null);
    }
  }, [canExecute, findCreatedJob, jobId, nextStep, persist, plan, refreshJob, steps, wallet]);

  const recoverJobId = useCallback(async () => {
    if (!wallet.account) return;
    setMessage('Searching the last eight jobs and verifying the client and provider...');
    const recovered = await findCreatedJob(wallet.account).catch(() => null);
    if (!recovered) {
      setMessage('No matching recent Job was found. Inspect the Create transaction on BscScan; do not create another job yet.');
      return;
    }
    setJobId(recovered);
    persist(steps, recovered);
    setMessage(`Recovered Job #${recovered}.`);
  }, [findCreatedJob, persist, steps, wallet.account]);

  return (
    <section className="hire-console" aria-labelledby="hire-console-title">
      <header className="panel-heading hire-console-heading">
        <div><p className="eyebrow">GRABIT.EXE / SAFE MODE</p><h2 id="hire-console-title">Live hire console</h2></div>
        <span className="protocol-pill">MAINNET · REAL FUNDS</span>
      </header>

      <div className="hire-console-grid">
        <div className="hire-plan-pane">
          <label className="hire-task-field">
            <span>READ-ONLY CANARY TASK</span>
            <textarea value={task} onChange={(event) => setTask(event.target.value)} disabled={hasProgress} rows={5} maxLength={320} />
          </label>
          <button className="win95-button" type="button" onClick={() => void loadQuote()} disabled={quoteLoading || hasProgress}>
            {quoteLoading ? 'VERIFYING LIVE QUOTE...' : 'REFRESH LIVE QUOTE'}
          </button>

          {quoteError && <div className="hire-alert is-error"><strong>QUOTE BLOCKED</strong><p>{quoteError}</p></div>}
          {plan && (
            <>
              <div className="quote-ticket">
                <span>LIVE QUOTE</span><strong>{plan.quote.display}</strong>
                <dl>
                  <div><dt>Agent</dt><dd>#{plan.candidate.tokenId}</dd></div>
                  <div><dt>Service</dt><dd>{plan.candidate.serviceId}</dd></div>
                  <div><dt>Provider</dt><dd>{compact(plan.provider)}</dd></div>
                  <div><dt>Expiry</dt><dd>{new Date(plan.quote.expiresAt * 1000).toLocaleString()}</dd></div>
                </dl>
              </div>
              <div className="hire-alert is-warning">
                <strong>{plan.quote.signed ? 'SIGNED PROVIDER QUOTE' : 'UNSIGNED PROVIDER QUOTE'}</strong>
                <p>{plan.integrity.warning}</p>
              </div>
              <details className="integrity-details">
                <summary>{plan.integrity.checks.filter((check) => check.pass).length} / {plan.integrity.checks.length} plan and contract checks passed</summary>
                <div>{plan.integrity.checks.map((check) => <p key={check.label}><b>{check.pass ? 'PASS' : 'FAIL'}</b> {check.label}<small>{check.observed}</small></p>)}</div>
              </details>
            </>
          )}

          <div className="wallet-preflight">
            <header><strong>WALLET PREFLIGHT</strong><span>{wallet.account ? compact(wallet.account) : 'NOT CONNECTED'}</span></header>
            <button className="win95-button" type="button" disabled={!plan || checkingWallet || !wallet.hasProvider} onClick={() => void checkWallet()}>
              {checkingWallet ? 'CHECKING...' : wallet.account ? 'SWITCH TO BSC + RUN CHECKS' : 'CONNECT + RUN CHECKS'}
            </button>
            {!wallet.hasProvider && <p>No injected wallet was detected in this browser.</p>}
            {walletChecks.map((check) => (
              <div className={'wallet-check ' + (check.pass ? 'is-pass' : 'is-fail')} key={check.label}>
                <b>{check.pass ? '✓' : '!'}</b><span>{check.label}<small>{check.observed}</small></span>
              </div>
            ))}
            {walletChecks.some((check) => check.label === '$U balance' && !check.pass) && (
              <a className="external-funding-link" href={`https://pancakeswap.finance/swap?outputCurrency=${ERC8183.paymentToken}`} target="_blank" rel="noreferrer">Get $U on PancakeSwap ↗</a>
            )}
          </div>

          <label className="risk-acknowledgement">
            <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />
            <span>I understand that steps 1–4 cost BNB gas, step 5 escrows exactly 0.10 $U, the quote is currently unsigned, and settlement can remain pending through the 7-day dispute window.</span>
          </label>
        </div>

        <div className="hire-steps-pane">
          <div className="hire-agent-summary">
            <pre aria-hidden="true">{'   .-----------------.\n  /  [ AGENT SLOT ]  \\\n |   > ' + tokenId.padEnd(12, ' ') + '|\n  \\_________________/'}</pre>
            <div><span>SELECTED</span><strong>{agentName}</strong><small>Only one transaction is exposed at a time.</small></div>
          </div>

          <div className="transaction-stack">
            {(plan?.calls || Array.from({ length: 5 }, (_, index) => ({ step: index + 1, what: ['Create the job', 'Bind dispute policy', 'Set the budget', 'Approve exact $U', 'Fund the escrow'][index], to: '', data: null }))).map((call, index) => {
              const runtime = steps[index];
              const active = nextStep === index;
              const disabled = !canExecute || !active || runningStep !== null || (index > 0 && !jobId);
              return (
                <article className={`transaction-step is-${runtime.status} ${active ? 'is-active' : ''}`} key={call.step}>
                  <span className="transaction-number">{runtime.status === 'confirmed' ? '✓' : String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <header><strong>{call.what}</strong><b>{stateLabel(runtime.status)}</b></header>
                    <p>{call.note || 'Live call details appear after quote verification.'}</p>
                    {call.to && <small>TO {call.to}</small>}
                    {runtime.txHash && <a href={`${BSC_MAINNET.explorerUrl}/tx/${runtime.txHash}`} target="_blank" rel="noreferrer">{compact(runtime.txHash)} · BscScan ↗</a>}
                    {runtime.error && <em>{runtime.error}</em>}
                    {active && (
                      <button className={index === 4 ? 'win95-button is-spend' : 'win95-button'} type="button" disabled={disabled} onClick={() => void runStep(index)}>
                        {runningStep === index ? 'WAITING FOR WALLET / CHAIN...' : index === 4 ? 'SIGN FUND 0.10 $U' : `SIGN STEP ${index + 1}`}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hire-status-line" aria-live="polite"><b>STATUS</b><span>{message}</span></div>
          {steps[0].status === 'confirmed' && !jobId && <button className="win95-button" type="button" onClick={() => void recoverJobId()}>RECOVER JOB ID</button>}

          {jobId && (
            <div className="job-monitor">
              <header><div><span>ERC-8183 JOB</span><strong>#{jobId}</strong></div><button type="button" onClick={() => void refreshJob().catch((error) => setMessage(walletError(error)))}>REFRESH STATUS</button></header>
              <dl>
                <div><dt>Status</dt><dd>{String(job?.status || 'CREATED / LOADING')}</dd></div>
                <div><dt>Budget</dt><dd>{String(job?.budget_display || job?.budget || '0.10 $U')}</dd></div>
                <div><dt>Deliverable</dt><dd>{job?.deliverable ? compact(String(job.deliverable)) : 'NOT OBSERVED'}</dd></div>
                <div><dt>Refund after</dt><dd>{plan ? new Date(plan.quote.expiresAt * 1000).toLocaleString() : 'QUOTE EXPIRY'}</dd></div>
              </dl>
              <a href={`https://agent.brainonbnb.com/job?id=${jobId}`} target="_blank" rel="noreferrer">Open provider tracker ↗</a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
