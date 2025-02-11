'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SDK } from '@coinmasters/pioneer-sdk';
import { EventEmitter } from 'events';

interface Message {
  id: string;
  type: 'message' | 'event' | 'system' | 'view';
  from: 'user' | 'computer';
  text?: string;
  data?: any;
  timestamp: Date;
  view?: any;
}

interface PioneerState {
  app: any;
  username: string | null;
  isInitialized: boolean;
  isConnecting: boolean;
  error: Error | null;
  events: EventEmitter | null;
  messages: Message[];
  status: string;
}

interface PioneerContextType {
  state: PioneerState;
  sdk: SDK | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  sendMessage: (message: string, roomId?: string) => Promise<void>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
}

const initialState: PioneerState = {
  app: null,
  username: null,
  isInitialized: false,
  isConnecting: false,
  error: null,
  events: null,
  messages: [],
  status: 'disconnected'
};

const PioneerContext = createContext<PioneerContextType | undefined>(undefined);

export const usePioneer = () => {
  const context = useContext(PioneerContext);
  if (!context) {
    throw new Error('usePioneer must be used within a PioneerProvider');
  }
  return context;
};

// Add alias for backward compatibility
export const usePioneerApp = usePioneer;

interface PioneerProviderProps {
  children: React.ReactNode;
}

export const PioneerProvider: React.FC<PioneerProviderProps> = ({ children }) => {
  const [state, setState] = useState<PioneerState>(initialState);
  const [sdk, setSdk] = useState<SDK | null>(null);

  const addMessage = (message: Message) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
  };

  // Initialize SDK
  useEffect(() => {
    const initializeSdk = async () => {
      if (sdk) {
        console.log('SDK already initialized, skipping');
        return;
      }

      try {
        // Generate or retrieve queryKey from localStorage
        const queryKey = localStorage.getItem('queryKey') || `key:${crypto.randomUUID()}`;
        localStorage.setItem('queryKey', queryKey);

        // Generate or retrieve keepkeyApiKey from localStorage
        let keepkeyApiKey = localStorage.getItem('keepkeyApiKey');
        if (!keepkeyApiKey) {
          keepkeyApiKey = '123';
          localStorage.setItem('keepkeyApiKey', keepkeyApiKey);
        }

        // Check if KeepKey Desktop is running before initializing
        try {
          const response = await fetch('http://localhost:1646/docs');
          if (response.status !== 200) {
            throw new Error('KeepKey Desktop is not running');
          }
        } catch (error) {
          console.error('Failed to connect to KeepKey Desktop:', error);
          throw new Error('KeepKey Desktop is not running or not accessible');
        }

        const config = {
          appName: 'KeepKey Support',
          appIcon: 'https://keepkey.com/logo.png',
          spec: process.env.NEXT_PUBLIC_PIONEER_URL || 'http://127.0.0.1:9001/spec/swagger.json',
          wss: process.env.NEXT_PUBLIC_PIONEER_WSS || 'ws://127.0.0.1:9001',
          username: 'user', // Default username, will be updated on connect
          queryKey,
          keepkeyApiKey,
          ethplorerApiKey: process.env.NEXT_PUBLIC_ETHPLORER_API_KEY || '',
          covalentApiKey: process.env.NEXT_PUBLIC_COVALENT_API_KEY || '',
          utxoApiKey: process.env.NEXT_PUBLIC_UTXO_API_KEY || '',
          walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
          blockchains: ['eip155:1', 'bip122:000000000019d6689c085ae165831e93'], // Default chains
          paths: [],
        };

        const pioneerSdk = new SDK(config.spec, config);
        const pioneer = await pioneerSdk.init();

        // Set up event listeners
        pioneerSdk.events.on('SET_STATUS', (status) => {
          setState(prev => ({ ...prev, status }));
          addMessage({
            id: Date.now().toString(),
            type: 'system',
            from: 'computer',
            text: `Status changed to: ${status}`,
            timestamp: new Date()
          });
        });

        pioneerSdk.events.on('SET_CONTEXT', (context) => {
          setState(prev => ({ ...prev, app: { ...prev.app, context } }));
          addMessage({
            id: Date.now().toString(),
            type: 'system',
            from: 'computer',
            text: `Context updated: ${context}`,
            timestamp: new Date()
          });
        });

        pioneerSdk.events.on('message', (data) => {
          console.log('Pioneer message:', data);
          try {
            // Handle both string and object formats
            const dataObj = typeof data === 'string' ? JSON.parse(data) : data;
            
            // Extract message from various possible locations
            let text = '';
            if (dataObj.text) text = dataObj.text;
            else if (dataObj.message) text = dataObj.message;
            else if (dataObj.sentences) text = Array.isArray(dataObj.sentences) ? dataObj.sentences.join(' ') : dataObj.sentences;
            else if (dataObj.responses?.sentences) text = Array.isArray(dataObj.responses.sentences) ? dataObj.responses.sentences.join(' ') : dataObj.responses.sentences;
            
            // Handle views
            const views = dataObj.views || dataObj.responses?.views || [];
            
            // Add text message if present
            if (text) {
              addMessage({
                id: Date.now().toString(),
                type: 'message',
                from: 'computer',
                text,
                timestamp: new Date()
              });
            }

            // Add view messages if present
            views.forEach((view: any, index: number) => {
              addMessage({
                id: `view-${Date.now()}-${index}`,
                type: 'view',
                from: 'computer',
                view,
                timestamp: new Date()
              });
            });

          } catch (error) {
            console.error('Error handling message:', error);
            addMessage({
              id: Date.now().toString(),
              type: 'system',
              from: 'computer',
              text: 'Error processing message',
              data: error,
              timestamp: new Date()
            });
          }
        });

        setSdk(pioneerSdk);
        setState(prev => ({
          ...prev,
          app: pioneer,
          events: pioneerSdk.events,
          isInitialized: true
        }));

        // Add initial system message
        addMessage({
          id: Date.now().toString(),
          type: 'system',
          from: 'computer',
          text: 'Pioneer SDK initialized successfully',
          timestamp: new Date()
        });

      } catch (error) {
        console.error('Failed to initialize Pioneer SDK:', error);
        setState(prev => ({ 
          ...prev, 
          error: error as Error,
          isInitialized: false
        }));
        addMessage({
          id: Date.now().toString(),
          type: 'system',
          from: 'computer',
          text: error instanceof Error ? error.message : 'Failed to initialize Pioneer SDK',
          data: error,
          timestamp: new Date()
        });
        throw error; // Re-throw to be caught by the component
      }
    };

    initializeSdk().catch(error => {
      console.error('SDK initialization failed:', error);
    });

    return () => {
      // Cleanup event listeners
      if (sdk) {
        sdk.events.removeAllListeners();
      }
    };
  }, []); // Only run once on mount

  const connectWallet = async () => {
    if (!sdk) {
      throw new Error('SDK not initialized');
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      await sdk.sync();
      const username = sdk.username;
      setState(prev => ({
        ...prev,
        username,
        isConnecting: false
      }));

      addMessage({
        id: Date.now().toString(),
        type: 'system',
        from: 'computer',
        text: `Connected successfully as ${username}`,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error as Error
      }));
      addMessage({
        id: Date.now().toString(),
        type: 'system',
        from: 'computer',
        text: 'Failed to connect wallet',
        data: error,
        timestamp: new Date()
      });
      throw error;
    }
  };

  const disconnectWallet = async () => {
    if (!sdk) {
      return;
    }

    try {
      await sdk.clearWalletState();
      setState(prev => ({
        ...prev,
        username: null,
        app: null
      }));
      addMessage({
        id: Date.now().toString(),
        type: 'system',
        from: 'computer',
        text: 'Wallet disconnected',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      setState(prev => ({
        ...prev,
        error: error as Error
      }));
      addMessage({
        id: Date.now().toString(),
        type: 'system',
        from: 'computer',
        text: 'Failed to disconnect wallet',
        data: error,
        timestamp: new Date()
      });
    }
  };

  const sendMessage = async (message: string, roomId?: string) => {
    if (!sdk || !state.app?.pioneer) {
      throw new Error('SDK not initialized or not connected');
    }

    try {
      const currentRoomId = roomId || localStorage.getItem('myRoomId');
      if (!currentRoomId) {
        throw new Error('No room ID available');
      }

      addMessage({
        id: Date.now().toString(),
        type: 'message',
        from: 'user',
        text: message,
        timestamp: new Date()
      });

      const result = await state.app.pioneer.Support({
        roomId: currentRoomId,
        message,
      });

      return result;
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage({
        id: Date.now().toString(),
        type: 'system',
        from: 'computer',
        text: 'Failed to send message',
        data: error,
        timestamp: new Date()
      });
      throw error;
    }
  };

  const joinRoom = async (roomId: string) => {
    if (!sdk || !state.app?.pioneer) {
      throw new Error('SDK not initialized or not connected');
    }

    try {
      const response = await state.app.pioneer.JoinRoom({
        roomId,
        username: state.username || '',
        isSupport: true
      });

      addMessage({
        id: Date.now().toString(),
        type: 'system',
        from: 'computer',
        text: `Joined room: ${roomId}`,
        timestamp: new Date()
      });

      return response;
    } catch (error) {
      console.error('Failed to join room:', error);
      addMessage({
        id: Date.now().toString(),
        type: 'system',
        from: 'computer',
        text: 'Failed to join room',
        data: error,
        timestamp: new Date()
      });
      throw error;
    }
  };

  const leaveRoom = async (roomId: string) => {
    if (!sdk || !state.app?.pioneer) {
      throw new Error('SDK not initialized or not connected');
    }

    try {
      // Assuming there's a LeaveRoom method - implement according to your SDK
      const response = await state.app.pioneer.LeaveRoom({
        roomId,
        username: state.username || ''
      });

      addMessage({
        id: Date.now().toString(),
        type: 'system',
        from: 'computer',
        text: `Left room: ${roomId}`,
        timestamp: new Date()
      });

      return response;
    } catch (error) {
      console.error('Failed to leave room:', error);
      addMessage({
        id: Date.now().toString(),
        type: 'system',
        from: 'computer',
        text: 'Failed to leave room',
        data: error,
        timestamp: new Date()
      });
      throw error;
    }
  };

  const contextValue = {
    state,
    sdk,
    connectWallet,
    disconnectWallet,
    sendMessage,
    joinRoom,
    leaveRoom
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
    <PioneerProvider>
      {children}
    </PioneerProvider>
  );
}; 
