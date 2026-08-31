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
 *   node scripts/advantage-report.mjs manual start <taskId>
 *   node scripts/advantage-report.mjs manual stop  <taskId>
 *   node scripts/advantage-report.mjs agent <taskId> [--base http://localhost:3000]
 *   node scripts/advantage-report.mjs score <taskId> <manual|agent>
 *   node scripts/advantage-report.mjs render
 *
 * Both sides answer the identical prompt from docs/advantage/tasks.json, which
 * is the same string the product sends an agent. Timing is wall-clock and is
 * recorded by this script rather than typed in by hand.
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = JSON.parse(readFileSync(join(ROOT, 'docs/advantage/tasks.json'), 'utf8'));
const RUNS = join(ROOT, 'docs/advantage/runs');
const OUTPUTS = join(ROOT, 'docs/advantage/outputs');
const REPORT = join(ROOT, 'docs/AGENT_ADVANTAGE_REPORT.md');
const SIDES = ['manual', 'agent'];

function task(id) {
  const found = SPEC.tasks.find((entry) => entry.id === String(id));
  if (!found) {
    throw new Error(`Unknown task ${id}. Known: ${SPEC.tasks.map((t) => t.id).join(', ')}`);
  }
  return found;
}

const runPath = (id, side) => join(RUNS, `${id}.${side}.json`);
const outputPath = (id, side) => join(OUTPUTS, `${id}.${side}.md`);

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
    const mark = (run) =>
      !run ? 'not run' : run.finishedAt ? `${run.elapsedSeconds}s${run.rubric ? ` · ${score(run)}/5` : ' · unscored'}` : 'running';
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
    console.log(`\nWrite your answer into ${outputPath(entry.id, 'manual').replace(ROOT + '/', '')}`);
    console.log(`Then: node scripts/advantage-report.mjs manual stop ${entry.id}\n`);
    console.log(`Started at ${run.startedAt}. Do not close this to keep the timer — it is on disk.\n`);
    return;
  }
  if (action !== 'stop') throw new Error('manual takes "start" or "stop".');

  const run = loadRun(entry.id, 'manual');
  if (!run) throw new Error(`No manual run started for ${entry.id}.`);
  if (run.finishedAt) throw new Error(`Manual run for ${entry.id} already stopped at ${run.finishedAt}.`);

  const out = outputPath(entry.id, 'manual');
  if (!existsSync(out) || readFileSync(out, 'utf8').trim().length < 40) {
    throw new Error(`Write your answer into ${out.replace(ROOT + '/', '')} before stopping the timer.`);
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
    outputPath: out.replace(ROOT + '/', ''),
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
    outputPath: outputPath(entry.id, 'agent').replace(ROOT + '/', ''),
  });

  console.log(`Agent ${entry.id} recorded: ${elapsedSeconds}s, Job ${payload.job?.id ?? '?'}, ${payload.job?.budgetDisplay ?? '?'} escrowed.`);
  if (payload.transaction?.url) console.log(`Transaction: ${payload.transaction.url}`);
  console.log(`Next: node scripts/advantage-report.mjs score ${entry.id} agent\n`);
}

const score = (run) => SPEC.rubric.filter((c) => run.rubric?.[c.id]).length;

async function scoreRun(id, side) {
  const entry = task(id);
  if (!SIDES.includes(side)) throw new Error(`side must be one of ${SIDES.join(', ')}.`);
  const run = loadRun(entry.id, side);
  if (!run?.finishedAt) throw new Error(`No finished ${side} run for ${entry.id}.`);

  const out = join(ROOT, run.outputPath);
  console.log(`\nScoring ${entry.id} (${entry.category}) — ${side} side.`);
  console.log(`Read ${run.outputPath} before answering. Same five questions for both sides.\n`);

  const rl = createInterface({ input: stdin, output: stdout });
  const rubric = {};
  try {
    for (const criterion of SPEC.rubric) {
      let answer = '';
      while (!['y', 'n'].includes(answer)) {
        answer = (await rl.question(`  ${criterion.text}  [y/n] `)).trim().toLowerCase();
      }
      rubric[criterion.id] = answer === 'y';
    }
    const notes = (await rl.question('\n  One line on what decided it: ')).trim();
    saveRun({ ...run, rubric, notes, scoredAt: new Date().toISOString() });
    console.log(`\n  ${entry.id} ${side}: ${SPEC.rubric.filter((c) => rubric[c.id]).length}/5\n`);
  } finally {
    rl.close();
  }
  if (!existsSync(out)) console.warn(`  Note: ${run.outputPath} is missing.`);
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
    `- **Output quality** is five binary criteria, fixed before any run and applied`,
    `  identically to both sides:`,
    '',
    ...SPEC.rubric.map((c, i) => `  ${i + 1}. ${c.text}`),
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
      `| Output | [\`${manual.outputPath}\`](${manual.outputPath.replace('docs/', '')}) | [\`${agent.outputPath}\`](${agent.outputPath.replace('docs/', '')}) |`,
      '',
    );
    if (agent.cost.onchain?.explorerUrl) {
      lines.push(`On-chain Job ${agent.cost.onchain.jobId}: ${agent.cost.onchain.explorerUrl}`, '');
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
  console.log(`\nWrote ${REPORT.replace(ROOT + '/', '')} from ${rows.length} tasks.\n`);
}

const [command, ...rest] = process.argv.slice(2);
const baseFlag = rest.indexOf('--base');
const base = baseFlag === -1 ? 'http://localhost:3000' : rest[baseFlag + 1];

try {
  if (command === 'list') list();
  else if (command === 'manual') await manual(rest[0], rest[1]);
  else if (command === 'agent') await agent(rest[0], base);
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
