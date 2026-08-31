export type MarketplaceCategory =
  | 'Rebalancing'
  | 'Grid Trading'
  | 'Yield Optimisation'
  | 'Health Factor Monitoring';

export type CandidateSnapshot = {
  category: MarketplaceCategory;
  tokenId: string;
  name: string;
  description: string;
  owner: string;
  provider: string;
  serviceId: string;
  price: string;
  endpoint: string;
  agentCard: string;
  observedAt: string;
};

export const verificationGate = {
  identityRegistered: true,
  endpointReachable: true,
  quoteAccepted: true,
  taskDelivered: false,
  jobSettled: false,
} as const;

export const marketplaceCandidates: CandidateSnapshot[] = [
  {
    category: 'Rebalancing',
    tokenId: '304494',
    name: 'Brain on BNB — Portfolio Rebalance Pricer',
    description: 'Prices a BSC portfolio rebalance against the pools that would execute it.',
    owner: '0x73809f69916fcf7ddc5bb1315fbdf96a569a5963',
    provider: '0x73809F69916FcF7Ddc5BB1315fBdf96A569a5963',
    serviceId: 'rebalance_plan',
    price: '0.10 $U',
    endpoint: 'https://agent.brainonbnb.com/a2a',
    agentCard: 'https://agent.brainonbnb.com/.well-known/agent-card.json',
    observedAt: '2026-08-29T13:52:42Z',
  },
  {
    category: 'Grid Trading',
    tokenId: '302258',
    name: 'Brain on BNB — BSC Grid Planner',
    description: 'Returns pool-costed grid levels and the break-even spacing for a BSC pool.',
    owner: '0x73809f69916fcf7ddc5bb1315fbdf96a569a5963',
    provider: '0x73809F69916FcF7Ddc5BB1315fBdf96A569a5963',
    serviceId: 'grid_plan',
    price: '0.10 $U',
    endpoint: 'https://agent.brainonbnb.com/a2a',
    agentCard: 'https://agent.brainonbnb.com/.well-known/agent-card.json',
    observedAt: '2026-08-29T13:52:42Z',
  },
  {
    category: 'Yield Optimisation',
    tokenId: '304493',
    name: 'Brain on BNB — Venus Yield Ranking',
    description: 'Ranks Venus supply markets and estimates whether moving a position pays for its gas.',
    owner: '0x73809f69916fcf7ddc5bb1315fbdf96a569a5963',
    provider: '0x73809F69916FcF7Ddc5BB1315fBdf96A569a5963',
    serviceId: 'yield_plan',
    price: '0.10 $U',
    endpoint: 'https://agent.brainonbnb.com/a2a',
    agentCard: 'https://agent.brainonbnb.com/.well-known/agent-card.json',
    observedAt: '2026-08-29T13:52:42Z',
  },
  {
    category: 'Health Factor Monitoring',
    tokenId: '302257',
    name: 'Brain on BNB — Venus Health Factor Monitor',
    description: 'Reads a Venus position and returns health factor, liquidation distance and stress checks.',
    owner: '0x73809f69916fcf7ddc5bb1315fbdf96a569a5963',
    provider: '0x73809F69916FcF7Ddc5BB1315fBdf96A569a5963',
    serviceId: 'health_factor',
    price: '0.10 $U',
    endpoint: 'https://agent.brainonbnb.com/a2a',
    agentCard: 'https://agent.brainonbnb.com/.well-known/agent-card.json',
    observedAt: '2026-08-29T13:52:42Z',
  },
];

/**
 * Candidates found during discovery that have NOT passed the marketplace gate.
 *
 * These are listed so the verification ladder is visible rather than implied:
 * discovery on 8004scan is cheap and turned up hundreds of thousands of BSC
 * registrations, and what separates the four anchors above from these is the
 * endpoint and negotiation checks, not the registration.
 *
 * They are deliberately not hireable and carry no price. Each records the exact
 * check that stopped it, observed on 2026-08-29. Under DATA_METHODOLOGY.md a
 * candidate needs TASK_TESTED to reach the marketplace, so none of these
 * qualifies today; several would with an endpoint fix by their owner.
 */
export type DiscoveredCandidate = {
  category: MarketplaceCategory;
  tokenId: string;
  name: string;
  owner: string | null;
  /** Where the candidate currently sits on the DATA_METHODOLOGY.md ladder. */
  level: 'REGISTERED' | 'METADATA_VALID' | 'REACHABLE';
  /** The specific check that stopped it. */
  blocker: string;
  observedAt: string;
};

export const discoveredCandidates: DiscoveredCandidate[] = [
  {
    category: 'Rebalancing',
    tokenId: '293902',
    name: 'Mandate Rebalance',
    owner: null,
    level: 'METADATA_VALID',
    blocker: 'Healthy Agent Card advertising ERC-8183, but invocation needs operator-issued OAuth credentials.',
    observedAt: '2026-08-29T13:52:42Z',
  },
  {
    category: 'Rebalancing',
    tokenId: '315944',
    name: 'AiKi LP Rebalancer',
    owner: null,
    level: 'REACHABLE',
    blocker: 'Public JSON endpoint answers, but it is read-only advice with no execution path.',
    observedAt: '2026-08-29T13:52:42Z',
  },
  {
    category: 'Rebalancing',
    tokenId: '171927',
    name: 'DeFiMatrix.agent',
    owner: null,
    level: 'REGISTERED',
    blocker: 'Claims rebalancing and yield strategy; no endpoint, feedback or validation observed.',
    observedAt: '2026-08-29T13:52:42Z',
  },
  {
    category: 'Grid Trading',
    tokenId: '269224',
    name: 'ChainHelix Grid',
    owner: null,
    level: 'METADATA_VALID',
    blocker: 'Agent Card advertises ERC-8183, but its runtime URL points at localhost.',
    observedAt: '2026-08-29T13:52:42Z',
  },
  {
    category: 'Yield Optimisation',
    tokenId: '293012',
    name: 'TermiX Yield Optimizer',
    owner: null,
    level: 'REGISTERED',
    blocker: 'Registered A2A service, but the 8004scan health check returned HTTP 404.',
    observedAt: '2026-08-29T13:52:42Z',
  },
  {
    category: 'Yield Optimisation',
    tokenId: '6441',
    name: 'DeFi Trading Agent SperaxOS',
    owner: null,
    level: 'REGISTERED',
    blocker: 'Claims yield optimisation, swaps and farming; endpoint and category task untested.',
    observedAt: '2026-08-29T13:52:42Z',
  },
  {
    category: 'Health Factor Monitoring',
    tokenId: '292058',
    name: 'BNB Lending Guardian',
    owner: null,
    level: 'REGISTERED',
    blocker: 'Relevant Venus description, but the 8004scan health check returned HTTP 404.',
    observedAt: '2026-08-29T13:52:42Z',
  },
];
