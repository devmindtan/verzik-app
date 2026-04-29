import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserSession } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  session: UserSession | null;
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedSession = authService.getCurrentSession();
    if (storedSession) {
      setSession(storedSession);
    }
    setIsLoading(false);
  }, []);

  const connectWallet = (address: string) => {
    const session = authService.connectWallet(address);
    if (session) {
      setSession(session);
    }
  };

  const disconnectWallet = () => {
    authService.disconnectWallet();
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, connectWallet, disconnectWallet, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
