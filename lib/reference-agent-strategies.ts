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
  dataQuality: 'LIVE_INDEXED' | 'LIVE_CHAIN_PLUS_DEMO_INPUTS';
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

type VenusMarket = {
  address?: unknown;
  name?: unknown;
  underlyingSymbol?: unknown;
  supplyApy?: unknown;
  totalSupplyApyDecimal?: unknown;
  liquidityCents?: unknown;
  isListed?: unknown;
  isPriceInvalid?: unknown;
};

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
  const response = await fetch('https://api.venus.io/markets?chainId=56&underlyingSymbol=USDT&limit=50', {
    headers: { 'accept-version': 'stable' },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error('Venus market API returned HTTP ' + response.status + '.');
  const payload = await response.json() as { result?: VenusMarket[] };
  const markets = (Array.isArray(payload.result) ? payload.result : [])
    .filter((market) => market.isListed === true && market.isPriceInvalid !== true)
    .map((market) => {
      const decimal = Number(market.totalSupplyApyDecimal);
      const fallback = Number(market.supplyApy);
      const apyPercent = Number.isFinite(decimal)
        ? decimal * 100
        : Number.isFinite(fallback) ? fallback : 0;
      const liquidityCents = Number(market.liquidityCents);
      return {
        address: String(market.address || ''),
        name: String(market.name || 'Unnamed Venus market'),
        symbol: String(market.underlyingSymbol || 'USDT'),
        apyPercent,
        liquidityUsd: Number.isFinite(liquidityCents) ? liquidityCents / 100 : 0,
      };
    })
    .sort((left, right) => right.apyPercent - left.apyPercent);
  if (!markets.length) throw new Error('Venus returned no listed USDT supply markets.');
  const best = markets[0];

  return {
    ...base(context),
    category: 'Yield Optimisation',
    verdict: 'BEST INDEXED MARKET: ' + best.name,
    summary: 'The official Venus indexed API currently ranks ' + best.name + ' first for USDT supply APY. No funds were moved.',
    dataQuality: 'LIVE_INDEXED',
    metrics: [
      { label: 'BEST APY', value: percent(best.apyPercent), note: best.name },
      { label: 'LIQUIDITY', value: usd(best.liquidityUsd), note: 'indexed available liquidity' },
      { label: 'MARKETS', value: String(markets.length), note: 'listed USDT markets checked' },
      { label: 'EXECUTION GAS', value: context.gasPriceGwei + ' gwei', note: 'BSC Testnet source block' },
    ],
    actions: [
      'Compare the best indexed APY with the wallet current market.',
      'Calculate annual yield edge from the actual position size.',
      'Move only when the projected yield edge exceeds gas and switching risk.',
    ],
    risks: [
      'Indexed Venus API data can lag the chain and is not an execution quote.',
      'APY is variable and can change immediately after the observation.',
    ],
    assumptions: [
      'Ranking includes listed BNB Chain markets whose underlying symbol is USDT.',
      'No account position size was supplied, so a time-to-break-even is not claimed.',
    ],
    details: {
      rankedMarkets: markets.slice(0, 4),
      apiVersion: 'stable',
      apiWarning: 'Indexed data is evidence for ranking only; contract reads are required before execution.',
    },
    evidence: {
      ...base(context).evidence,
      externalSource: 'https://api.venus.io/markets?chainId=56&underlyingSymbol=USDT',
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
