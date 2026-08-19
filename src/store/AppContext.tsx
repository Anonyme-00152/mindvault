import React, { createContext, useContext } from 'react';
import { useStore } from './useStore';

type StoreType = ReturnType<typeof useStore>;

const AppContext = createContext<StoreType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const store = useStore();
  return <AppContext.Provider value={store}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
