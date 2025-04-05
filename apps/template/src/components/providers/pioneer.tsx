'use client'

import * as React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

// Create Pioneer Context
export const PioneerContext = createContext<any>(null)
export const usePioneerContext = () => {
  const context = useContext(PioneerContext)
  if (!context) {
    throw new Error('usePioneerContext must be used within a PioneerContext.Provider')
  }
  return context
}

export interface AppProviderProps {
  onError?: (error: Error, info: any) => void
  children: React.ReactNode
  pioneer?: any // The Pioneer instance
}

export function AppProvider({
  children,
  pioneer,
}: AppProviderProps) {
  const [pioneerInstance, setPioneerInstance] = useState<any>(null)
  
  useEffect(() => {
    // Add connect method if not available
    if (pioneer && !pioneer.connect && typeof pioneer.state?.app?.pioneer?.connectWallet === 'function') {
      pioneer.connect = async () => {
        console.log("Using connectWallet via pioneer.state.app.pioneer");
        return pioneer.state.app.pioneer.connectWallet();
      };
    }
    
    // Add pair method if not available
    if (pioneer && !pioneer.pair && typeof pioneer.connect === 'function') {
      pioneer.pair = pioneer.connect;
    }

    // Add connectWallet method if not available (alias for connect)
    if (pioneer && !pioneer.connectWallet && typeof pioneer.connect === 'function') {
      pioneer.connectWallet = pioneer.connect;
    }
    
    setPioneerInstance(pioneer);
    
    // Debug available methods
    if (pioneer) {
      console.log("Pioneer SDK methods available:",
        Object.keys(pioneer)
          .filter(key => typeof pioneer[key] === 'function')
          .join(", ")
      );
      
      if (pioneer.state?.app?.pioneer) {
        console.log("Pioneer SDK nested methods available:", 
          Object.keys(pioneer.state.app.pioneer)
            .filter(key => typeof pioneer.state.app.pioneer[key] === 'function')
            .join(", ")
        );
      }
    }
  }, [pioneer]);

  return (
    <PioneerContext.Provider value={pioneerInstance || pioneer}>
      {children}
    </PioneerContext.Provider>
  )
}
