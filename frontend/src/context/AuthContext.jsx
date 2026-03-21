import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../services/api";
import {
  AUTH_STORAGE_KEY,
  clearStoredJson,
  readStoredJson,
  writeStoredJson,
} from "../utils/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredJson(AUTH_STORAGE_KEY, null));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      writeStoredJson(AUTH_STORAGE_KEY, session);
    } else {
      clearStoredJson(AUTH_STORAGE_KEY);
    }
  }, [session]);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      setSession(response);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload) => {
    setIsLoading(true);
    try {
      const response = await authApi.signup(payload);
      setSession(response);
      return response;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!session?.token) {
      return null;
    }

    const user = await authApi.getProfile();
    setSession((current) => (current ? { ...current, user } : current));
    return user;
  };

  const logout = () => {
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token: session?.token ?? null,
        user: session?.user ?? null,
        expiresAt: session?.expiresAt ?? null,
        isAuthenticated: Boolean(session?.token),
        isLoading,
        login,
        signup,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
