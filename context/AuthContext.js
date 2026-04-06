import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HUB_STORAGE_KEY,
  LEGACY_USER_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  login as loginRequest,
  register as registerRequest,
  setAuthToken,
} from '../services/api';

const AuthContext = createContext(null);

const parseStoredValue = async (storageKey, rawValue) => {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    await AsyncStorage.removeItem(storageKey);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const [storedToken, storedUser, legacyStoredUser] = await AsyncStorage.multiGet([
          TOKEN_STORAGE_KEY,
          USER_STORAGE_KEY,
          LEGACY_USER_STORAGE_KEY,
        ]);
        const nextToken = storedToken?.[1] || null;
        const nextUser =
          (await parseStoredValue(USER_STORAGE_KEY, storedUser?.[1])) ||
          (await parseStoredValue(LEGACY_USER_STORAGE_KEY, legacyStoredUser?.[1]));

        setToken(nextToken);
        setUser(nextUser);
        setAuthToken(nextToken);

        if (!storedUser?.[1] && legacyStoredUser?.[1] && nextUser) {
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
          await AsyncStorage.removeItem(LEGACY_USER_STORAGE_KEY);
        }
      } finally {
        setIsHydrating(false);
      }
    };

    hydrateAuth();
  }, []);

  const persistAuth = async (authResponse) => {
    const nextToken = authResponse?.token || null;
    const nextUser = authResponse?.user
      ? {
          ...authResponse.user,
          role: authResponse.user.role || authResponse.role || '',
        }
      : null;
    const hasHub = Object.prototype.hasOwnProperty.call(authResponse || {}, 'hub');
    const nextHub = hasHub ? authResponse?.hub || null : null;

    setToken(nextToken);
    setUser(nextUser);
    setAuthToken(nextToken);

    const writes = [];
    const removals = [LEGACY_USER_STORAGE_KEY];

    if (nextToken) {
      writes.push([TOKEN_STORAGE_KEY, nextToken]);
    } else {
      removals.push(TOKEN_STORAGE_KEY);
    }

    if (nextUser) {
      writes.push([USER_STORAGE_KEY, JSON.stringify(nextUser)]);
    } else {
      removals.push(USER_STORAGE_KEY);
    }

    if (hasHub && nextHub) {
      writes.push([HUB_STORAGE_KEY, JSON.stringify(nextHub)]);
    } else {
      removals.push(HUB_STORAGE_KEY);
    }

    if (writes.length) {
      await AsyncStorage.multiSet(writes);
    }

    if (removals.length) {
      await AsyncStorage.multiRemove(removals);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await loginRequest(credentials);
      await persistAuth(response);
      return response;
    } catch (error) {
      console.log('Login error response:', error?.response || error);
      throw error;
    }
  };

  const register = async (payload) => {
    try {
      const response = await registerRequest(payload);
      await persistAuth(response);
      return response;
    } catch (error) {
      console.log('Register error response:', error?.response || error);
      throw error;
    }
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
