import React, { useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers';


export const Login: React.FC = () => {
  const { signIn: authSignIn, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Auto-redirect if already authenticated (including webcontainer)
  useEffect(() => {
    if (isAuthenticated) {
      console.log('✅ User already authenticated, redirecting to home');
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    // Use the enhanced signIn from AuthProvider
    authSignIn();
  };

  return (
    <div className="relative w-full h-screen bg-white overflow-hidden flex items-center justify-center">
      {/* Background Image */}
      <img
        src="/login-bg.png"
        alt="Background swirl"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Hackathon Badge - Bottom Left */}
      <a 
        href="https://bolt.new/" 
        target="_blank" 
        rel="noopener noreferrer"
        className="absolute bottom-4 left-4 z-20 hover:scale-105 transition-transform duration-200"
        aria-label="Built with Bolt.new - World's Largest Hackathon"
      >
        <img
          src="/white_circle_360x360.png"
          alt="Built with Bolt.new"
          className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 drop-shadow-lg"
        />
      </a>

      {/* Content */}
      <div className="z-10 flex flex-col items-center justify-center gap-y-6 px-6">
        {/* Center Logo */}
        <img
          src="/meetball-logo.png"
          alt="Meetball Logo"
          className="w-[270px] max-w-full"
        />

        {/* Buttons */}
        <div className="backdrop-blur-lg bg-white/60 border border-white/30 rounded-2xl shadow-lg px-6 py-4 w-full max-w-[300px] text-center">
          <button className="w-full h-[45px] bg-[#0077b5] text-white rounded-full font-medium shadow hover:bg-[#005582] transition mb-3"
            onClick={handleLogin}>
            Login to Meetball
          </button>
          <p className="text-gray-700 text-sm" onClick={() => navigate('/signup')}>Or sign up</p>
        </div>
      </div>
    </div>
  );
};