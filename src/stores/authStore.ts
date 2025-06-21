import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * User interface representing a user in the system
 */
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  linkedinId?: string;
  bio?: string;
  title?: string;
  company?: string;
  location?: string;
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
  login: (email: string, password: string) => Promise<void>;
  loginWithLinkedIn: () => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Authentication store using Zustand with persistence
 */
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ loading: true, error: null });
        
        try {
          // Simulate API call - replace with actual authentication
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock successful login
          const mockUser: User = {
            id: "user-123",
            name: "Stuart Wilson",
            email,
            avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
            bio: "Tech enthusiast and startup founder",
            title: "Senior Product Manager",
            company: "TechCorp",
            location: "Dublin, Ireland",
            connections: 342,
            meTooCount: 28,
            canHelpCount: 45,
            questionsCount: 12,
            verified: true,
            joinedAt: new Date().toISOString(),
          };

          set({ 
            isAuthenticated: true, 
            user: mockUser, 
            loading: false 
          });
        } catch (error) {
          set({ 
            error: "Login failed. Please try again.", 
            loading: false 
          });
        }
      },

      loginWithLinkedIn: async () => {
        set({ loading: true, error: null });
        
        try {
          // Simulate LinkedIn OAuth flow
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          const mockUser: User = {
            id: "user-linkedin-123",
            name: "Stuart Wilson",
            email: "stuart@example.com",
            avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1",
            linkedinId: "stuart-wilson-123",
            bio: "Tech enthusiast and startup founder passionate about connecting people through technology",
            title: "Senior Product Manager",
            company: "TechCorp",
            location: "Dublin, Ireland",
            connections: 342,
            meTooCount: 28,
            canHelpCount: 45,
            questionsCount: 12,
            verified: true,
            joinedAt: new Date().toISOString(),
          };

          set({ 
            isAuthenticated: true, 
            user: mockUser, 
            loading: false 
          });
        } catch (error) {
          set({ 
            error: "LinkedIn login failed. Please try again.", 
            loading: false 
          });
        }
      },

      logout: () => {
        set({ 
          isAuthenticated: false, 
          user: null, 
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