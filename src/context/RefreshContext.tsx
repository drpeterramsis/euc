import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface RefreshContextType {
  refreshCount: number;
  triggerRefresh: () => void;
  isRefreshing: boolean;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [refreshCount, setRefreshCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const triggerRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshCount(prev => prev + 1);
    // Simulate refresh end (in reality, components would listen to refreshCount and fetch)
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshCount, triggerRefresh, isRefreshing }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const ctx = useContext(RefreshContext);
  if (!ctx) throw new Error('useRefresh must be used within RefreshProvider');
  return ctx;
}
