import React, { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNavigation } from "./BottomNavigation";
import { Header } from "./Header";

/**
 * Layout props interface
 */
interface LayoutProps {
  children: ReactNode;
}

/**
 * Main layout component that provides consistent structure across all screens
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Determine if we should show the header based on current route
  const showHeader = !location.pathname.includes("/create-question") && 
                    !location.pathname.includes("/chat");

  // Determine if we should show bottom navigation
  const showBottomNav = !location.pathname.includes("/create-question") && 
                       !location.pathname.includes("/chat");

  return (
    <div className="bg-[#f0efeb] flex flex-row justify-center w-full min-h-screen">
      <div className="bg-[#f0efeb] overflow-hidden w-full max-w-[390px] relative min-h-screen">
        {/* Header */}
        {showHeader && <Header />}
        
        {/* Main Content */}
        <main className={`relative ${showHeader ? 'pt-[100px]' : ''} ${showBottomNav ? 'pb-[122px]' : 'pb-4'}`}>
          {children}
        </main>
        
        {/* Bottom Navigation */}
        {showBottomNav && <BottomNavigation />}
      </div>
    </div>
  );
};