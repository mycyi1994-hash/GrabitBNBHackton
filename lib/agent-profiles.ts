/**
 * The editorial layer over the four candidates.
 *
 * The store and the Testnet terminal are one journey, so they read from one
 * copy of this. Keeping it in the store's component meant the terminal wrote
 * its own wording for the same Agent.
 */
import type { MarketplaceCategory } from '@/lib/marketplace-candidates';

export type AgentProfile = {
  code: string;
  role: string;
  risk: string;
  /** One line under the name. */
  summary: string;
  bestFor: string;
  /** Stated plainly so the card cannot read as a recommendation. */
  notFor: string;
  /** The task the read-only preview runs. */
  demoTask: string;
};

export const agentProfiles: Record<MarketplaceCategory, AgentProfile> = {
  Rebalancing: {
    code: 'RBL',
    role: 'PORTFOLIO MAINTENANCE',
    risk: 'CONTROLLED',
    summary: 'Reprices a drifted portfolio against executable BSC pool routes before rebalancing.',
    bestFor: 'Allocations that have drifted away from their target weights',
    notFor: 'Anyone expecting the Agent to hold or custody the position itself',
    demoTask: 'Price a 60/40 WBNB-USDT portfolio back to a 50/50 target with bounded execution cost.',
  },
  'Grid Trading': {
    code: 'GRID',
    role: 'SYSTEMATIC EXECUTION',
    risk: 'ACTIVE',
    summary: 'Builds fee-aware grid levels and break-even spacing for a selected BSC pool.',
    bestFor: 'Traders who need pool-costed grid levels before execution',
    notFor: 'Anyone wanting the grid maintained and refilled without supervision',
    demoTask: 'Build a 10-level WBNB-USDT grid across a 15% band for a $1,000 test notional.',
  },
  'Yield Optimisation': {
    code: 'YLD',
    role: 'YIELD ROUTING',
    risk: 'VARIABLE',
    summary: 'Ranks Venus stablecoin markets by base supply APY and estimated switching cost.',
    bestFor: 'Stablecoin suppliers comparing Venus markets after gas',
    notFor: 'Anyone treating a ranking as a forecast of future yield',
    demoTask: 'Rank current Venus stablecoin supply yields and show the best base APY with source block.',
  },
  'Health Factor Monitoring': {
    code: 'HLTH',
    role: 'RISK MONITOR',
    risk: 'DEFENSIVE',
    summary: 'Monitors Venus health factor, liquidation distance and collateral stress on-chain.',
    bestFor: 'Borrowers who need liquidation-distance and stress alerts',
    notFor: 'Anyone expecting the Agent to unwind a position on their behalf',
    demoTask: 'Stress-test a Venus borrowing position and report health-factor liquidation distance.',
  },
};
