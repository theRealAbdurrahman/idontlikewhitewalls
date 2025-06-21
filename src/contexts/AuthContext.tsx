import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useAuthStore } from "../stores/authStore";
import { useAppStore } from "../stores/appStore";
import { mockEvents, mockQuestions, mockNotifications, mockChatThreads } from "../data/mockData";

/**
 * Authentication context interface
 */
interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  loading: boolean;
}

/**
 * Authentication context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication provider component that manages auth state and loads initial data
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isAuthenticated, user, loading } = useAuthStore();
  const { setEvents, setQuestions, setNotifications, setChatThreads } = useAppStore();

  // Load initial data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // Load mock data - in a real app, this would be API calls
      setEvents(mockEvents);
      setQuestions(mockQuestions);
      setNotifications(mockNotifications);
      setChatThreads(mockChatThreads);
    }
  }, [isAuthenticated, user, setEvents, setQuestions, setNotifications, setChatThreads]);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};