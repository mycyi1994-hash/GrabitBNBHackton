#!/usr/bin/env node
/**
 * Altana session setup helper.
 *
 *   node scripts/altana-setup.mjs keys    generate the two server-only keys
 *   node scripts/altana-setup.mjs check   report whether the agent can act yet
 *
 * Keys are generated locally and printed once. Nothing is transmitted, and
 * nothing is written to disk by this script — paste the lines into .env.local
 * yourself so the keys never pass through a tool that logs its output.
 */
import { readFileSync } from 'node:fs';
import { createPublicClient, formatEther, formatUnits, http, keccak256 } from 'viem';
import { bscTestnet } from 'viem/chains';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';

const NETWORK = {
  chainId: 97,
  rpcUrls: [
    'https://bsc-testnet-rpc.publicnode.com',
    'https://bsc-testnet-dataseed.bnbchain.org',
    'https://data-seed-prebsc-1-s1.bnbchain.org:8545',
  ],
  explorer: 'https://testnet.bscscan.com',
  keyStore: '0x6b8361C29d05D498b1a12B54A37310f94171E94A',
  paymentToken: '0xc70B8741B8B07A6d61E54fd4B20f22Fa648E5565',
  faucetGas: 'https://testnet.bnbchain.org/faucet-smart',
  faucetToken: 'https://united-coin-u.github.io/u-faucet/',
};

/** Enough for the KeyStore registration fee plus a few intents. */
const MIN_GAS_WEI = 20_000_000_000_000_000n; // 0.02 tBNB
const HIRE_BUDGET = 100_000_000_000_000_000n; // 0.10 $U escrowed per job
// One task per category for the Agent Advantage Report, plus retry headroom.
const REPORT_BUDGET = HIRE_BUDGET * 20n; // 2.00 $U

const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'a', type: 'address' }], outputs: [{ type: 'uint256' }] },
];
const KEYSTORE_ABI = [
  { name: 'getKeys', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ type: 'bytes32[]' }] },
  { name: 'isValidKey', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }, { name: 'keyId', type: 'bytes32' }], outputs: [{ type: 'bool' }] },
];

function readEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const out = {};
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
        if (match) out[match[1]] = match[2].replace(/^["']|["']$/g, '');
      }
      if (out.GRABIT_ALTANA_ADMIN_PRIVATE_KEY) return { file, env: out };
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

function keys() {
  const adminKey = generatePrivateKey();
  const sessionKey = generatePrivateKey();
  const admin = privateKeyToAccount(adminKey);
  const session = privateKeyToAccount(sessionKey);

  console.log('\nTestnet-only keys. Never reuse a Mainnet key, never commit .env.local,');
  console.log('and never paste these into a chat, an issue or a terminal that is being recorded.\n');
  console.log(`GRABIT_ALTANA_ADMIN_PRIVATE_KEY=${adminKey}`);
  console.log(`GRABIT_ALTANA_SESSION_PRIVATE_KEY=${sessionKey}`);
  console.log(`\nAgent wallet address — this is the one you fund: ${admin.address}`);
  console.log(`Session key address (no funding needed):        ${session.address}`);
  console.log(`\n  tBNB faucet:    ${NETWORK.faucetGas}`);
  console.log(`  test $U faucet: ${NETWORK.faucetToken}`);
  console.log(`  explorer:       ${NETWORK.explorer}/address/${admin.address}`);
  console.log('\nThen run: node scripts/altana-setup.mjs check\n');
}

async function firstReachableClient() {
  const failures = [];
  for (const url of NETWORK.rpcUrls) {
    try {
      const client = createPublicClient({ chain: bscTestnet, transport: http(url, { timeout: 10_000, retryCount: 0 }) });
      const id = await client.getChainId();
      if (id === NETWORK.chainId) return { client, url };
      failures.push(`${url}: reported chain ${id}`);
    } catch (error) {
      failures.push(`${url}: ${error instanceof Error ? error.message.split('\n')[0] : 'unreachable'}`);
    }
  }
  throw new Error(`No BSC Testnet RPC was reachable.\n  ${failures.join('\n  ')}`);
}

async function check() {
  const loaded = readEnv();
  if (!loaded) {
    console.error('\nNo GRABIT_ALTANA_ADMIN_PRIVATE_KEY found in .env.local or .env.');
    console.error('Run: node scripts/altana-setup.mjs keys\n');
    process.exit(1);
  }
  const { file, env } = loaded;
  if (!env.GRABIT_ALTANA_SESSION_PRIVATE_KEY) {
    console.error(`\nGRABIT_ALTANA_SESSION_PRIVATE_KEY is missing from ${file}.\n`);
    process.exit(1);
  }

  const admin = privateKeyToAccount(env.GRABIT_ALTANA_ADMIN_PRIVATE_KEY);
  const session = privateKeyToAccount(env.GRABIT_ALTANA_SESSION_PRIVATE_KEY);
  if (admin.address.toLowerCase() === session.address.toLowerCase()) {
    console.error('\nThe admin and session keys are the same. They must differ: the session key is');
    console.error('the one the agent signs with, and its authority is capped on-chain.\n');
    process.exit(1);
  }

  console.log(`\nRead from ${file}`);
  console.log(`Agent wallet   ${admin.address}`);
  console.log(`Session key    ${session.address}`);

  const { client, url } = await firstReachableClient();
  console.log(`RPC            ${url}\n`);

  const keyId = keccak256(session.publicKey);
  const [gas, token, registeredKeys, keyValid] = await Promise.all([
    client.getBalance({ address: admin.address }),
    client.readContract({ address: NETWORK.paymentToken, abi: ERC20_ABI, functionName: 'balanceOf', args: [admin.address] }).catch(() => null),
    client.readContract({ address: NETWORK.keyStore, abi: KEYSTORE_ABI, functionName: 'getKeys', args: [admin.address] }).catch(() => []),
    client.readContract({ address: NETWORK.keyStore, abi: KEYSTORE_ABI, functionName: 'isValidKey', args: [admin.address, keyId] }).catch(() => false),
  ]);

  const rows = [
    ['tBNB for gas', gas >= MIN_GAS_WEI, `${formatEther(gas)} tBNB (need ${formatEther(MIN_GAS_WEI)})`, NETWORK.faucetGas],
    ['test $U for one hire', token !== null && token >= HIRE_BUDGET, token === null ? 'could not read balance' : `${formatUnits(token, 18)} $U (need ${formatUnits(HIRE_BUDGET, 18)})`, NETWORK.faucetToken],
    ['test $U for the 4-task report', token !== null && token >= REPORT_BUDGET, token === null ? 'could not read balance' : `${formatUnits(token, 18)} $U (want ${formatUnits(REPORT_BUDGET, 18)})`, NETWORK.faucetToken],
    ['session registered in KeyStore', Boolean(keyValid), keyValid ? 'valid' : `${registeredKeys.length} key(s) on this wallet, none matching this session`, ''],
  ];

  let blocked = false;
  for (const [label, pass, detail, fix] of rows) {
    if (!pass) blocked = true;
    console.log(`${pass ? 'PASS' : 'TODO'}  ${label.padEnd(32)} ${detail}`);
    if (!pass && fix) console.log(`      → ${fix}`);
  }

  console.log('');
  if (!keyValid && gas >= MIN_GAS_WEI) {
    console.log('Next: open /activate and press GRANT SESSION. It confirms on-chain and can take a minute.');
  } else if (keyValid) {
    console.log('Next: POST /api/altana/hire {"registry":"304493","dryRun":true}, then drop dryRun to fund it.');
  } else {
    console.log('Next: fund the agent wallet above, then re-run this check.');
  }
  console.log(`\nWallet on explorer: ${NETWORK.explorer}/address/${admin.address}\n`);
  process.exit(blocked ? 1 : 0);
}

const command = process.argv[2];
if (command === 'keys') keys();
else if (command === 'check') {
  // A helper should report a problem, not dump a stack at whoever ran it.
  await check().catch((error) => {
    console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
} else {
  console.log('\nUsage:\n  node scripts/altana-setup.mjs keys    generate the two server-only keys');
  console.log('  node scripts/altana-setup.mjs check   report whether the agent can act yet\n');
  process.exit(1);
}
