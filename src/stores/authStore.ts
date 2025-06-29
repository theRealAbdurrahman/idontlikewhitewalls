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

      updateUserFromLogto: (backendUser: any) => {
        if (!backendUser) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        // Transform backend UserProfile to our User interface
        const transformedUser: User = {
          // Use backend UUID as the primary ID
          id: backendUser.id,
          sub: backendUser.auth_id, // Store Logto sub for reference
          auth_id: backendUser.auth_id,
          
          // Name composition
          name: `${backendUser.first_name || ''} ${backendUser.last_name || ''}`.trim() || 'User',
          email: backendUser.email || '',
          
          // Profile pictures
          avatar: backendUser.profile_picture,
          picture: backendUser.profile_picture,
          profile_picture: backendUser.profile_picture,
          
          // Name breakdown
          first_name: backendUser.first_name || '',
          last_name: backendUser.last_name || '',
          
          // Social profiles
          linkedin_url: backendUser.linkedin_url,
          
          // Profile data
          bio: backendUser.bio,
          title: backendUser.title,
          company: '', // Not in backend yet
          location: '', // Not in backend yet
          
          // Default stats (will be calculated from backend interactions later)
          connections: 0,
          meTooCount: 0,
          canHelpCount: 0,
          questionsCount: 0,
          verified: backendUser.is_active || false,
          joinedAt: backendUser.created_at || new Date().toISOString(),
        };

        console.log('Storing backend user in AuthStore:', transformedUser);

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