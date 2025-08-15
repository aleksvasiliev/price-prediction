import { useState, useEffect, useCallback } from 'react';
import { MetaMaskSDK } from '@metamask/sdk';
import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
  error: string | null;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    isConnecting: false,
    error: null,
  });

  const [sdk, setSdk] = useState<MetaMaskSDK | null>(null);

  useEffect(() => {
    const initSDK = async () => {
      try {
        const MMSDK = new MetaMaskSDK({
          dappMetadata: {
            name: "BTC 10s Guess",
            url: window.location.href,
          },
          infuraAPIKey: process.env.VITE_INFURA_KEY,
        });

        setSdk(MMSDK);

        // Check if already connected
        try {
          const provider = MMSDK.getProvider();
          if (provider) {
            const accounts = await provider.request({
              method: 'eth_accounts',
            }) as string[];

            if (accounts && accounts.length > 0) {
              setWalletState({
                isConnected: true,
                address: accounts[0],
                isConnecting: false,
                error: null,
              });
            }
          }
        } catch (checkError) {
          console.log('Not connected yet:', checkError);
        }
      } catch (error) {
        console.error('Failed to initialize MetaMask SDK:', error);
        setWalletState(prev => ({
          ...prev,
          error: 'Failed to initialize wallet',
        }));
      }
    };

    initSDK();
  }, []);

  const connectWallet = useCallback(async () => {
    if (!sdk) {
      setWalletState(prev => ({
        ...prev,
        error: 'Wallet SDK not initialized',
      }));
      return null;
    }

    setWalletState(prev => ({
      ...prev,
      isConnecting: true,
      error: null,
    }));

    try {
      const accounts = await sdk.connect();
      
      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        
        // Create SIWE message
        const domain = window.location.host;
        const origin = window.location.origin;
        const message = new SiweMessage({
          domain,
          address,
          statement: 'Sign in to BTC 10s Guess',
          uri: origin,
          version: '1',
          chainId: 1,
          nonce: Math.random().toString(36).substring(7),
        });

        const messageString = message.prepareMessage();

        // Request signature
        const provider = sdk.getProvider();
        const signature = await provider?.request({
          method: 'personal_sign',
          params: [messageString, address],
        }) as string;

        setWalletState({
          isConnected: true,
          address,
          isConnecting: false,
          error: null,
        });

        // Return authentication data
        return {
          address,
          message: messageString,
          signature,
        };
      } else {
        throw new Error('No accounts returned');
      }
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      setWalletState({
        isConnected: false,
        address: null,
        isConnecting: false,
        error: error.message || 'Failed to connect wallet',
      });
      return null;
    }
  }, [sdk]);

  const disconnectWallet = useCallback(() => {
    if (sdk) {
      sdk.disconnect();
    }
    setWalletState({
      isConnected: false,
      address: null,
      isConnecting: false,
      error: null,
    });
  }, [sdk]);

  const formatAddress = useCallback((address: string | null) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, []);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    formatAddress,
  };
};
