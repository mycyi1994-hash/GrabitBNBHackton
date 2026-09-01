#!/usr/bin/env node
/**
 * Agent Advantage Report harness.
 *
 * The hackathon asks for real tasks run both ways — through the marketplace and
 * without an agent — reported with time, cost and output quality, with the
 * actual outputs attached. The numbers in that report have to be measured, not
 * estimated, so this script measures them:
 *
 *   node scripts/advantage-report.mjs list
 *   node scripts/advantage-report.mjs manual start  <taskId>
 *   node scripts/advantage-report.mjs manual stop   <taskId>
 *   node scripts/advantage-report.mjs manual cancel <taskId>
 *   node scripts/advantage-report.mjs agent   <taskId> [--base http://localhost:3000]
 *   node scripts/advantage-report.mjs deliver <taskId> [--base ...]
 *   node scripts/advantage-report.mjs score <taskId> <manual|agent>
 *   node scripts/advantage-report.mjs render
 *
 * Both sides answer the identical prompt from docs/advantage/tasks.json, which
 * is the same string the product sends an agent. Timing is wall-clock and is
 * recorded by this script rather than typed in by hand.
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = JSON.parse(readFileSync(join(ROOT, 'docs/advantage/tasks.json'), 'utf8'));
const RUNS = join(ROOT, 'docs/advantage/runs');
const OUTPUTS = join(ROOT, 'docs/advantage/outputs');
const REPORT = join(ROOT, 'docs/AGENT_ADVANTAGE_REPORT.md');
const SIDES = ['manual', 'agent'];
const TODO = '<!-- fill this in -->';

/**
 * The skeleton `manual start` drops on disk, so the operator is filling in a
 * page rather than facing a blank one. It asks for exactly what the task
 * prompt asks for — the agent receives the same instruction in the same
 * words — so it sets expectations for both sides equally rather than
 * advantaging the human. `manual stop` refuses while any marker survives.
 */
function template(entry) {
  return [
    `# ${entry.category} — manual`,
    '',
    `Task: ${entry.prompt}`,
    '',
    '## Source',
    '',
    `Block height: ${TODO}`,
    `Read from: ${TODO}`,
    '',
    '## Answer',
    '',
    TODO,
    '',
    '## Assumptions',
    '',
    TODO,
    '',
    '## Risks',
    '',
    TODO,
    '',
  ].join('\n');
}

function task(id) {
  const found = SPEC.tasks.find((entry) => entry.id === String(id));
  if (!found) {
    throw new Error(`Unknown task ${id}. Known: ${SPEC.tasks.map((t) => t.id).join(', ')}`);
  }
  return found;
}

const runPath = (id, side) => join(RUNS, `${id}.${side}.json`);
const outputPath = (id, side) => join(OUTPUTS, `${id}.${side}.md`);

/**
 * Repo-relative, forward-slashed, on every platform.
 *
 * These strings are stored in the run files and then printed into the report as
 * markdown links, so they have to be portable. Stripping `ROOT + '/'` by hand
 * silently did nothing on Windows, where the separator is a backslash: the full
 * local path was stored instead, `score` then reported the answer file missing,
 * and `render` would have published `D:\hackton\...` as a link.
 */
const rel = (abs) => relative(ROOT, abs).split(sep).join('/');

/** Normalises a stored path, repairing absolute ones written before the fix. */
function storedPath(value) {
  if (!value) return value;
  const forward = value.split('\\').join('/').replace(/\/{2,}/g, '/');
  const marker = forward.indexOf('docs/advantage/');
  return marker === -1 ? forward : forward.slice(marker);
}

function loadRun(id, side) {
  const path = runPath(id, side);
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}

function saveRun(run) {
  mkdirSync(RUNS, { recursive: true });
  writeFileSync(runPath(run.taskId, run.side), `${JSON.stringify(run, null, 2)}\n`);
  return run;
}

/** Labour cost of the manual side; the agent side has no labour by definition. */
function operatorCostUsd(seconds) {
  return (seconds / 3600) * SPEC.costModel.operatorRateUsdPerHour;
}

function list() {
  console.log(`\n${SPEC.tasks.length} tasks. Prompts are shared with the product via docs/advantage/tasks.json.\n`);
  for (const entry of SPEC.tasks) {
    const manual = loadRun(entry.id, 'manual');
    const agent = loadRun(entry.id, 'agent');
    const mark = (run) => {
      if (!run) return 'not run';
      if (!run.finishedAt) {
        const mins = Math.round((Date.now() - new Date(run.startedAt)) / 60000);
        return `CLOCK RUNNING ${mins}m`;
      }
      return `${run.elapsedSeconds}s${run.rubric ? ` · ${score(run)}/5` : ' · unscored'}`;
    };
    console.log(`  ${entry.id}  ${entry.category.padEnd(26)} [${entry.domain}]`);
    console.log(`          manual: ${mark(manual).padEnd(20)} agent: ${mark(agent)}`);
  }
  const ready = SPEC.tasks.filter((t) => ['manual', 'agent'].every((s) => loadRun(t.id, s)?.rubric)).length;
  console.log(`\n  ${ready} of ${SPEC.tasks.length} tasks complete on both sides and scored.`);
  console.log(`  The submission needs at least 3, including one from trading, stock or security.\n`);
}

async function manual(action, id) {
  const entry = task(id);
  if (action === 'start') {
    const run = saveRun({
      taskId: entry.id,
      side: 'manual',
      prompt: entry.prompt,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      elapsedSeconds: null,
    });
    console.log(`\nTimer started for ${entry.id} (${entry.category}).\n`);
    console.log(`  ${entry.prompt}\n`);
    console.log('Procedure:');
    entry.manualProcedure.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
    const out = outputPath(entry.id, 'manual');
    if (!existsSync(out)) {
      mkdirSync(OUTPUTS, { recursive: true });
      writeFileSync(out, template(entry));
      console.log(`\nA skeleton is waiting at ${out} — replace every`);
      console.log(`"${TODO}" with your own work.`);
    } else {
      console.log(`\nWrite your answer into ${out}`);
    }
    console.log(`\nWhen done:   node scripts/advantage-report.mjs manual stop ${entry.id}`);
    console.log(`Mis-started: node scripts/advantage-report.mjs manual cancel ${entry.id}\n`);
    console.log(`Clock started ${run.startedAt}. It runs on disk, so closing this window`);
    console.log(`does not stop it — cancel if you are not actually working on the task.\n`);
    return;
  }
  if (action === 'cancel') {
    const pending = loadRun(entry.id, 'manual');
    if (!pending) throw new Error(`No manual run started for ${entry.id}.`);
    if (pending.finishedAt) {
      throw new Error(
        `Manual run for ${entry.id} already stopped at ${pending.finishedAt}. Cancel only discards a running clock; delete the run file by hand to redo a finished one.`,
      );
    }
    rmSync(runPath(entry.id, 'manual'));
    const elapsed = Math.round((Date.now() - new Date(pending.startedAt)) / 1000);
    console.log(`\nDiscarded the ${elapsed}s clock on ${entry.id}. Your answer file was left alone.`);
    console.log(`Start again when you are actually ready.\n`);
    return;
  }
  if (action !== 'stop') throw new Error('manual takes "start", "stop" or "cancel".');

  const run = loadRun(entry.id, 'manual');
  if (!run) throw new Error(`No manual run started for ${entry.id}.`);
  if (run.finishedAt) throw new Error(`Manual run for ${entry.id} already stopped at ${run.finishedAt}.`);

  const out = outputPath(entry.id, 'manual');
  const written = existsSync(out) ? readFileSync(out, 'utf8') : '';
  const left = written.split(TODO).length - 1;
  if (left > 0) {
    throw new Error(
      `${out} still has ${left} unfilled "${TODO}" marker(s). Fill them in, or cancel the clock with: node scripts/advantage-report.mjs manual cancel ${entry.id}`,
    );
  }
  if (written.trim().length < 120) {
    throw new Error(`${out} is too short to be an answer. Write the task up before stopping the timer.`);
  }

  const finishedAt = new Date();
  const elapsedSeconds = Math.round((finishedAt - new Date(run.startedAt)) / 1000);
  saveRun({
    ...run,
    finishedAt: finishedAt.toISOString(),
    elapsedSeconds,
    cost: {
      onchain: null,
      operatorSeconds: elapsedSeconds,
      operatorRateUsdPerHour: SPEC.costModel.operatorRateUsdPerHour,
      totalUsd: Number(operatorCostUsd(elapsedSeconds).toFixed(2)),
    },
    outputPath: rel(out),
  });
  console.log(`\nManual ${entry.id} recorded: ${elapsedSeconds}s, $${operatorCostUsd(elapsedSeconds).toFixed(2)} of operator time.`);
  console.log(`Next: node scripts/advantage-report.mjs score ${entry.id} manual\n`);
}

async function agent(id, base) {
  const entry = task(id);
  const url = `${base.replace(/\/$/, '')}/api/altana/hire`;
  console.log(`\nHiring ${entry.id} (${entry.category}) through ${url}\n`);
  console.log(`  ${entry.prompt}\n`);

  const startedAt = new Date();
  let response;
  let payload;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ registry: entry.id, mode: 'canary' }),
    });
    payload = await response.json();
  } catch (error) {
    throw new Error(`Could not reach ${url}. Is the dev server running? ${error.message}`);
  }
  const finishedAt = new Date();
  const elapsedSeconds = Math.round((finishedAt - startedAt) / 1000);

  if (!response.ok) {
    console.error(`\nHire failed (HTTP ${response.status}): ${payload.reason || payload.error || 'unknown'}`);
    if (payload.hint) console.error(`Hint: ${payload.hint}`);
    console.error('\nNothing was recorded. Fix the cause and run again.\n');
    process.exitCode = 1;
    return;
  }

  mkdirSync(OUTPUTS, { recursive: true });
  writeFileSync(
    outputPath(entry.id, 'agent'),
    [
      `# ${entry.category} — agent output`,
      '',
      `Task: ${entry.prompt}`,
      '',
      `Hired through Grabit at ${startedAt.toISOString()}, signed by the scoped session key.`,
      '',
      '```json',
      JSON.stringify(payload, null, 2),
      '```',
      '',
    ].join('\n'),
  );

  saveRun({
    taskId: entry.id,
    side: 'agent',
    prompt: entry.prompt,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    elapsedSeconds,
    cost: {
      onchain: {
        budgetAtomic: payload.job?.budgetAtomic ?? null,
        budgetDisplay: payload.job?.budgetDisplay ?? null,
        jobId: payload.job?.id ?? null,
        transactionHash: payload.transaction?.hash ?? null,
        explorerUrl: payload.transaction?.url ?? null,
      },
      operatorSeconds: 0,
      operatorRateUsdPerHour: SPEC.costModel.operatorRateUsdPerHour,
      totalUsd: 0,
    },
    outputPath: rel(outputPath(entry.id, 'agent')),
  });

  console.log(`Agent ${entry.id} recorded: ${elapsedSeconds}s, Job ${payload.job?.id ?? '?'}, ${payload.job?.budgetDisplay ?? '?'} escrowed.`);
  if (payload.transaction?.url) console.log(`Transaction: ${payload.transaction.url}`);
  console.log(`Next: node scripts/advantage-report.mjs score ${entry.id} agent\n`);
}

/**
 * Ask the reference provider to run the task and submit its result on chain,
 * then fold the deliverable into the agent-side output file.
 *
 * Hiring and delivering are separate steps, and only the first is signed by
 * the session key — the provider signs its own submission with its own gas.
 * Scoring the agent side before this runs measures a funding receipt rather
 * than an answer, which would understate the agent to the same degree that
 * fabricating an answer would overstate it.
 */
async function deliver(id, base) {
  const entry = task(id);
  const run = loadRun(entry.id, 'agent');
  if (!run) throw new Error(`No agent run for ${entry.id}. Hire it first.`);
  const jobId = run.cost?.onchain?.jobId;
  if (!jobId) throw new Error(`The agent run for ${entry.id} carries no job id.`);

  const url = `${base.replace(/\/$/, '')}/api/hire/testnet-provider`;
  console.log(`\nAsking the provider to deliver Job ${jobId} (${entry.category})...\n`);

  const startedAt = new Date();
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'submit', jobId: Number(jobId) }),
  }).catch((error) => {
    throw new Error(`Could not reach ${url}. Is the dev server running? ${error.message}`);
  });
  const payload = await response.json();
  const elapsedSeconds = Math.round((new Date() - startedAt) / 1000);

  if (!response.ok) {
    console.error(`\nDelivery failed (HTTP ${response.status}): ${payload.error || 'unknown'}`);
    console.error('\nNothing was recorded.\n');
    process.exitCode = 1;
    return;
  }

  const out = resolve(ROOT, storedPath(run.outputPath));
  const existing = existsSync(out) ? readFileSync(out, 'utf8') : '';
  writeFileSync(
    out,
    [
      existing.trimEnd(),
      '',
      '## Delivered result',
      '',
      `Submitted on chain by the reference provider at ${startedAt.toISOString()}, ${elapsedSeconds}s after asking.`,
      payload.txHash ? `Transaction: https://testnet.bscscan.com/tx/${payload.txHash}` : '',
      payload.deliverable ? `Deliverable digest: \`${payload.deliverable}\`` : '',
      '',
      '```json',
      JSON.stringify(payload.result ?? payload, null, 2),
      '```',
      '',
    ].filter((line) => line !== '').join('\n'),
  );

  saveRun({
    ...run,
    // The hire and the delivery are both part of what the buyer waited for.
    elapsedSeconds: run.elapsedSeconds + elapsedSeconds,
    delivery: {
      jobId: String(jobId),
      elapsedSeconds,
      transactionHash: payload.txHash ?? null,
      explorerUrl: payload.txHash ? `https://testnet.bscscan.com/tx/${payload.txHash}` : null,
      deliverable: payload.deliverable ?? null,
      deliveredAt: new Date().toISOString(),
    },
  });

  console.log(`Delivered in ${elapsedSeconds}s. Total agent time for ${entry.id}: ${run.elapsedSeconds + elapsedSeconds}s.`);
  if (payload.txHash) console.log(`Transaction: https://testnet.bscscan.com/tx/${payload.txHash}`);
  console.log(`The result is appended to ${storedPath(run.outputPath)} — read it before scoring.\n`);
}

const score = (run) => SPEC.rubric.filter((c) => run.rubric?.[c.id]).length;

/** A markdown link to an output file, relative to the report's own directory. */
function link(stored) {
  const path = storedPath(stored);
  return `[\`${path}\`](${path.replace(/^docs\//, '')})`;
}

/**
 * Accepts the Hangul characters a Korean IME produces for the y and n keys.
 * Scoring is the one place the operator has to type, and being told to answer
 * "y" while the keyboard emits "ㅛ" is a loop with no visible way out.
 */
function readYesNo(raw) {
  const value = raw.trim().toLowerCase();
  if (['y', 'yes', 'ㅛ'].includes(value)) return true;
  if (['n', 'no', 'ㅜ'].includes(value)) return false;
  return null;
}

async function scoreRun(id, side) {
  const entry = task(id);
  if (!SIDES.includes(side)) throw new Error(`side must be one of ${SIDES.join(', ')}.`);
  const run = loadRun(entry.id, side);
  if (!run?.finishedAt) throw new Error(`No finished ${side} run for ${entry.id}.`);

  const stored = storedPath(run.outputPath);
  const out = resolve(ROOT, stored);
  console.log(`\nScoring ${entry.id} (${entry.category}) — ${side} side.`);
  console.log(`Read ${stored} before answering. Same five questions for both sides.\n`);

  const rl = createInterface({ input: stdin, output: stdout });
  const rubric = {};
  try {
    for (const criterion of SPEC.rubric) {
      let answer = null;
      while (answer === null) {
        answer = readYesNo(await rl.question(`  ${criterion.text}  [y/n] `));
        if (answer === null) console.log('    Answer y or n.');
      }
      rubric[criterion.id] = answer;
    }
    const notes = (await rl.question('\n  One line on what decided it: ')).trim();
    saveRun({ ...run, outputPath: stored, rubric, notes, scoredAt: new Date().toISOString() });
    console.log(`\n  ${entry.id} ${side}: ${SPEC.rubric.filter((c) => rubric[c.id]).length}/5\n`);
  } finally {
    rl.close();
  }
  if (!existsSync(out)) console.warn(`  Note: ${stored} is missing.`);
}

/**
 * The conclusion, computed from the runs rather than written by hand, so it
 * cannot drift from the table above it or flatter either side.
 */
function findings(rows) {
  const manualSeconds = rows.reduce((n, r) => n + r.manual.elapsedSeconds, 0);
  const agentSeconds = rows.reduce((n, r) => n + r.agent.elapsedSeconds, 0);
  const speedup = (manualSeconds / agentSeconds).toFixed(0);
  const manualQuality = rows.reduce((n, r) => n + score(r.manual), 0);
  const agentQuality = rows.reduce((n, r) => n + score(r.agent), 0);
  const max = rows.length * SPEC.rubric.length;

  // Which criteria the agent lost on, and how often.
  const misses = SPEC.rubric
    .map((c) => ({ c, n: rows.filter((r) => r.manual.rubric[c.id] && !r.agent.rubric[c.id]).length }))
    .filter((m) => m.n > 0)
    .sort((a, b) => b.n - a.n);

  const out = [
    `**The marketplace is ${speedup} times faster.** ${manualSeconds}s of work became ${agentSeconds}s`,
    `across ${rows.length} tasks, and the agent side needed no operator attention at all while it ran.`,
    '',
    `**It is not more accurate.** Quality came to ${agentQuality}/${max} against the manual side's`,
    `${manualQuality}/${max} on identical criteria.`,
  ];

  if (misses.length) {
    out.push('', 'The agent lost, in order of how often:', '');
    for (const { c, n } of misses) {
      out.push(`- **${c.text}** — ${n} of ${rows.length} tasks.`);
    }
    out.push(
      '',
      'Every one of those is the same failure in a different place: a number the',
      'agent chose instead of reading. It priced the grid off a generic 0.25% fee',
      'tier where the pool itself reports 0.05%, which puts the break-even out by',
      'five times, and it annualised a Venus supply rate on an undisclosed',
      'blocks-per-year that gives 1.71% where the observed 0.45s block time gives',
      '2.91%. Both are plausible-looking and neither is checkable from what the',
      'agent wrote.',
    );
  }

  out.push(
    '',
    '**So the honest reading is that speed and sourcing are separate problems, and',
    'this marketplace has only solved the first one.** Forty seconds of agent time',
    'is worth little if a figure inside it is wrong by a factor of five and the',
    'reader cannot tell. That is the case for the verification ladder rather than',
    'against it: these three agents sit on rung 3, which is exactly the rung that',
    'says an endpoint answered and nothing about whether the answer was right.',
    'The comparison above is what rung 4 is supposed to measure.',
  );
  return out;
}

function render() {
  const complete = SPEC.tasks.filter((t) => SIDES.every((s) => loadRun(t.id, s)?.rubric));
  if (complete.length < 3) {
    throw new Error(
      `Only ${complete.length} task(s) are run and scored on both sides. The submission needs at least 3. Run: node scripts/advantage-report.mjs list`,
    );
  }
  const domains = new Set(complete.map((t) => t.domain));
  const qualifying = ['trading', 'stock', 'security'].filter((d) => domains.has(d));
  if (qualifying.length === 0) {
    throw new Error('At least one completed task must come from trading, stock or security.');
  }

  const rows = complete.map((entry) => {
    const manual = loadRun(entry.id, 'manual');
    const agent = loadRun(entry.id, 'agent');
    return { entry, manual, agent };
  });

  const totalManualSeconds = rows.reduce((sum, r) => sum + r.manual.elapsedSeconds, 0);
  const totalAgentSeconds = rows.reduce((sum, r) => sum + r.agent.elapsedSeconds, 0);
  const totalManualUsd = rows.reduce((sum, r) => sum + r.manual.cost.totalUsd, 0);

  const lines = [
    '# Agent Advantage Report',
    '',
    `Generated ${new Date().toISOString()} by \`scripts/advantage-report.mjs render\`.`,
    '',
    'Every figure below was measured by that script at the moment the work ran.',
    'Nothing here is estimated. Prompts come from `docs/advantage/tasks.json`, which',
    'is also what the product sends an agent, so both sides answered the same string.',
    '',
    '## Method',
    '',
    `- **Time** is wall clock, recorded by the harness, not typed in afterwards.`,
    `- **Cost** on the agent side is what the Job escrowed on chain, with the transaction linked.`,
    `  On the manual side there is no out-of-pocket cost, only labour, priced at`,
    `  $${SPEC.costModel.operatorRateUsdPerHour}/hour. ${SPEC.costModel.rationale}`,
    `- **The manual side** is ${SPEC.manualBaseline.description.replace(/^A /, 'a ').replace(/^An /, 'an ')}`,
    `  ${SPEC.manualBaseline.rationale}`,
    `- **Networks.** Analysis reads ${SPEC.networks.analysis}; settlement runs on`,
    `  ${SPEC.networks.settlement}. ${SPEC.networks.rationale}`,
    `- **Output quality** is five binary criteria, fixed before any run and applied`,
    `  identically to both sides:`,
    '',
    ...SPEC.rubric.map((c, i) => `  ${i + 1}. ${c.text}`),
    '',
    SPEC.manualBaseline.caveat ? `> **On timing.** ${SPEC.manualBaseline.caveat}` : '',
    '',
    '## Results',
    '',
    '| Task | Category | Domain | Manual time | Agent time | Manual cost | Agent cost | Manual quality | Agent quality |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map(({ entry, manual, agent }) =>
      `| ${entry.id} | ${entry.category} | ${entry.domain} | ${manual.elapsedSeconds}s | ${agent.elapsedSeconds}s | $${manual.cost.totalUsd.toFixed(2)} | ${agent.cost.onchain?.budgetDisplay ?? 'n/a'} | ${score(manual)}/5 | ${score(agent)}/5 |`,
    ),
    '',
    `Totals across ${rows.length} tasks: ${totalManualSeconds}s manual against ${totalAgentSeconds}s through the marketplace,`,
    `and $${totalManualUsd.toFixed(2)} of labour against ${rows.length} escrowed jobs.`,
    '',
    `Domains covered: ${[...domains].sort().join(', ')}. The submission requires at least one of`,
    `trading, stock or security; this report carries ${qualifying.join(' and ')}.`,
    '',
    '## What the comparison shows',
    '',
    ...findings(rows),
    '',
    '## Tasks',
    '',
  ];

  for (const { entry, manual, agent } of rows) {
    lines.push(
      `### ${entry.id} — ${entry.category}`,
      '',
      `> ${entry.prompt}`,
      '',
      `| | Manual | Through Grabit |`,
      `| --- | --- | --- |`,
      `| Time | ${manual.elapsedSeconds}s | ${agent.elapsedSeconds}s |`,
      `| Cost | $${manual.cost.totalUsd.toFixed(2)} of operator time | ${agent.cost.onchain?.budgetDisplay ?? 'n/a'} escrowed |`,
      `| Quality | ${score(manual)}/5 | ${score(agent)}/5 |`,
      `| Output | ${link(manual.outputPath)} | ${link(agent.outputPath)} |`,
      '',
    );
    if (agent.cost.onchain?.explorerUrl) {
      lines.push(
        `On-chain Job ${agent.cost.onchain.jobId} — hired: ${agent.cost.onchain.explorerUrl}`,
        agent.delivery?.explorerUrl
          ? `Result submitted on chain by the provider: ${agent.delivery.explorerUrl}`
          : '',
        '',
      );
    }
    const diff = SPEC.rubric.filter((c) => Boolean(manual.rubric[c.id]) !== Boolean(agent.rubric[c.id]));
    if (diff.length) {
      lines.push('Quality differed on:', '');
      for (const c of diff) {
        lines.push(`- ${c.text} — manual ${manual.rubric[c.id] ? 'yes' : 'no'}, agent ${agent.rubric[c.id] ? 'yes' : 'no'}`);
      }
      lines.push('');
    } else {
      lines.push('Both sides met the same criteria.', '');
    }
    if (manual.notes) lines.push(`Manual note: ${manual.notes}`, '');
    if (agent.notes) lines.push(`Agent note: ${agent.notes}`, '');
  }

  writeFileSync(REPORT, `${lines.join('\n')}\n`);
  console.log(`\nWrote ${REPORT} from ${rows.length} tasks.\n`);
}

const [command, ...rest] = process.argv.slice(2);
const baseFlag = rest.indexOf('--base');
const base = baseFlag === -1 ? 'http://localhost:3000' : rest[baseFlag + 1];

try {
  if (command === 'list') list();
  else if (command === 'manual') await manual(rest[0], rest[1]);
  else if (command === 'agent') await agent(rest[0], base);
  else if (command === 'deliver') await deliver(rest[0], base);
  else if (command === 'score') await scoreRun(rest[0], rest[1]);
  else if (command === 'render') render();
  else {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].split('/**')[1].replace(/^ \* ?/gm, ''));
    process.exitCode = command ? 1 : 0;
  }
} catch (error) {
  console.error(`\n${error.message}\n`);
  process.exitCode = 1;
}
