/**
 * The verification ladder.
 *
 * Six rungs, exactly one per agent, the same component everywhere it appears.
 * The rung is derived from the verification gate we actually hold rather than
 * stored beside it — an agent cannot be described as further along than its
 * evidence, and the moment a task is delivered it climbs on its own.
 */
import { verificationGate } from '@/lib/marketplace-candidates';

export type LadderLevel =
  | 'REGISTERED'
  | 'METADATA_VALID'
  | 'REACHABLE'
  | 'TASK_TESTED'
  | 'ONCHAIN_EXECUTING'
  | 'TRACK_RECORDED';

export type LadderRung = {
  level: LadderLevel;
  step: number;
  /** What has actually been shown at this rung. */
  shown: string;
  /** Rungs 4 and above may be described as verified. */
  callableVerified: boolean;
};

export const LADDER: readonly LadderRung[] = [
  {
    level: 'REGISTERED',
    step: 1,
    shown: 'An identity exists on chain. Capability is entirely unproven.',
    callableVerified: false,
  },
  {
    level: 'METADATA_VALID',
    step: 2,
    shown: 'Its published description parses and declares real services.',
    callableVerified: false,
  },
  {
    level: 'REACHABLE',
    step: 3,
    shown: 'Its endpoint answered when we asked. It was online, once.',
    callableVerified: false,
  },
  {
    level: 'TASK_TESTED',
    step: 4,
    shown: 'It completed a real task in its own category, under test.',
    callableVerified: true,
  },
  {
    level: 'ONCHAIN_EXECUTING',
    step: 5,
    shown: 'A transaction ties this agent to work someone paid for.',
    callableVerified: true,
  },
  {
    level: 'TRACK_RECORDED',
    step: 6,
    shown: 'Enough completed and failed jobs to be worth comparing.',
    callableVerified: true,
  },
];

/** The rung at which hire becomes available. Below it, hire is blocked and says so. */
export const HIRE_OPENS_AT = 4;

export type AgentEvidence = {
  identityRegistered: boolean;
  metadataValid: boolean;
  endpointReachable: boolean;
  taskDelivered: boolean;
  jobSettled: boolean;
  trackRecorded: boolean;
};

export type LadderState = {
  /** 0 when nothing at all has been shown. */
  reached: number;
  rung: LadderRung | null;
  callableVerified: boolean;
  hireAvailable: boolean;
  /** The first rung not reached — what the agent is stopped at. */
  stoppedAt: LadderRung | null;
};

/**
 * Walks the ladder from the bottom and stops at the first unmet check, so a
 * later gate passing on its own can never skip an earlier one.
 */
export function ladderState(evidence: AgentEvidence): LadderState {
  const met = [
    evidence.identityRegistered,
    evidence.metadataValid,
    evidence.endpointReachable,
    evidence.taskDelivered,
    evidence.jobSettled,
    evidence.trackRecorded,
  ];

  let reached = 0;
  for (const passed of met) {
    if (!passed) break;
    reached += 1;
  }

  return {
    reached,
    rung: reached > 0 ? LADDER[reached - 1] : null,
    callableVerified: reached >= HIRE_OPENS_AT,
    hireAvailable: reached >= HIRE_OPENS_AT,
    stoppedAt: reached < LADDER.length ? LADDER[reached] : null,
  };
}

/**
 * The four indexed candidates share one verification gate today. Metadata
 * validity is implied by a reachable endpoint that returned a usable card, and
 * a settled job is what an accepted quote is not.
 */
export function candidateEvidence(): AgentEvidence {
  return {
    identityRegistered: verificationGate.identityRegistered,
    metadataValid: verificationGate.endpointReachable,
    endpointReachable: verificationGate.endpointReachable,
    taskDelivered: verificationGate.taskDelivered,
    jobSettled: verificationGate.jobSettled,
    trackRecorded: false,
  };
}
