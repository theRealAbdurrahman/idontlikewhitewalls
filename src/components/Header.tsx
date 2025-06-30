import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SearchIcon, ArrowLeftIcon, Building2Icon } from "lucide-react";
import { Avatar } from "./ui/avatar";
import { Button } from "./ui/button";
import { useAuth } from "../providers";

/**
 * Header component that adapts based on current route
 */
export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Determine header configuration based on route
  const getHeaderConfig = () => {
    const path = location.pathname;
    
    if (path.includes("/user/")) {
      return {
        showBackButton: false, // ProfilePage handles its own header
        title: null,
        showSearch: false,
        showAvatar: false,
      };
    }
    
    if (path.includes("/profile/") && path !== "/profile") {
      return {
        showBackButton: true,
        title: "Profile",
        showSearch: false,
        showAvatar: false,
      };
    }
    
    if (path.includes("/events")) {
      return {
        showBackButton: true,
        title: "Events",
        showSearch: false,
        showAvatar: false,
      };
    }
    
    if (path.includes("/messages/") && path !== "/messages") {
      return {
        showBackButton: true,
        title: "Chat",
        showSearch: false,
        showAvatar: false,
      };
    }
    
    // Default header for main screens
    return {
      showBackButton: false,
      title: null,
      showSearch: true,
      showAvatar: true,
    };
  };

  const config = getHeaderConfig();

  const handleAvatarClick = () => {
    navigate(`/profile/${user?.id}`);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <header className="flex w-full h-[90px] items-center justify-between pt-10 pb-0 px-3.5 bg-[#f0efeb]">
      {/* Left side */}
      {config.showBackButton ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackClick}
          className="w-[35px] h-[35px] rounded-full p-0"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
      ) : config.showAvatar ? (
        <Avatar 
          className="w-[35px] h-[35px] cursor-pointer" 
          onClick={handleAvatarClick}
        >
          <img
              src={user?.profile_picture || "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1"}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </Avatar>
      ) : (
        <div className="w-[35px]" />
      )}

      {/* Center */}
      {config.title ? (
        <h1 className="text-lg font-semibold text-black">
          {config.title}
        </h1>
      ) : (
        <img
          className="relative w-[320px] h-16"
          alt="Meetball Logo"
          src="/Meetball Logo.svg"
        />
      )}

      {/* Right side */}
      {config.showSearch ? (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-[40px] h-[40px] bg-[#e9e6d9] rounded-full p-0"
            onClick={() => navigate("/events")}
            title="Create Event"
          >
            <Building2Icon className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="w-[46px] h-[46px] bg-[#e9e6d9] rounded-full p-0"
            onClick={() => {
              // TODO: Implement search functionality
              console.log("Search clicked");
            }}
            title="Search"
          >
            <SearchIcon className="w-5 h-5" />
          </Button>
        </div>
      ) : (
        <div className="w-[46px]" />
      )}
    </header>
  );
};