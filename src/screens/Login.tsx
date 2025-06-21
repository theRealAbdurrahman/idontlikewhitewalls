import React, { useState } from "react";
import { LinkedinIcon, MailIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../stores/authStore";

/**
 * Login screen component with LinkedIn and email authentication
 */
export const Login: React.FC = () => {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const { login, loginWithLinkedIn, loading, error } = useAuthStore();

  const handleLinkedInLogin = async () => {
    await loginWithLinkedIn();
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      await login(email, password);
    }
  };

  return (
    <div className="bg-[#f0efeb] flex flex-row justify-center w-full min-h-screen">
      <div className="bg-[#f0efeb] overflow-hidden w-full max-w-[390px] relative min-h-screen flex flex-col items-center justify-center px-8">
        {/* Logo */}
        <div className="mb-12">
          <img
            className="w-[400px] h-24"
            alt="Meetball Logo"
            src="/Meetball Logo.svg"
          />
        </div>

        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black mb-2">
            Welcome to Meetball
          </h1>
          <p className="text-gray-600 text-base">
            Connect, ask questions, and get help from your professional network
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="w-full bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {!showEmailLogin ? (
          <>
            {/* LinkedIn Login */}
            <Button
              onClick={handleLinkedInLogin}
              disabled={loading}
              className="w-full h-12 bg-[#0A66C2] hover:bg-[#084d94] text-white rounded-lg mb-4 flex items-center justify-center gap-3"
            >
              <LinkedinIcon className="w-5 h-5" />
              {loading ? "Connecting..." : "Continue with LinkedIn"}
            </Button>

            {/* Divider */}
            <div className="flex items-center w-full my-6">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="px-4 text-gray-500 text-sm">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* Email Login Option */}
            <Button
              onClick={() => setShowEmailLogin(true)}
              variant="outline"
              className="w-full h-12 border-2 border-gray-300 text-black rounded-lg flex items-center justify-center gap-3"
            >
              <MailIcon className="w-5 h-5" />
              Continue with Email
            </Button>
          </>
        ) : (
          <>
            {/* Email Login Form */}
            <form onSubmit={handleEmailLogin} className="w-full space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ec6c6] focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3ec6c6] focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-12 bg-[#3ec6c6] hover:bg-[#2ea5a5] text-white rounded-lg"
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {/* Back to LinkedIn */}
            <Button
              onClick={() => setShowEmailLogin(false)}
              variant="ghost"
              className="w-full h-12 text-gray-600 rounded-lg mt-4"
            >
              Back to LinkedIn Login
            </Button>
          </>
        )}

        {/* Terms and Privacy */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our{" "}
            <a href="#" className="text-[#3ec6c6] underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-[#3ec6c6] underline">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Demo Notice */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 text-center">
            <strong>Demo Mode:</strong> Use any email and password to log in, or click "Continue with LinkedIn" to see the LinkedIn flow simulation.
          </p>
        </div>
      </div>
    </div>
  );
};