import { createPublicClient, formatUnits, http, type Address } from 'viem';
import { bsc } from 'viem/chains';

export type StrategyMetric = {
  label: string;
  value: string;
  note: string;
};

export type StrategyResult = {
  version: 2;
  kind: 'grabit-category-agent-result';
  registry: string;
  service: string;
  category: string;
  task: string;
  verdict: string;
  summary: string;
  dataQuality: 'LIVE_ONCHAIN' | 'LIVE_CHAIN_PLUS_DEMO_INPUTS';
  metrics: StrategyMetric[];
  actions: string[];
  risks: string[];
  assumptions: string[];
  details: Record<string, unknown>;
  evidence: {
    executionNetwork: 'BSC Testnet';
    executionChainId: 97;
    sourceBlock: string;
    gasPriceGwei: string;
    observedAt: string;
    externalSource?: string;
  };
  capitalMovedByAgent: false;
};

type StrategyContext = {
  registry: string;
  service: string;
  task: string;
  sourceBlock: string;
  gasPriceGwei: string;
  observedAt: string;
};

const VENUS_CORE_COMPTROLLER = '0xfD36E2c2a6789Db23113685031d7F16329158384';
const VENUS_CORE_STABLE_MARKETS = [
  { symbol: 'USDT', name: 'Venus USDT', address: '0xfD5840Cd36d94D7229439859C0112a4185BC0255', decimals: 18 },
  { symbol: 'USDC', name: 'Venus USDC', address: '0xecA88125a5ADbe82614ffC12D0DB554E2e2867C8', decimals: 18 },
  { symbol: 'FDUSD', name: 'Venus FDUSD', address: '0xC4eF4229FEc74Ccfe17B2bdeF7715fAC740BA0ba', decimals: 18 },
  { symbol: 'USD1', name: 'Venus USD1', address: '0x0C1DA220D301155b87318B90692Da8dc43B67340', decimals: 18 },
  { symbol: 'U', name: 'Venus U', address: '0x3d5E269787d562b74aCC55F18Bd26C5D09Fa245E', decimals: 18 },
] as const;
const VENUS_VTOKEN_ABI = [
  {
    type: 'function',
    name: 'supplyRatePerBlock',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getCash',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'comptroller',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
  },
] as const;

function percent(value: number, digits = 2) {
  return value.toFixed(digits) + '%';
}

function usd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function supplyApyPercent(ratePerBlock: bigint) {
  const blocksPerDay = 80 * 60 * 24;
  const dailyRate = Number(ratePerBlock) / 1e18 * blocksPerDay;
  return (Math.pow(1 + dailyRate, 365) - 1) * 100;
}

function base(context: StrategyContext) {
  return {
    version: 2 as const,
    kind: 'grabit-category-agent-result' as const,
    registry: context.registry,
    service: context.service,
    task: context.task,
    evidence: {
      executionNetwork: 'BSC Testnet' as const,
      executionChainId: 97 as const,
      sourceBlock: context.sourceBlock,
      gasPriceGwei: context.gasPriceGwei,
      observedAt: context.observedAt,
    },
    capitalMovedByAgent: false as const,
  };
}

function rebalanceResult(context: StrategyContext): StrategyResult {
  const notionalUsd = 10_000;
  const currentWbnbPct = 60;
  const targetWbnbPct = 50;
  const tradeUsd = notionalUsd * Math.abs(currentWbnbPct - targetWbnbPct) / 100;
  const poolFeePct = 0.25;
  const slippageCapPct = 0.2;
  const feeUsd = tradeUsd * poolFeePct / 100;
  const slippageUsd = tradeUsd * slippageCapPct / 100;

  return {
    ...base(context),
    category: 'Rebalancing',
    verdict: 'REBALANCE $1,000 WBNB INTO USDT',
    summary: 'The reference position is 10 percentage points overweight WBNB. A single bounded swap returns it to the 50/50 target.',
    dataQuality: 'LIVE_CHAIN_PLUS_DEMO_INPUTS',
    metrics: [
      { label: 'TARGET', value: '50 / 50', note: 'WBNB / USDT' },
      { label: 'TRADE', value: usd(tradeUsd), note: 'WBNB into USDT' },
      { label: 'POOL FEE', value: usd(feeUsd), note: percent(poolFeePct) + ' reference tier' },
      { label: 'MAX COST', value: usd(feeUsd + slippageUsd), note: 'fee + slippage cap' },
    ],
    actions: [
      'Sell only the WBNB amount above the 50% target.',
      'Reject execution if quoted slippage exceeds 0.20%.',
      'Re-read balances after settlement before opening a new LP range.',
    ],
    risks: [
      'The reference position is a demo input, not a connected wallet balance.',
      'Price movement between quote and execution can change the required trade.',
    ],
    assumptions: [
      '$10,000 reference position.',
      'Current weights: 60% WBNB and 40% USDT.',
      'Reference pool fee: 0.25%; maximum accepted slippage: 0.20%.',
    ],
    details: {
      pair: 'WBNB/USDT',
      notionalUsd,
      currentWeights: { WBNB: currentWbnbPct, USDT: 40 },
      targetWeights: { WBNB: targetWbnbPct, USDT: 50 },
      proposedTrade: { sell: 'WBNB', buy: 'USDT', amountUsd: tradeUsd },
    },
  };
}

function gridResult(context: StrategyContext): StrategyResult {
  const levels = 10;
  const bandPct = 15;
  const notionalUsd = 1_000;
  const lowerPct = -bandPct / 2;
  const stepPct = bandPct / (levels - 1);
  const orderUsd = notionalUsd / levels;
  const feePerSwapPct = 0.25;
  const breakEvenPct = feePerSwapPct * 2;
  const gridLevels = Array.from({ length: levels }, (_, index) => ({
    level: index + 1,
    priceOffsetPct: Number((lowerPct + stepPct * index).toFixed(3)),
    orderUsd,
  }));

  return {
    ...base(context),
    category: 'Grid Trading',
    verdict: '10-LEVEL GRID IS WIDE ENOUGH FOR FEES',
    summary: 'A 15% band creates 1.67% spacing, which is wider than the 0.50% reference round-trip fee break-even.',
    dataQuality: 'LIVE_CHAIN_PLUS_DEMO_INPUTS',
    metrics: [
      { label: 'LEVELS', value: String(levels), note: 'equal notional orders' },
      { label: 'SPACING', value: percent(stepPct), note: 'between adjacent levels' },
      { label: 'PER ORDER', value: usd(orderUsd), note: 'of $1,000 notional' },
      { label: 'BREAK-EVEN', value: percent(breakEvenPct), note: 'fees only, before slippage' },
    ],
    actions: [
      'Anchor the percentage grid to a fresh executable pool quote.',
      'Place $100 equivalent at each level from -7.5% to +7.5%.',
      'Pause the grid when volatility exits the configured band.',
    ],
    risks: [
      'Absolute token prices are intentionally omitted until a live pool quote is connected.',
      'Fee break-even excludes slippage, gas and adverse selection.',
    ],
    assumptions: [
      'Task inputs: 10 levels, 15% total band and $1,000 notional.',
      'Reference fee input: 0.25% per swap.',
    ],
    details: {
      pair: 'WBNB/USDT',
      bandPct,
      lowerOffsetPct: lowerPct,
      upperOffsetPct: bandPct / 2,
      gridLevels,
    },
  };
}

async function yieldResult(context: StrategyContext): Promise<StrategyResult> {
  const client = createPublicClient({
    chain: bsc,
    transport: http('https://bsc-dataseed.bnbchain.org', { timeout: 12_000, retryCount: 1 }),
  });
  const venusSourceBlock = await client.getBlockNumber();
  const markets = (await Promise.all(VENUS_CORE_STABLE_MARKETS.map(async (market) => {
    const [ratePerBlock, cash, comptroller] = await Promise.all([
      client.readContract({
        address: market.address as Address,
        abi: VENUS_VTOKEN_ABI,
        functionName: 'supplyRatePerBlock',
        blockNumber: venusSourceBlock,
      }),
      client.readContract({
        address: market.address as Address,
        abi: VENUS_VTOKEN_ABI,
        functionName: 'getCash',
        blockNumber: venusSourceBlock,
      }),
      client.readContract({
        address: market.address as Address,
        abi: VENUS_VTOKEN_ABI,
        functionName: 'comptroller',
        blockNumber: venusSourceBlock,
      }),
    ]);
    if (comptroller.toLowerCase() !== VENUS_CORE_COMPTROLLER.toLowerCase()) return null;
    return {
      address: market.address,
      name: market.name,
      symbol: market.symbol,
      apyPercent: supplyApyPercent(ratePerBlock),
      liquidityUsd: Number(formatUnits(cash, market.decimals)),
      ratePerBlock: ratePerBlock.toString(),
    };
  })))
    .filter((market): market is NonNullable<typeof market> => Boolean(market))
    .sort((left, right) => right.apyPercent - left.apyPercent);
  if (!markets.length) throw new Error('No verified Venus Core stablecoin markets were readable onchain.');
  const best = markets[0];

  return {
    ...base(context),
    category: 'Yield Optimisation',
    verdict: 'BEST BASE RATE: ' + best.name,
    summary: 'Direct Venus Core contract reads rank ' + best.symbol + ' first among five stablecoin markets by base supply APY. Rewards are excluded and no funds were moved.',
    dataQuality: 'LIVE_ONCHAIN',
    metrics: [
      { label: 'BEST BASE APY', value: percent(best.apyPercent), note: best.name + ', rewards excluded' },
      { label: 'LIQUIDITY', value: usd(best.liquidityUsd), note: 'onchain getCash, assuming stablecoin peg' },
      { label: 'MARKETS', value: String(markets.length), note: 'Venus Core stablecoins checked' },
      { label: 'EXECUTION GAS', value: context.gasPriceGwei + ' gwei', note: 'BSC Testnet source block' },
    ],
    actions: [
      'Compare the best live base APY with the wallet current market.',
      'Calculate annual yield edge from the actual position size.',
      'Move only when the projected yield edge exceeds gas and switching risk.',
    ],
    risks: [
      'Base APY excludes XVS and other reward incentives.',
      'Supply pause, cap, oracle and executable quote checks are still required before a transaction.',
      'APY is variable and can change immediately after the observation.',
    ],
    assumptions: [
      'Ranking compares five current BNB Chain Venus Core stablecoin vTokens.',
      'Available token cash is shown as USD under a one-dollar stablecoin peg assumption.',
      'No account position size was supplied, so a time-to-break-even is not claimed.',
    ],
    details: {
      rankedMarkets: markets,
      venusCoreComptroller: VENUS_CORE_COMPTROLLER,
      venusSourceBlock: venusSourceBlock.toString(),
      rateMethod: 'supplyRatePerBlock with daily compounding at 80 BNB Chain blocks per minute',
      executionWarning: 'Live contract rates are evidence for ranking only; pause, cap, oracle and account checks are required before execution.',
    },
    evidence: {
      ...base(context).evidence,
      externalSource: 'https://github.com/VenusProtocol/venus-protocol-documentation/blob/main/deployed-contracts/markets.md',
    },
  };
}

function healthResult(context: StrategyContext): StrategyResult {
  const collateralUsd = 10_000;
  const debtUsd = 5_000;
  const liquidationThreshold = 0.8;
  const healthFactor = collateralUsd * liquidationThreshold / debtUsd;
  const liquidationDropPct = (1 - debtUsd / (collateralUsd * liquidationThreshold)) * 100;
  const stressCases = [10, 20, 30].map((dropPct) => ({
    collateralDropPct: dropPct,
    healthFactor: Number((healthFactor * (1 - dropPct / 100)).toFixed(2)),
  }));

  return {
    ...base(context),
    category: 'Health Factor Monitoring',
    verdict: 'HEALTHY, BUT ALERT BELOW 1.25',
    summary: 'The reference Venus position has a 1.60 health factor and reaches liquidation after a 37.5% collateral-value drop.',
    dataQuality: 'LIVE_CHAIN_PLUS_DEMO_INPUTS',
    metrics: [
      { label: 'HEALTH FACTOR', value: healthFactor.toFixed(2), note: 'reference position' },
      { label: 'LIQUIDATION DROP', value: percent(liquidationDropPct, 1), note: 'collateral value' },
      { label: '20% STRESS', value: stressCases[1].healthFactor.toFixed(2), note: 'above 1.0' },
      { label: 'ALERT', value: '< 1.25', note: 'recommended monitor threshold' },
    ],
    actions: [
      'Warn the owner when health factor falls below 1.25.',
      'At 1.15, prepare a repay or collateral-add plan.',
      'Never submit a rescue transaction without a separate permission.',
    ],
    risks: [
      'The reference position is a demo input, not a connected Venus account.',
      'Oracle moves and interest accrual can reduce health factor between blocks.',
    ],
    assumptions: [
      '$10,000 collateral, $5,000 debt and 80% liquidation threshold.',
      'Collateral and debt are treated as single USD-valued baskets.',
    ],
    details: {
      collateralUsd,
      debtUsd,
      liquidationThresholdPct: liquidationThreshold * 100,
      stressCases,
    },
  };
}

export async function buildCategoryStrategyResult(context: StrategyContext): Promise<StrategyResult> {
  if (context.service === 'rebalance_plan') return rebalanceResult(context);
  if (context.service === 'grid_plan') return gridResult(context);
  if (context.service === 'yield_plan') return yieldResult(context);
  if (context.service === 'health_factor') return healthResult(context);
  throw new Error('Unsupported reference Agent service: ' + context.service);
}
