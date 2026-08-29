'use client';

import { useCallback, useEffect, useState } from 'react';

type ProviderRequest = {
  method: string;
  params?: readonly unknown[] | object;
};

type Eip1193Provider = {
  request(args: ProviderRequest): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export const BSC_TESTNET = {
  chainId: 97,
  chainHex: '0x61',
  name: 'BNB Smart Chain Testnet',
  rpcUrl: 'https://bsc-testnet-dataseed.bnbchain.org',
  rpcUrls: [
    'https://bsc-testnet-dataseed.bnbchain.org',
    'https://bsc-testnet.bnbchain.org',
    'https://bsc-prebsc-dataseed.bnbchain.org',
  ],
  explorerUrl: 'https://testnet.bscscan.com',
};

function providerError(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message);
    const normalized = message.toLowerCase();
    if (
      normalized.includes('not valid json') ||
      normalized.includes('unsupported_operation') ||
      normalized.includes('failed to fetch') ||
      normalized.includes('network request failed')
    ) {
      return 'Your wallet saved an unusable BSC Testnet RPC. Choose Repair network, then approve the updated network settings.';
    }
    if (normalized.includes('user rejected') || providerCode(error) === 4001) {
      return 'The wallet request was cancelled. No transaction was sent.';
    }
    return message;
  }
  return 'The wallet request was not completed.';
}

function providerCode(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error) {
    return Number(error.code);
  }
  return null;
}

function textToHex(value: string) {
  const bytes = new TextEncoder().encode(value);
  return '0x' + Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function requireProvider() {
  const provider = window.ethereum;
  if (!provider) throw new Error('No EIP-1193 browser wallet was detected. Install MetaMask or another compatible wallet.');
  return provider;
}

async function addBscTestnet(provider: Eip1193Provider) {
  await provider.request({
    method: 'wallet_addEthereumChain',
    params: [{
      chainId: BSC_TESTNET.chainHex,
      chainName: BSC_TESTNET.name,
      nativeCurrency: { name: 'Test BNB', symbol: 'tBNB', decimals: 18 },
      rpcUrls: BSC_TESTNET.rpcUrls,
      blockExplorerUrls: [BSC_TESTNET.explorerUrl],
    }],
  });
}

async function switchToBscTestnet(provider: Eip1193Provider) {
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BSC_TESTNET.chainHex }] });
  } catch (error) {
    if (providerCode(error) !== 4902) throw error;
    await addBscTestnet(provider);
  }
}

export function useBscWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [hasProvider, setHasProvider] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!window.ethereum) return;
    const [accounts, chain] = await Promise.all([
      window.ethereum.request({ method: 'eth_accounts' }) as Promise<string[]>,
      window.ethereum.request({ method: 'eth_chainId' }) as Promise<string>,
    ]);
    setAccount(accounts[0] ?? null);
    setChainId(Number.parseInt(chain, 16));
  }, []);

  useEffect(() => {
    const provider = window.ethereum;
    const providerTimer = window.setTimeout(() => setHasProvider(Boolean(provider)), 0);
    if (!provider) return () => window.clearTimeout(providerTimer);

    const refreshTimer = window.setTimeout(() => {
      void refresh().catch(() => undefined);
    }, 0);
    const handleAccounts = (value: unknown) => {
      const accounts = Array.isArray(value) ? value.map(String) : [];
      setAccount(accounts[0] ?? null);
    };
    const handleChain = (value: unknown) => setChainId(Number.parseInt(String(value), 16));
    provider.on?.('accountsChanged', handleAccounts);
    provider.on?.('chainChanged', handleChain);
    return () => {
      window.clearTimeout(providerTimer);
      window.clearTimeout(refreshTimer);
      provider.removeListener?.('accountsChanged', handleAccounts);
      provider.removeListener?.('chainChanged', handleChain);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const provider = await requireProvider();
      const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
      await switchToBscTestnet(provider);
      const selected = accounts[0] ?? null;
      setAccount(selected);
      setChainId(BSC_TESTNET.chainId);
      return selected;
    } catch (nextError) {
      const message = providerError(nextError);
      setError(message);
      throw nextError;
    } finally {
      setConnecting(false);
    }
  }, []);

  const repairNetwork = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const provider = await requireProvider();
      await addBscTestnet(provider);
      await switchToBscTestnet(provider);
      await refresh();
    } catch (nextError) {
      const message = providerError(nextError);
      setError(message);
      throw nextError;
    } finally {
      setConnecting(false);
    }
  }, [refresh]);

  const sendActivationProof = useCallback(async (payload: string) => {
    const provider = await requireProvider();
    let selected = account;
    if (!selected) selected = await connect();
    if (!selected) throw new Error('No wallet account was selected.');
    await switchToBscTestnet(provider);

    const hash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{
        from: selected,
        to: selected,
        value: '0x0',
        data: textToHex(payload),
      }],
    });
    return String(hash);
  }, [account, connect]);

  const waitForReceipt = useCallback(async (hash: string) => {
    const provider = await requireProvider();
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const receipt = await provider.request({ method: 'eth_getTransactionReceipt', params: [hash] });
      if (receipt) return receipt;
      await new Promise((resolve) => window.setTimeout(resolve, 2000));
    }
    return null;
  }, []);

  return {
    account,
    chainId,
    hasProvider,
    connecting,
    error,
    isTestnet: chainId === BSC_TESTNET.chainId,
    connect,
    repairNetwork,
    sendActivationProof,
    waitForReceipt,
  };
}
