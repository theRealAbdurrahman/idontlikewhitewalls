/**
 * Webcontainer and testing environment detection utilities
 */

/**
 * Detect if the app is running in a webcontainer environment
 * This includes StackBlitz, Bolt.new, or local development servers
 */
export const isWebcontainerEnv = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const { hostname, origin, href } = window.location;
  
  // Webcontainer indicators
  const webcontainerIndicators = [
    'webcontainer',
    'bolt.new',
    'stackblitz',
    'gitpod',
    'codesandbox',
    'codepen',
    'repl.it',
    'localhost:5173', // Vite dev server
    'localhost:3000', // Common React dev port
    '127.0.0.1:5173',
    '127.0.0.1:3000',
  ];
  
  // Check hostname and origin
  for (const indicator of webcontainerIndicators) {
    if (hostname.includes(indicator) || origin.includes(indicator) || href.includes(indicator)) {
      return true;
    }
  }
  
  // Check for development mode
  if (import.meta.env?.DEV || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')) {
    // Additional dev checks
    if (hostname === 'localhost' || hostname.startsWith('127.0.0.1')) {
      return true;
    }
  }
  
  return false;
};

/**
 * Get mock user data for webcontainer environments
 */
export const getMockUser = () => ({
  id: "d56c36ed-e02a-48fc-bf21-44e079453460", // Matches backend test user
  auth_id: "webcontainer_demo_user",
  email: "demo@webcontainer.local",
  full_name: "Demo User",
  profile_picture: "https://avatar.vercel.sh/demo",
  bio: "Demo user for webcontainer and hackathon testing. This user allows quick access to the platform without authentication setup.",
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  last_active_at: new Date().toISOString(),
  linkedin_url: "https://linkedin.com/in/demouser",
  fields_of_expertise: ["Demo", "Testing", "MVP"],
  professional_background: "Demo User for Testing",
  can_help_with: "Platform demonstration and testing",
  interests: ["Technology", "Startups", "Demo"],
  personality_traits: ["Friendly", "Helpful", "Demo"],
  skills: ["Testing", "Demo", "MVP"]
});

/**
 * Mock access token for webcontainer environments
 */
export const getMockToken = (): string => {
  return "webcontainer-mock-token";
};

/**
 * Log webcontainer detection info for debugging
 */
export const logWebcontainerInfo = () => {
  if (isWebcontainerEnv()) {
    console.log('🔧 Webcontainer Environment Detected', {
      hostname: window.location.hostname,
      origin: window.location.origin,
      href: window.location.href,
      isDev: import.meta.env?.DEV,
      nodeEnv: typeof process !== 'undefined' ? process.env?.NODE_ENV : 'browser',
    });
  }
};