import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface AppContextValue {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const value = useMemo<AppContextValue>(
    () => ({
      isSidebarOpen,
      toggleSidebar: () => setIsSidebarOpen((open) => !open)
    }),
    [isSidebarOpen]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};
