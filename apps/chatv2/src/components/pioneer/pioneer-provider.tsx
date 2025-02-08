'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { PioneerProvider as BasePioneerProvider, usePioneer } from '@coinmasters/pioneer-react';

interface PioneerContextType {
  state: {
    app: any;
    username: string | null;
    isInitialized: boolean;
  };
  connectWallet: () => Promise<void>;
}

const PioneerContext = createContext<PioneerContextType | undefined>(undefined);

export const usePioneerApp = () => {
  const context = useContext(PioneerContext);
  if (!context) {
    throw new Error('usePioneerApp must be used within a PioneerProvider');
  }
  return context;
};

interface PioneerProviderProps {
  children: React.ReactNode;
}

export const PioneerProvider: React.FC<PioneerProviderProps> = ({ children }) => {
  const { state, onStart, connectWallet } = usePioneer();
  const [isInitialized, setIsInitialized] = useState(false);

  const connectWalletPioneer = async () => {
    try {
      if (!isInitialized) {
        await onStart([], {
          appName: 'KeepKey Support',
          appIcon: 'https://keepkey.com/logo.png',
          spec: process.env.NEXT_PUBLIC_PIONEER_URL || 'http://127.0.0.1:9001/spec/swagger.json',
          wss: process.env.NEXT_PUBLIC_PIONEER_WSS || 'ws://127.0.0.1:9001'
        });
        setIsInitialized(true);
      }
      await connectWallet();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  };

  const contextValue = {
    state: {
      app: state.app,
      username: state.username || null,
      isInitialized
    },
    connectWallet: connectWalletPioneer
  };

  return (
    <PioneerContext.Provider value={contextValue}>
      {children}
    </PioneerContext.Provider>
  );
};

// Export a wrapper component that combines both providers
export const CombinedPioneerProvider: React.FC<PioneerProviderProps> = ({ children }) => {
  return (
    <BasePioneerProvider>
      <PioneerProvider>
        {children}
      </PioneerProvider>
    </BasePioneerProvider>
  );
}; 
