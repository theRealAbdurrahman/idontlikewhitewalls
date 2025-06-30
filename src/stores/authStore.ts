import { UserProfileResponse } from "../models";
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * User interface representing a user in the system
 * Updated to match both Logto user claims and backend User model
 */


/**
 * Authentication state interface
 */
interface AuthState {
  isAuthenticated: boolean;
  user: UserProfileResponse | null;
  loading: boolean;
  error: string | null;
}

/**
 * Authentication actions interface
 */
interface AuthActions {
  // Logto integration
  setAuthenticated: (authenticated: boolean) => void;
  setCurrentUser: (backendUser: UserProfileResponse | null) => void;
  
  // Profile management
  updateProfile: (updates: Partial<UserProfileResponse>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Legacy methods (deprecated but kept for compatibility)
  logout: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithLinkedIn: () => Promise<void>;
  initializeMockUser: () => void;
}

/**
 * Authentication store using Zustand with persistence
 */
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Initial state - no longer hardcoded
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,

      setAuthenticated: (authenticated: boolean) => {
        set({ isAuthenticated: authenticated });
      },

      setCurrentUser: (backendUser: UserProfileResponse | null) => {
        if (!backendUser) {
          set({ user: null, isAuthenticated: false });
          return;
        }


        set({ 
          user: backendUser, 
          isAuthenticated: true,
          loading: false,
          error: null 
        });
      },

      updateProfile: (updates: Partial<UserProfileResponse>) => {
        const { user } = get();
        if (user) {
          set({ 
            user: { ...user, ...updates } 
          });
        }
      },

      setLoading: (loading: boolean) => set({ loading }),
      
      setError: (error: string | null) => set({ error }),

      // Legacy methods - kept for compatibility but now deprecated
      logout: () => {
        set({ 
          isAuthenticated: false, 
          user: null, 
          error: null 
        });
      },

      login: async () => {
        // Deprecated - now handled by Logto
        console.warn("useAuthStore.login() is deprecated. Use Logto signIn() instead.");
      },

      loginWithLinkedIn: async () => {
        // Deprecated - now handled by Logto with LinkedIn connector
        console.warn("useAuthStore.loginWithLinkedIn() is deprecated. Use Logto with LinkedIn connector instead.");
      },

      initializeMockUser: () => {
        // Deprecated - now using real Logto users
        console.warn("useAuthStore.initializeMockUser() is deprecated. Use setCurrentUser() instead.");
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        // Don't persist authentication state to force fresh login flow
        // isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);