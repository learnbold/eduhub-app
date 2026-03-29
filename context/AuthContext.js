import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as loginRequest, register as registerRequest, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const [storedToken, storedUser] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);
        const nextToken = storedToken?.[1] || null;
        const nextUser = storedUser?.[1] ? JSON.parse(storedUser[1]) : null;

        setToken(nextToken);
        setUser(nextUser);
        setAuthToken(nextToken);
      } finally {
        setIsHydrating(false);
      }
    };

    hydrateAuth();
  }, []);

  const persistAuth = async (authResponse) => {
    const nextToken = authResponse?.token || null;
    const nextUser = authResponse?.user || null;

    setToken(nextToken);
    setUser(nextUser);
    setAuthToken(nextToken);

    if (nextToken && nextUser) {
      await AsyncStorage.multiSet([
        [TOKEN_KEY, nextToken],
        [USER_KEY, JSON.stringify(nextUser)],
      ]);
      return;
    }

    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  };

  const login = async (credentials) => {
    const response = await loginRequest(credentials);
    await persistAuth(response);
    return response;
  };

  const register = async (payload) => {
    const response = await registerRequest(payload);
    await persistAuth(response);
    return response;
  };

  const logout = async () => {
    await persistAuth(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isHydrating,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [token, user, isHydrating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
