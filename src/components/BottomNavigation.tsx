import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BellIcon, MessageCircleIcon, HomeIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAppStore } from "../stores/appStore";

/**
 * Bottom navigation component with tab navigation
 * Layout: Notifications (left) - Question Feed (center, prominent) - Chat (right)
 */
export const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activePath, setActivePath] = useState(location.pathname);
  const { unreadNotifications, unreadMessages } = useAppStore();

  // Navigation items configuration - ordered left to right
  const navItems = [
    {
      id: "notifications",
      icon: BellIcon,
      path: "/notifications",
      badge: unreadNotifications,
      isCenter: false,
    },
    {
      id: "home",
      icon: HomeIcon,
      path: "/home",
      badge: 0,
      isCenter: true, // Main focal point
    },
    {
      id: "messages",
      icon: MessageCircleIcon,
      path: "/messages",
      badge: unreadMessages,
      isCenter: false,
    },
  ];

  const handleNavigation = (path: string) => {
    setActivePath(path);
    navigate(path);
  };

  return (
    <nav className="flex flex-col w-full  h-28 items-center justify-center gap-2.5 px-2.5 py-[25px] fixed bottom-0 left-0 z-10">
      <div className="flex h-[60px] items-center justify-around relative self-stretch w-full bg-[#ffffff80] rounded-[100px] overflow-hidden shadow-[0px_0px_4px_#0000001a] backdrop-blur-[6px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(6px)_brightness(100%)] px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.path !== "/home" && location.pathname.startsWith(item.path));
          
          return (
            <div
              key={item.id}
              className={`flex items-center justify-evenly relative` }
            >
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleNavigation(item.path)}
                  className={`hover:bg-transparent rounded-full p-0 transition-all duration-200 w-14 h-14 ${
                    isActive 
                      ? item.isCenter
                      ? "bg-[#F9DF8E] text-black shadow-lg scale-105 hover:bg-[#F9DF8E]" // Enhanced active state for center
                      : "bg-[#F9DF8E] text-black hover:bg-[#F9DF8E]"
                    : "text-gray-600 hover:text-black"
                  }`}
                >
                  <Icon className={`${item.isCenter ? 'w-6 h-6' : 'w-5 h-5'}`} />
                </Button>

              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
};