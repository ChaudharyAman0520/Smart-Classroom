import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import axios from "axios";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: "teacher" | "student", otp: string) => Promise<boolean>;
  sendOtp: (email: string) => Promise<{ success: boolean; error?: string; otp?: string }>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-login if local token and user information exist
  useEffect(() => {
    const storedToken = localStorage.getItem("scas_token");
    const storedUser = localStorage.getItem("scas_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser) as User;
        setUser(parsedUser);
        // Sync default axios header
        axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      } catch (e) {
        console.error("Failed to recover authenticated user session.", e);
        localStorage.removeItem("scas_token");
        localStorage.removeItem("scas_user");
      }
    }
    setLoading(false);

    // Global Axios interceptor for 401 Unauthorized handling
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          console.warn("Unauthorized API call detected; routing to logout flow.");
          localStorage.removeItem("scas_token");
          localStorage.removeItem("scas_user");
          delete axios.defaults.headers.common["Authorization"];
          setUser(null);
          setToken(null);
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("/api/auth/login", { email, password });
      const { token: receivedToken, user: receivedUser } = response.data;
      
      setUser(receivedUser);
      setToken(receivedToken);
      localStorage.setItem("scas_token", receivedToken);
      localStorage.setItem("scas_user", JSON.stringify(receivedUser));
      
      axios.defaults.headers.common["Authorization"] = `Bearer ${receivedToken}`;
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Login failed. Please verify credentials.");
      setLoading(false);
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: "teacher" | "student",
    otp: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("/api/auth/register", { name, email, password, role, otp });
      const { token: receivedToken, user: receivedUser } = response.data;
      
      setUser(receivedUser);
      setToken(receivedToken);
      localStorage.setItem("scas_token", receivedToken);
      localStorage.setItem("scas_user", JSON.stringify(receivedUser));
      
      axios.defaults.headers.common["Authorization"] = `Bearer ${receivedToken}`;
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || "Registration failed. Email might already be in use.");
      setLoading(false);
      return false;
    }
  };

  const sendOtp = async (email: string): Promise<{ success: boolean; error?: string; otp?: string }> => {
    setError(null);
    try {
      const response = await axios.post("/api/auth/send-otp", { email });
      return { 
        success: true, 
        otp: response.data.otp, 
      };
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || "Failed to transmit OTP code.";
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("scas_token");
    localStorage.removeItem("scas_user");
    delete axios.defaults.headers.common["Authorization"];
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    token,
    loading,
    error,
    login,
    register,
    sendOtp,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be executed inside an AuthProvider component.");
  }
  return context;
}
