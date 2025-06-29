import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// Remove Lucide icon imports
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useAppStore } from "../stores/appStore";

// Custom SVG icon components
const NotificationsIcon = ({ className }) => (
  <svg
    width="19"
    height="20"
    viewBox="0 0 19 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M17.7701 13.21L15.9701 11.4V6.94002C15.994 5.28384 15.4179 3.67493 14.3482 2.41035C13.2785 1.14578 11.7873 0.310951 10.1501 0.0600163C9.19989 -0.0651165 8.23394 0.0138312 7.31668 0.291592C6.39942 0.569352 5.55194 1.03954 4.8308 1.67078C4.10965 2.30202 3.53142 3.07979 3.13468 3.95221C2.73794 4.82463 2.53182 5.77163 2.53007 6.73002V11.4L0.730073 13.21C0.503979 13.4399 0.350657 13.7313 0.289273 14.0478C0.22789 14.3643 0.261169 14.6919 0.384951 14.9897C0.508732 15.2874 0.717524 15.542 0.985224 15.7217C1.25292 15.9014 1.56766 15.9982 1.89007 16H5.25007V16.34C5.29678 17.3552 5.74403 18.3105 6.4938 18.9965C7.24357 19.6826 8.23473 20.0434 9.25007 20C10.2654 20.0434 11.2566 19.6826 12.0063 18.9965C12.7561 18.3105 13.2034 17.3552 13.2501 16.34V16H16.6101C16.9325 15.9982 17.2472 15.9014 17.5149 15.7217C17.7826 15.542 17.9914 15.2874 18.1152 14.9897C18.239 14.6919 18.2723 14.3643 18.2109 14.0478C18.1495 13.7313 17.9962 13.4399 17.7701 13.21ZM11.2501 16.34C11.1946 16.821 10.9557 17.2621 10.5831 17.5713C10.2106 17.8805 9.73306 18.0341 9.25007 18C8.76709 18.0341 8.28957 17.8805 7.917 17.5713C7.54443 17.2621 7.30553 16.821 7.25007 16.34V16H11.2501V16.34Z"
      fill="currentColor" />
  </svg>
);

const QuestionsFeedIcon = ({ className }) => (
  <svg
    width="21"
    height="20"
    viewBox="0 0 21 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M6.25 6H14.25M6.25 10H12.25M12.25 15H11.25L6.25 18V15H4.25C3.45435 15 2.69129 14.6839 2.12868 14.1213C1.56607 13.5587 1.25 12.7956 1.25 12V4C1.25 3.20435 1.56607 2.44129 2.12868 1.87868C2.69129 1.31607 3.45435 1 4.25 1H16.25C17.0456 1 17.8087 1.31607 18.3713 1.87868C18.9339 2.44129 19.25 3.20435 19.25 4V8.5M17.25 19V19.01M17.25 15.9998C17.6983 15.9983 18.1332 15.8466 18.485 15.5687C18.8368 15.2909 19.0852 14.903 19.1906 14.4673C19.2959 14.0315 19.2519 13.5731 19.0658 13.1652C18.8797 12.7574 18.5622 12.4238 18.164 12.2178C17.7662 12.014 17.3111 11.9508 16.8728 12.0385C16.4345 12.1262 16.0388 12.3596 15.75 12.7008"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round" />
  </svg>
);

const MessagesIcon = ({ className }) => (
  <svg
    width="21"
    height="20"
    viewBox="0 0 21 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M0.75 20V2C0.75 1.45 0.945833 0.979167 1.3375 0.5875C1.72917 0.195833 2.2 0 2.75 0H18.75C19.3 0 19.7708 0.195833 20.1625 0.5875C20.5542 0.979167 20.75 1.45 20.75 2V14C20.75 14.55 20.5542 15.0208 20.1625 15.4125C19.7708 15.8042 19.3 16 18.75 16H4.75L0.75 20ZM3.9 14H18.75V2H2.75V15.125L3.9 14Z"
      fill="currentColor" />
  </svg>
);

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
      icon: NotificationsIcon,
      path: "/notifications",
      badge: unreadNotifications,
      isCenter: false,
    },
    {
      id: "home",
      icon: QuestionsFeedIcon,
      path: "/home",
      badge: 0,
      isCenter: true, // Main focal point
    },
    {
      id: "messages",
      icon: MessagesIcon,
      path: "/messages",
      badge: unreadMessages,
      isCenter: false,
    },
  ];

  // ...existing code...
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
              className={`flex items-center justify-evenly relative`}
            >
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleNavigation(item.path)}
                  className={`hover:bg-transparent rounded-full p-0 transition-all duration-200 w-14 h-14 ${isActive
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