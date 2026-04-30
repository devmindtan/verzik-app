import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CompactContextType {
  compact: boolean;
  setCompact: (v: boolean) => void;
}

const CompactContext = createContext<CompactContextType | undefined>(undefined);

export function CompactProvider({ children }: { children: ReactNode }) {
  const [compact, setCompactState] = useState(() => {
    const stored = localStorage.getItem('compactView');
    return stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('compactView', String(compact));
    if (compact) {
      document.documentElement.classList.add('compact');
    } else {
      document.documentElement.classList.remove('compact');
    }
  }, [compact]);

  const setCompact = (v: boolean) => setCompactState(v);

  return (
    <CompactContext.Provider value={{ compact, setCompact }}>
      {children}
    </CompactContext.Provider>
  );
}

export function useCompact() {
  const context = useContext(CompactContext);
  if (!context) throw new Error('useCompact must be used within CompactProvider');
  return context;
}
