import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';

export type UserRole = 'superadmin' | 'admin' | 'delivery';

interface AuthContextData {
  userToken: string | null;
  userRole: UserRole | null;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('@auth_token');
        if (token) {
          const decoded = jwtDecode<{ role: UserRole }>(token);
          setUserToken(token);
          setUserRole(decoded.role);
        }
      } catch (e) {
        console.error("Failed to restore token", e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (token: string) => {
    try {
      await AsyncStorage.setItem('@auth_token', token);
      const decoded = jwtDecode<{ role: UserRole }>(token);
      setUserToken(token);
      setUserRole(decoded.role);
    } catch (e) {
      console.error("Failed to login", e);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('@auth_token');
      setUserToken(null);
      setUserRole(null);
    } catch (e) {
      console.error("Failed to logout", e);
    }
  };

  return (
    <AuthContext.Provider value={{ userToken, userRole, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
