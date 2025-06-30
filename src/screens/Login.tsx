import React from "react";
import { useLogto } from "@logto/react";
import { useNavigate } from 'react-router-dom';
import { getAuthCallbackUrl } from '../utils/auth';


export const Login: React.FC = () => {
  const { signIn } = useLogto();
  const navigate = useNavigate()
  const handleBoltEnv = () => {
    // if this is bolt environment, redirect to home
    // and set user data in auth store with the demo account values
    // mark user as authenticated and make the app work as if the user is logged in
    if (window.location.host.includes('webcontainer') || window.location.host.includes('bolt')) {
      const demoUser = {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@user.com'
      };
    }
  }

  return (
    <div className="relative w-full h-screen bg-white overflow-hidden flex items-center justify-center">
      {/* Background Image */}
      <img
        src="/login-bg.png"
        alt="Background swirl"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

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
            onClick={() => signIn(getAuthCallbackUrl())}>
            Login to Meetball
          </button>
          <p className="text-gray-700 text-sm" onClick={() => navigate('/signup')}>Or sign up</p>
        </div>
      </div>
    </div>
  );
};