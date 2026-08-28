'use client';

import { FormEvent, useMemo, useState } from 'react';
import { PrototypeNote } from '@/components/prototype-note';
import { SiteHeader } from '@/components/site-header';
import { agents } from '@/lib/agents';

export function ActivateClient({ initialSlug }: { initialSlug?: string }) {
  const startingSlug = initialSlug && agents.some((agent) => agent.slug === initialSlug) ? initialSlug : agents[0].slug;
  const [slug, setSlug] = useState(startingSlug);
  const [step, setStep] = useState(1);
  const [connected, setConnected] = useState(false);
  const [amount, setAmount] = useState('250');
  const [spendCap, setSpendCap] = useState('100');
  const [expiry, setExpiry] = useState('7');
  const [slippage, setSlippage] = useState('0.5');
  const [confirmed, setConfirmed] = useState(false);
  const [activated, setActivated] = useState(false);
  const agent = useMemo(() => agents.find((item) => item.slug === slug) ?? agents[0], [slug]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (step < 3) {
      setStep((value) => value + 1);
      return;
    }
    setActivated(true);
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
                  <button className={connected ? 'connect-card connected' : 'connect-card'} type="button" onClick={() => setConnected(true)}>
                    <span className="wallet-symbol">{connected ? '✓' : '◇'}</span>
                    <span><strong>{connected ? '0x71A4...8C2F connected' : 'Connect wallet to continue'}</strong><small>{connected ? 'BSC Testnet · Self-custodial' : 'No transaction will be sent yet'}</small></span>
                    <b>{connected ? 'Connected' : 'Connect'}</b>
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="form-panel">
                  <div className="form-heading"><h2>Permission boundaries</h2><span>Step 2 of 3</span></div>
                  <div className="permission-intro"><span className="shield-mark">A</span><p><strong>Powered by Altana sessions</strong>Your agent can only call approved contracts, spend within its cap and act before expiry.</p></div>
                  <label className="field">
                    <span>Allowed contracts</span>
                    <div className="allowlist-box">
                      <div><span className="verified">✓</span><p><strong>{agent.protocol}</strong><small>Verified protocol integration</small></p><code>0x13f4...A920</code></div>
                      <div><span className="verified">✓</span><p><strong>$U escrow contract</strong><small>ERC-8183 task settlement only</small></p><code>0x98d1...C071</code></div>
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
                  <div className="revoke-note"><span>↺</span><p><strong>Revocable in one transaction</strong>You can stop this agent and revoke its session from your dashboard at any time.</p></div>
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
                    <div><dt>Settlement</dt><dd>ERC-8183 escrow</dd></div>
                  </dl>
                  <label className="confirm-row">
                    <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                    <span>I reviewed the contract allowlist, spend limit and expiry. I understand this prototype does not move real funds.</span>
                  </label>
                </div>
              )}

              <div className="form-actions">
                {step > 1 ? <button className="secondary-button" type="button" onClick={() => setStep((value) => value - 1)}>Back</button> : <span />}
                <button className="primary-button" type="submit" disabled={(step === 1 && !connected) || (step === 3 && !confirmed)}>
                  {step === 3 ? 'Activate on testnet' : 'Continue'} <span>→</span>
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

      {activated && (
        <div className="success-overlay" role="dialog" aria-modal="true" aria-labelledby="success-title">
          <div className="success-dialog">
            <span className="success-mark">✓</span>
            <p className="eyebrow">Testnet preview</p>
            <h2 id="success-title">{agent.name} is activated.</h2>
            <p>A scoped session and ERC-8183 job preview were created. No real transaction or funds were used.</p>
            <div className="receipt">
              <div><span>Job ID</span><strong>#AM-2048</strong></div>
              <div><span>Session</span><strong>0x84A1...19D7</strong></div>
              <div><span>Spend cap</span><strong>{spendCap} USDT/day</strong></div>
            </div>
            <div className="success-actions">
              <a className="secondary-button" href={'/agents/' + agent.slug}>Back to agent</a>
              <a className="primary-button" href="/dashboard">Open dashboard <span>→</span></a>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
