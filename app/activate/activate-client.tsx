'use client';

import { FormEvent, useMemo, useState } from 'react';
import { PrototypeNote } from '@/components/prototype-note';
import { SiteHeader } from '@/components/site-header';
import { BSC_TESTNET, useBscWallet } from '@/components/use-bsc-wallet';
import { agents } from '@/lib/agents';

export function ActivateClient({ initialSlug, registryToken }: { initialSlug?: string; registryToken?: string }) {
  const startingSlug = initialSlug && agents.some((agent) => agent.slug === initialSlug) ? initialSlug : agents[0].slug;
  const [slug, setSlug] = useState(startingSlug);
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('250');
  const [spendCap, setSpendCap] = useState('100');
  const [expiry, setExpiry] = useState('7');
  const [slippage, setSlippage] = useState('0.5');
  const [confirmed, setConfirmed] = useState(false);
  const [activated, setActivated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState('Submitted');
  const [txError, setTxError] = useState<string | null>(null);
  const { account, hasProvider, connecting, isTestnet, error: walletError, connect, sendActivationProof, waitForReceipt } = useBscWallet();
  const connected = Boolean(account && isTestnet);
  const agent = useMemo(() => agents.find((item) => item.slug === slug) ?? agents[0], [slug]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step < 3) {
      setStep((value) => value + 1);
      return;
    }
    setSubmitting(true);
    setTxError(null);
    try {
      const proof = [
        'AGENT_MARKET_ACTIVATION_V1',
        'registry=' + (registryToken ?? 'reference'),
        'agent=' + agent.slug,
        'allocation=' + amount + 'USDT',
        'spendCap=' + spendCap + 'USDT',
        'expiry=' + expiry + 'd',
      ].join('|');
      const hash = await sendActivationProof(proof);
      setTxHash(hash);
      setTxStatus('Submitted');
      setActivated(true);
      window.localStorage.setItem('agent-market-last-proof', JSON.stringify({
        hash,
        agent: agent.name,
        registryToken: registryToken ?? null,
        account,
        chainId: BSC_TESTNET.chainId,
        createdAt: new Date().toISOString(),
      }));
      void waitForReceipt(hash).then((receipt) => {
        if (receipt) setTxStatus('Confirmed');
      }).catch(() => undefined);
    } catch (nextError) {
      setTxError(nextError instanceof Error ? nextError.message : 'The testnet transaction was not completed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="subpage">
      <SiteHeader />
      <div className="activate-shell">
        <PrototypeNote />
        <a className="breadcrumb back-link" href={'/agents/' + agent.slug}>← Back to {agent.name}</a>

        <div className="activate-layout">
          <section>
            <header className="activate-header">
              <p className="eyebrow">ERC-8183 hire flow</p>
              <h1>Configure your agent.</h1>
              <p>Set the task, budget and boundaries. You keep control of every permission.</p>
            </header>

            <div className="stepper" aria-label="Activation progress">
              {['Configure', 'Permissions', 'Review'].map((label, index) => (
                <div className={step >= index + 1 ? 'active' : ''} key={label}>
                  <span>{step > index + 1 ? '✓' : index + 1}</span>
                  <p>{label}</p>
                </div>
              ))}
            </div>

            <form className="activation-form" onSubmit={submit}>
              {step === 1 && (
                <div className="form-panel">
                  <div className="form-heading"><h2>Agent & strategy</h2><span>Step 1 of 3</span></div>
                  <label className="field">
                    <span>Choose agent</span>
                    <select value={slug} onChange={(event) => setSlug(event.target.value)}>
                      {agents.map((item) => <option value={item.slug} key={item.slug}>{item.name} · {item.category}</option>)}
                    </select>
                  </label>
                  <div className="form-grid">
                    <label className="field">
                      <span>Capital allocation</span>
                      <div className="input-affix"><input type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} /><strong>USDT</strong></div>
                    </label>
                    <label className="field">
                      <span>Max price impact</span>
                      <div className="input-affix"><input type="number" min="0.1" step="0.1" value={slippage} onChange={(event) => setSlippage(event.target.value)} /><strong>%</strong></div>
                    </label>
                  </div>
                  <label className="field">
                    <span>Instruction</span>
                    <textarea defaultValue={'Run ' + agent.strategy.toLowerCase() + ' Pause and return funds if any configured risk gate is breached.'} />
                  </label>
                  <button className={connected ? 'connect-card connected' : 'connect-card'} type="button" onClick={() => void connect().catch(() => undefined)} disabled={connecting}>
                    <span className="wallet-symbol">{connected ? '✓' : '◇'}</span>
                    <span><strong>{connected && account ? account.slice(0, 8) + '...' + account.slice(-6) : hasProvider ? 'Connect wallet to continue' : 'Browser wallet not detected'}</strong><small>{connected ? 'BSC Testnet · Self-custodial' : 'Connection does not send a transaction'}</small></span>
                    <b>{connecting ? 'Waiting...' : connected ? 'Connected' : 'Connect'}</b>
                  </button>
                  {(walletError || txError) && <p className="wallet-error" role="alert">{txError ?? walletError}</p>}
                  <p className="faucet-note">Proof transactions require a small amount of test gas. <a href="https://docs.bnbchain.org/bnb-smart-chain/developers/faucet/" target="_blank" rel="noreferrer">Get tBNB from the official guide ↗</a></p>
                </div>
              )}

              {step === 2 && (
                <div className="form-panel">
                  <div className="form-heading"><h2>Permission boundaries</h2><span>Step 2 of 3</span></div>
                  <div className="permission-intro"><span className="shield-mark">P</span><p><strong>Testnet permission manifest</strong>The proof records these proposed limits. Contract-level enforcement is not enabled yet.</p></div>
                  <label className="field">
                    <span>Allowed contracts</span>
                    <div className="allowlist-box">
                      <div><span className="verified">i</span><p><strong>{agent.protocol}</strong><small>Proposed integration target</small></p><code>REFERENCE_ONLY</code></div>
                      <div><span className="verified">i</span><p><strong>Activation proof</strong><small>Zero-value self-transaction only</small></p><code>BSC_TESTNET</code></div>
                    </div>
                  </label>
                  <div className="form-grid">
                    <label className="field">
                      <span>Daily spend cap</span>
                      <div className="input-affix"><input type="number" min="1" value={spendCap} onChange={(event) => setSpendCap(event.target.value)} /><strong>USDT</strong></div>
                    </label>
                    <label className="field">
                      <span>Session expiry</span>
                      <select value={expiry} onChange={(event) => setExpiry(event.target.value)}>
                        <option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option>
                      </select>
                    </label>
                  </div>
                  <div className="revoke-note"><span>i</span><p><strong>No spending authority is granted</strong>This milestone records a proof only. Altana session creation and revocation remain the next integration.</p></div>
                </div>
              )}

              {step === 3 && (
                <div className="form-panel">
                  <div className="form-heading"><h2>Review activation</h2><span>Step 3 of 3</span></div>
                  <div className="review-agent">
                    <span className={'agent-avatar ' + agent.tone}>{agent.initials}</span>
                    <div><h3>{agent.name} <span className="verified">✓</span></h3><p>{agent.tagline}</p></div>
                    <span className="category-badge">{agent.category}</span>
                  </div>
                  <dl className="review-list">
                    <div><dt>Capital allocation</dt><dd>{Number(amount || 0).toLocaleString()} USDT</dd></div>
                    <div><dt>Daily spend cap</dt><dd>{Number(spendCap || 0).toLocaleString()} USDT</dd></div>
                    <div><dt>Session expiry</dt><dd>{expiry} days</dd></div>
                    <div><dt>Max price impact</dt><dd>{slippage}%</dd></div>
                    <div><dt>Agent job fee</dt><dd>{agent.fee.toFixed(2)} $U</dd></div>
                    <div><dt>Settlement</dt><dd>Proof transaction only</dd></div>
                  </dl>
                  <label className="confirm-row">
                    <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                    <span>I understand this sends a 0 BNB self-transaction on BSC Testnet. It uses testnet gas but grants no spending authority and moves no protocol funds.</span>
                  </label>
                </div>
              )}

              <div className="form-actions">
                {step > 1 ? <button className="secondary-button" type="button" onClick={() => setStep((value) => value - 1)}>Back</button> : <span />}
                <button className="primary-button" type="submit" disabled={(step === 1 && !connected) || (step === 3 && (!confirmed || !connected || submitting))}>
                  {step === 3 ? submitting ? 'Waiting for wallet...' : 'Send proof transaction' : 'Continue'} <span>→</span>
                </button>
              </div>
            </form>
          </section>

          <aside className="activation-summary">
            <p className="eyebrow">Selected agent</p>
            <div className="summary-identity"><span className={'agent-avatar ' + agent.tone}>{agent.initials}</span><div><h2>{agent.name}</h2><p>{agent.tagline}</p></div></div>
            <div className="summary-metric"><span>{agent.returnLabel}</span><strong>{agent.returnValue}</strong><small>{agent.risk} risk · {agent.drawdown.toFixed(1)}% max drawdown</small></div>
            <dl>
              <div><dt>Reputation</dt><dd>{agent.reputation}/100</dd></div>
              <div><dt>Uptime</dt><dd>{agent.uptime}%</dd></div>
              <div><dt>Settled jobs</dt><dd>{agent.jobs.toLocaleString()}</dd></div>
              <div><dt>Last active</dt><dd>{agent.lastActive}</dd></div>
            </dl>
            <a href={'/agents/' + agent.slug}>View full agent profile ↗</a>
          </aside>
        </div>
      </div>

      {activated && txHash && (
        <div className="success-overlay" role="dialog" aria-modal="true" aria-labelledby="success-title">
          <div className="success-dialog">
            <span className="success-mark">✓</span>
            <p className="eyebrow">BSC Testnet receipt</p>
            <h2 id="success-title">Activation proof submitted.</h2>
            <p>A real zero-value self-transaction was sent on BSC Testnet. This proves wallet intent only; no agent authority or protocol funds were granted.</p>
            <div className="receipt">
              <div><span>Status</span><strong>{txStatus}</strong></div>
              <div><span>Transaction</span><strong>{txHash.slice(0, 10)}...{txHash.slice(-8)}</strong></div>
              <div><span>Spend cap</span><strong>{spendCap} USDT/day</strong></div>
            </div>
            <div className="success-actions">
              <a className="secondary-button" href={BSC_TESTNET.explorerUrl + '/tx/' + txHash} target="_blank" rel="noreferrer">Open BscScan</a>
              <a className="primary-button" href="/dashboard">Open dashboard <span>→</span></a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
