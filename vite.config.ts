import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    // Use absolute path for proper routing
    base: "/",
    css: {
      postcss: {
        plugins: [tailwind()],
      },
    },
    resolve: {
      alias: {
        "@": "/src/components/ui",
      },
    },
    // Define environment variables explicitly
    define: {
      // Make env variables available at runtime
      'import.meta.env.VITE_APP_ENV': JSON.stringify(env.VITE_APP_ENV),
      'import.meta.env.VITE_AUTH_BASE_URL': JSON.stringify(env.VITE_AUTH_BASE_URL),
      'import.meta.env.VITE_AUTH_CALLBACK_URL': JSON.stringify(env.VITE_AUTH_CALLBACK_URL),
      'import.meta.env.VITE_AUTH_LOGOUT_URL': JSON.stringify(env.VITE_AUTH_LOGOUT_URL),
    }
  };
});