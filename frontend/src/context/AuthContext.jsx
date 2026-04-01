import PropTypes from "prop-types";
import { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { authApi } from "../services/api";
import { clearCheckoutDraftForUser } from "../utils/checkoutStorage";
import { clearCheckoutSessionForUser, clearLastPlacedOrderIdForUser } from "../utils/checkoutSession";
import { formatApiError } from "../utils/format";
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

  useEffect(() => {
    if (!session?.token) {
      return;
    }

    let isMounted = true;

    authApi
      .getProfile()
      .then((user) => {
        if (isMounted) {
          setSession((current) => (current ? { ...current, user } : current));
        }
      })
      .catch((error) => {
        if (isMounted && error?.response?.status === 401) {
          setSession(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [session?.token]);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      setSession(response);
      toast.success("Signed in successfully.");
      return response;
    } catch (error) {
      toast.error(formatApiError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload) => {
    setIsLoading(true);
    try {
      const response = await authApi.signup(payload);
      setSession(response);
      toast.success("Account created successfully.");
      return response;
    } catch (error) {
      toast.error(formatApiError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const googleAuth = async (payload) => {
    setIsLoading(true);
    try {
      const response = await authApi.googleAuth(payload);
      setSession(response);
      toast.success("Google sign-in completed.");
      return response;
    } catch (error) {
      toast.error(formatApiError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const phoneAuth = async (payload) => {
    setIsLoading(true);
    try {
      const response = await authApi.phoneAuth(payload);
      setSession(response);
      toast.success("Phone number verified.");
      return response;
    } catch (error) {
      toast.error(formatApiError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!session?.token) {
      return null;
    }

    try {
      const user = await authApi.getProfile();
      setSession((current) => (current ? { ...current, user } : current));
      return user;
    } catch (error) {
      if (error?.response?.status === 401) {
        setSession(null);
      }
      throw error;
    }
  };

  const updateProfile = async (payload) => {
    try {
      const user = await authApi.updateProfile(payload);
      setSession((current) => (current ? { ...current, user } : current));
      toast.success("Profile updated.");
      return user;
    } catch (error) {
      toast.error(formatApiError(error));
      throw error;
    }
  };

  const sendEmailVerification = async () => {
    try {
      const response = await authApi.sendEmailVerification();
      toast.success(response?.message ?? "Verification link prepared.");
      return response;
    } catch (error) {
      toast.error(formatApiError(error));
      throw error;
    }
  };

  const logout = () => {
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    clearCheckoutDraftForUser(session?.user ?? null);
    clearCheckoutSessionForUser(session?.user ?? null);
    clearLastPlacedOrderIdForUser(session?.user ?? null);
    setSession(null);
    toast.success("Signed out.");
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
        googleAuth,
        phoneAuth,
        refreshProfile,
        updateProfile,
        sendEmailVerification,
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
