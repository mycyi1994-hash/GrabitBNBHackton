export type AgentCategory =
  | 'Rebalancing'
  | 'Grid Trading'
  | 'Yield Optimisation'
  | 'Health Factor Monitoring';

export type AgentRisk = 'Low' | 'Medium' | 'High';

export type Agent = {
  slug: string;
  name: string;
  initials: string;
  tagline: string;
  category: AgentCategory;
  description: string;
  strategy: string;
  protocol: string;
  identity: string;
  owner: string;
  wallet: string;
  reputation: number;
  jobs: number;
  uptime: number;
  fee: number;
  returnValue: string;
  returnLabel: string;
  apr: number;
  drawdown: number;
  risk: AgentRisk;
  activityDays: number;
  lastActive: string;
  permissions: string[];
  highlights: string[];
  chart: number[];
  tone: 'gold' | 'blue' | 'green' | 'violet';
};

export const agents: Agent[] = [
  {
    slug: 'range-pilot',
    name: 'RangePilot',
    initials: 'RP',
    tagline: 'PancakeSwap V3 LP manager',
    category: 'Rebalancing',
    description: 'Monitors concentrated liquidity positions and re-centres ranges when fee efficiency drops below target.',
    strategy: 'Volatility-aware range selection with fee, slippage and impermanent-loss gates.',
    protocol: 'PancakeSwap V3',
    identity: 'BSC · ERC-8004 #18402',
    owner: '0x71A4...8C2F',
    wallet: '0xB07C...91A8',
    reputation: 94,
    jobs: 1284,
    uptime: 99.4,
    fee: 0.08,
    returnValue: '+18.4%',
    returnLabel: '90D net return',
    apr: 18.4,
    drawdown: 4.8,
    risk: 'Medium',
    activityDays: 184,
    lastActive: '12s ago',
    permissions: ['Pancake V3 Position Manager', 'USDT spend ≤ 250/day', 'Expires in 7 days'],
    highlights: ['1,284 settled jobs', 'Live testnet execution', 'Revocable Altana session'],
    chart: [32, 38, 36, 45, 49, 46, 58, 62, 67, 65, 76, 82],
    tone: 'gold',
  },
  {
    slug: 'liquidity-keeper',
    name: 'Liquidity Keeper',
    initials: 'LK',
    tagline: 'Stable-pair range optimiser',
    category: 'Rebalancing',
    description: 'Maintains narrow stablecoin LP ranges and pauses automation when depeg risk is detected.',
    strategy: 'Peg confidence scoring combined with fee-density and gas-cost optimisation.',
    protocol: 'PancakeSwap Infinity',
    identity: 'BSC · ERC-8004 #22019',
    owner: '0x19C2...71D4',
    wallet: '0x9A31...20F7',
    reputation: 91,
    jobs: 932,
    uptime: 98.9,
    fee: 0.06,
    returnValue: '+9.7%',
    returnLabel: '90D net return',
    apr: 9.7,
    drawdown: 1.9,
    risk: 'Low',
    activityDays: 121,
    lastActive: '1m ago',
    permissions: ['Infinity Position Manager', 'USDC spend ≤ 500/day', 'Expires in 14 days'],
    highlights: ['Stablecoin specialist', 'Depeg circuit breaker', '930+ completed jobs'],
    chart: [38, 40, 43, 47, 51, 50, 56, 58, 63, 66, 70, 74],
    tone: 'blue',
  },
  {
    slug: 'grid-forge',
    name: 'GridForge',
    initials: 'GF',
    tagline: 'BNB range trading agent',
    category: 'Grid Trading',
    description: 'Places and refreshes spot grid orders across adaptive BNB price bands.',
    strategy: 'ATR-based spacing, inventory limits and trend-aware grid suspension.',
    protocol: 'PancakeSwap Smart Router',
    identity: 'BSC · ERC-8004 #17388',
    owner: '0x8C14...2E90',
    wallet: '0x441B...7D02',
    reputation: 89,
    jobs: 2248,
    uptime: 99.1,
    fee: 0.05,
    returnValue: '+13.2%',
    returnLabel: '90D net return',
    apr: 13.2,
    drawdown: 7.6,
    risk: 'Medium',
    activityDays: 209,
    lastActive: '31s ago',
    permissions: ['Pancake Smart Router', 'USDT spend ≤ 150/day', 'Expires in 3 days'],
    highlights: ['2,248 filled jobs', 'Adaptive grid spacing', 'Trend circuit breaker'],
    chart: [34, 45, 39, 53, 47, 61, 55, 69, 64, 75, 71, 80],
    tone: 'violet',
  },
  {
    slug: 'orbit-grid',
    name: 'Orbit Grid',
    initials: 'OG',
    tagline: 'Stablecoin mean-reversion grid',
    category: 'Grid Trading',
    description: 'Captures micro-spreads on high-liquidity stable pairs with strict inventory controls.',
    strategy: 'Low-latency mean reversion with price-impact and depeg protection.',
    protocol: 'PancakeSwap StableSwap',
    identity: 'BSC · ERC-8004 #23941',
    owner: '0xF111...48C0',
    wallet: '0x003A...FF17',
    reputation: 87,
    jobs: 1769,
    uptime: 98.6,
    fee: 0.04,
    returnValue: '+7.9%',
    returnLabel: '90D net return',
    apr: 7.9,
    drawdown: 2.4,
    risk: 'Low',
    activityDays: 97,
    lastActive: '2m ago',
    permissions: ['Pancake StableSwap', 'USDC spend ≤ 200/day', 'Expires in 5 days'],
    highlights: ['Low-volatility strategy', 'Price impact guard', 'Fully onchain receipts'],
    chart: [40, 42, 45, 43, 48, 52, 55, 54, 59, 61, 65, 68],
    tone: 'blue',
  },
  {
    slug: 'yield-route',
    name: 'YieldRoute',
    initials: 'YR',
    tagline: 'BSC yield allocator',
    category: 'Yield Optimisation',
    description: 'Compares net yields across vetted BSC protocols and moves funds only when the expected gain clears costs.',
    strategy: 'Risk-adjusted APY routing with protocol exposure caps and cooldowns.',
    protocol: 'Venus · Lista · PancakeSwap',
    identity: 'BSC · ERC-8004 #19872',
    owner: '0xA701...382E',
    wallet: '0xCC52...100D',
    reputation: 93,
    jobs: 846,
    uptime: 99.7,
    fee: 0.1,
    returnValue: '11.8%',
    returnLabel: 'current net APY',
    apr: 11.8,
    drawdown: 3.2,
    risk: 'Medium',
    activityDays: 146,
    lastActive: '46s ago',
    permissions: ['Venus, Lista and PancakeSwap', 'USDT spend ≤ 300/day', 'Expires in 7 days'],
    highlights: ['Net-of-cost routing', 'Protocol exposure caps', '99.7% uptime'],
    chart: [36, 41, 45, 44, 50, 56, 60, 58, 67, 72, 78, 84],
    tone: 'green',
  },
  {
    slug: 'apex-harvest',
    name: 'Apex Harvest',
    initials: 'AH',
    tagline: 'Automated reward compounder',
    category: 'Yield Optimisation',
    description: 'Harvests, swaps and re-stakes DeFi rewards when compounding is economically worthwhile.',
    strategy: 'Gas-aware compounding with token quality and slippage filters.',
    protocol: 'Lista · PancakeSwap',
    identity: 'BSC · ERC-8004 #25404',
    owner: '0x0B41...D532',
    wallet: '0x716C...9EA1',
    reputation: 86,
    jobs: 684,
    uptime: 98.1,
    fee: 0.04,
    returnValue: '8.6%',
    returnLabel: 'current net APY',
    apr: 8.6,
    drawdown: 3.9,
    risk: 'Medium',
    activityDays: 72,
    lastActive: '4m ago',
    permissions: ['Lista and PancakeSwap', 'Reward tokens only', 'Expires in 7 days'],
    highlights: ['Gas-aware harvests', 'Slippage protected', 'Reward-token isolation'],
    chart: [30, 37, 35, 43, 49, 47, 54, 58, 62, 65, 71, 75],
    tone: 'gold',
  },
  {
    slug: 'sentinel-hf',
    name: 'Sentinel HF',
    initials: 'SH',
    tagline: 'Venus liquidation protection',
    category: 'Health Factor Monitoring',
    description: 'Tracks Venus lending positions and adds collateral before the configured safety threshold is breached.',
    strategy: 'Continuous health-factor monitoring with oracle divergence and spend-limit checks.',
    protocol: 'Venus',
    identity: 'BSC · ERC-8004 #16503',
    owner: '0xA092...7C61',
    wallet: '0x881D...44B9',
    reputation: 97,
    jobs: 3612,
    uptime: 99.97,
    fee: 0.03,
    returnValue: '99.97%',
    returnLabel: 'monitor uptime',
    apr: 0,
    drawdown: 0,
    risk: 'Low',
    activityDays: 247,
    lastActive: '18s ago',
    permissions: ['Venus Comptroller', 'USDT top-up ≤ 100/day', 'Expires in 30 days'],
    highlights: ['0 missed alerts', 'Oracle divergence checks', 'Instant session revoke'],
    chart: [74, 76, 78, 79, 81, 84, 83, 87, 89, 91, 93, 96],
    tone: 'blue',
  },
  {
    slug: 'collateral-guard',
    name: 'Collateral Guard',
    initials: 'CG',
    tagline: 'Multi-market loan monitor',
    category: 'Health Factor Monitoring',
    description: 'Prioritises at-risk lending positions and recommends or executes capped collateral top-ups.',
    strategy: 'Portfolio-wide liquidation distance scoring with configurable escalation rules.',
    protocol: 'Venus · Lista',
    identity: 'BSC · ERC-8004 #24631',
    owner: '0xD612...0A86',
    wallet: '0x220C...341A',
    reputation: 90,
    jobs: 1488,
    uptime: 99.2,
    fee: 0.05,
    returnValue: '1.74',
    returnLabel: 'avg protected HF',
    apr: 0,
    drawdown: 0,
    risk: 'Low',
    activityDays: 112,
    lastActive: '55s ago',
    permissions: ['Venus and Lista lending', 'USDT top-up ≤ 200/day', 'Expires in 14 days'],
    highlights: ['Multi-protocol coverage', 'Escalation rules', '1,488 protected jobs'],
    chart: [65, 70, 68, 74, 76, 79, 82, 80, 86, 89, 91, 94],
    tone: 'green',
  },
];

export const featuredAgentSlugs = ['range-pilot', 'sentinel-hf', 'yield-route'];

export function getAgent(slug: string) {
  return agents.find((agent) => agent.slug === slug);
}

export const categoryLabels: Record<AgentCategory, string> = {
  Rebalancing: 'Liquidity',
  'Grid Trading': 'Trading',
  'Yield Optimisation': 'Yield',
  'Health Factor Monitoring': 'Protection',
};
