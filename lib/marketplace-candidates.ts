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
  observedAt: string;
};

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
    observedAt: '2026-08-29T13:52:42Z',
  },
];
