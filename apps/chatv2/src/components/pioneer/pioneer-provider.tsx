'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { PioneerProvider as BasePioneerProvider, usePioneer } from '@coinmasters/pioneer-react';

interface PioneerContextType {
  state: {
    app: any;
    username: string | null;
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
  const { state, onStart } = usePioneer();
  
  useEffect(() => {
    const initPioneer = async () => {
      try {
        await onStart([], {
          appName: 'KeepKey Support',
          appIcon: 'https://keepkey.com/logo.png',
          spec: process.env.NEXT_PUBLIC_PIONEER_URL || 'https://pioneers.dev/spec/swagger.json',
          wss: 'wss://pioneers.dev'
        });
      } catch (error) {
        console.error('Failed to initialize Pioneer:', error);
      }
    };

    initPioneer();
  }, [onStart]);

  const connectWallet = async () => {
    // Implement wallet connection logic here
    console.log('Connecting wallet...');
  };

  const contextValue = {
    state: {
      app: state.app,
      username: state.username || null
    },
    connectWallet
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