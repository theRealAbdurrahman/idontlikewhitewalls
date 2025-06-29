import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * User interface representing a user in the system
 * Updated to match both Logto user claims and backend User model
 */
interface User {
  // Core identity (from Logto)
  id: string;
  sub?: string; // Logto subject ID
  name: string;
  email: string;
  avatar?: string;
  picture?: string; // Logto profile picture
  
  // Social profiles
  linkedinId?: string;
  linkedin_url?: string;
  
  // Profile data
  bio?: string;
  title?: string;
  company?: string;
  location?: string;
  
  // Backend-specific data
  first_name?: string;
  last_name?: string;
  profile_picture?: string;
  auth_id?: string; // Maps to Logto sub
  
  // Stats (will be calculated from backend)
  connections: number;
  meTooCount: number;
  canHelpCount: number;
  questionsCount: number;
  verified: boolean;
  joinedAt: string;
}

/**
 * Authentication state interface
 */
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Authentication actions interface
 */
interface AuthActions {
  // Logto integration
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  updateUserFromLogto: (logtoUser: any) => void;
  
  // Profile management
  updateProfile: (updates: Partial<User>) => void;
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

      // Core Logto integration methods
      setUser: (user: User | null) => {
        set({ user });
      },

      setAuthenticated: (authenticated: boolean) => {
        set({ isAuthenticated: authenticated });
      },

      updateUserFromLogto: (logtoUser: any) => {
        if (!logtoUser) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        // Transform Logto user claims to our User interface
        const transformedUser: User = {
          // Core identity from Logto
          id: logtoUser.sub || logtoUser.id || `logto_${Date.now()}`,
          sub: logtoUser.sub,
          auth_id: logtoUser.sub,
          name: logtoUser.name || logtoUser.username || `${logtoUser.given_name || ''} ${logtoUser.family_name || ''}`.trim() || 'User',
          email: logtoUser.email || '',
          
          // Profile pictures (try multiple sources)
          avatar: logtoUser.picture || logtoUser.avatar,
          picture: logtoUser.picture,
          profile_picture: logtoUser.picture,
          
          // Name breakdown
          first_name: logtoUser.given_name || logtoUser.name?.split(' ')[0] || '',
          last_name: logtoUser.family_name || logtoUser.name?.split(' ').slice(1).join(' ') || '',
          
          // Social profiles
          linkedinId: logtoUser.linkedin_id,
          linkedin_url: logtoUser.linkedin_url,
          
          // Profile data (may come from OIDC claims)
          bio: logtoUser.bio,
          title: logtoUser.job_title || logtoUser.title,
          company: logtoUser.company || logtoUser.organization,
          location: logtoUser.location || logtoUser.address?.locality,
          
          // Default stats (will be updated from backend later)
          connections: 0,
          meTooCount: 0,
          canHelpCount: 0,
          questionsCount: 0,
          verified: logtoUser.email_verified || false,
          joinedAt: new Date().toISOString(),
        };

        set({ 
          user: transformedUser, 
          isAuthenticated: true,
          loading: false,
          error: null 
        });
      },

      updateProfile: (updates: Partial<User>) => {
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
        console.warn("useAuthStore.initializeMockUser() is deprecated. Use updateUserFromLogto() instead.");
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);