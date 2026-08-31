# Agent Advantage Report runbook

The hackathon requires an Agent Advantage Report as part of the submission, and
scores it at 30%: at least three real tasks run both ways, with an agent hired
through the marketplace and without one, reporting time, cost and output
quality, with the actual outputs attached. At least one task must come from
trading, stock or security.

Grabit runs four tasks, one per category. Domains covered are trading (two),
yield and security, so the trading/stock/security requirement is met twice over
and the report doubles as Agent Diversity evidence.

## Why this is a script and not a spreadsheet

A comparison is only worth reading if the two sides answered the same question
and the clock was not started by whoever wanted a particular answer. So:

- Both sides receive the identical prompt from `docs/advantage/tasks.json`.
  `lib/erc8183.ts` derives `CANARY_TASKS` from that same file, so the string a
  human is timed against is the string the product sends an agent. The two
  cannot drift into different questions.
- Time is wall clock, recorded by the harness at the moment work starts and
  stops. It is never typed in afterwards.
- The five quality criteria were fixed before any run and are put to both sides
  verbatim, in the same order.
- The manual side is priced at a stated hourly rate rather than at zero. A
  comparison that treats human labour as free flatters the agent, and a judge
  will notice.

## Prerequisites

1. `.env.local` carries both Altana keys and the 8004scan key.
2. The agent wallet holds tBNB and about 2.00 test $U. Check with:
   ```
   npm run altana check
   ```
3. A session is granted and reads `ACTIVE` on `/authority`. See
   `docs/ALTANA_SESSION.md`.
4. `npm run dev` is running, because the agent side hires over the local API.

## Running one task

```
npm run advantage list                     # what is done and what is left

npm run advantage manual start 302258      # prints the prompt and the procedure
#   ... do the task by hand, write the answer into
#   docs/advantage/outputs/302258.manual.md ...
npm run advantage manual stop 302258       # stops the clock, prices the labour

npm run advantage agent 302258             # hires through Grabit, times it,
                                           # captures the deliverable and the
                                           # on-chain Job

npm run advantage score 302258 manual      # five questions, same for both
npm run advantage score 302258 agent
```

Do the manual side first. Doing it after you have seen the agent's answer is
not a manual run, it is a transcription, and the timing would be meaningless.

## Producing the report

```
npm run advantage render
```

This writes `docs/AGENT_ADVANTAGE_REPORT.md` from the recorded runs. It refuses
to render below three completed and scored tasks, and refuses if none of them
came from trading, stock or security — the two conditions that would make the
submission ineligible.

## What gets attached to the submission

- `docs/AGENT_ADVANTAGE_REPORT.md` — the report itself.
- `docs/advantage/outputs/*.md` — the actual outputs from both sides.
- `docs/advantage/runs/*.json` — the raw timings, costs and scores.
- The BscScan link on each agent-side Job, carried in the report.
