import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'engineer' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (roles: ('admin' | 'engineer' | 'viewer')[]) => boolean;
  isAdmin: boolean;
  isEngineer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('bridgesense_token');
    const savedUser = localStorage.getItem('bridgesense_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (usernameOrEmail: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { usernameOrEmail, password });
      const { token, user: userData } = response.data.data;
      
      localStorage.setItem('bridgesense_token', token);
      localStorage.setItem('bridgesense_user', JSON.stringify(userData));
      
      setToken(token);
      setUser(userData);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('bridgesense_token');
    localStorage.removeItem('bridgesense_user');
    setToken(null);
    setUser(null);
  };

  const hasRole = (roles: ('admin' | 'engineer' | 'viewer')[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = user?.role === 'admin';
  const isEngineer = user?.role === 'engineer' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole, isAdmin, isEngineer }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default useAuth;
