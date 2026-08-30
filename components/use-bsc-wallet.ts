'use client';

import { useCallback, useEffect, useState } from 'react';

export type ProviderRequest = {
  method: string;
  params?: readonly unknown[] | object;
};

export type Eip1193Provider = {
  request(args: ProviderRequest): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export const BSC_MAINNET = {
  chainId: 56,
  chainHex: '0x38',
  name: 'BNB Smart Chain Mainnet',
  rpcUrls: [
    'https://bsc-dataseed.bnbchain.org',
    'https://bsc-dataseed-public.bnbchain.org',
  ],
  explorerUrl: 'https://bscscan.com',
} as const;

function providerCode(error: unknown) {
  if (error && typeof error === 'object' && 'code' in error) return Number(error.code);
  return null;
}

export function walletError(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message);
    const normalized = message.toLowerCase();
    if (normalized.includes('user rejected') || providerCode(error) === 4001) {
      return 'Wallet request cancelled. No further transaction was sent.';
    }
    if (normalized.includes('insufficient funds')) {
      return 'Not enough BNB for gas or not enough $U for this step.';
    }
    if (normalized.includes('not valid json') || normalized.includes('unsupported_operation')) {
      return 'The wallet RPC response was invalid. Switch to BNB Smart Chain Mainnet in the wallet and retry.';
    }
    return message;
  }
  return 'The wallet request was not completed.';
}

export function getInjectedProvider() {
  const provider = window.ethereum;
  if (!provider) throw new Error('No EIP-1193 browser wallet was detected. Install MetaMask or another compatible wallet.');
  return provider;
}

async function addBscMainnet(provider: Eip1193Provider) {
  await provider.request({
    method: 'wallet_addEthereumChain',
    params: [{
      chainId: BSC_MAINNET.chainHex,
      chainName: BSC_MAINNET.name,
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      rpcUrls: BSC_MAINNET.rpcUrls,
      blockExplorerUrls: [BSC_MAINNET.explorerUrl],
    }],
  });
}

export async function ensureBscMainnet(provider: Eip1193Provider) {
  const current = String(await provider.request({ method: 'eth_chainId' }));
  if (current.toLowerCase() === BSC_MAINNET.chainHex) return;
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: BSC_MAINNET.chainHex }] });
  } catch (error) {
    if (providerCode(error) !== 4902) throw error;
    await addBscMainnet(provider);
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
    const providerTimer = window.setTimeout(() => {
      setHasProvider(Boolean(provider));
      if (provider) void refresh().catch(() => undefined);
    }, 0);
    if (!provider) return () => window.clearTimeout(providerTimer);
    const handleAccounts = (value: unknown) => {
      const accounts = Array.isArray(value) ? value.map(String) : [];
      setAccount(accounts[0] ?? null);
    };
    const handleChain = (value: unknown) => setChainId(Number.parseInt(String(value), 16));
    provider.on?.('accountsChanged', handleAccounts);
    provider.on?.('chainChanged', handleChain);
    return () => {
      window.clearTimeout(providerTimer);
      provider.removeListener?.('accountsChanged', handleAccounts);
      provider.removeListener?.('chainChanged', handleChain);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const provider = getInjectedProvider();
      const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[];
      const chain = String(await provider.request({ method: 'eth_chainId' }));
      const selected = accounts[0] ?? null;
      setAccount(selected);
      setChainId(Number.parseInt(chain, 16));
      return selected;
    } catch (nextError) {
      setError(walletError(nextError));
      throw nextError;
    } finally {
      setConnecting(false);
    }
  }, []);

  const switchToMainnet = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const provider = getInjectedProvider();
      await ensureBscMainnet(provider);
      await refresh();
    } catch (nextError) {
      setError(walletError(nextError));
      throw nextError;
    } finally {
      setConnecting(false);
    }
  }, [refresh]);

  const waitForReceipt = useCallback(async (hash: string) => {
    const provider = getInjectedProvider();
    for (let attempt = 0; attempt < 90; attempt += 1) {
      const receipt = await provider.request({ method: 'eth_getTransactionReceipt', params: [hash] }) as { status?: string; blockNumber?: string } | null;
      if (receipt?.blockNumber) {
        if (receipt.status === '0x0') throw new Error('Transaction reverted on-chain. No later step was sent.');
        return receipt;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 2000));
    }
    throw new Error('Transaction was not confirmed after three minutes. Check BscScan before retrying.');
  }, []);

  return {
    account,
    chainId,
    hasProvider,
    connecting,
    error,
    isMainnet: chainId === BSC_MAINNET.chainId,
    connect,
    switchToMainnet,
    refresh,
    waitForReceipt,
  };
}
