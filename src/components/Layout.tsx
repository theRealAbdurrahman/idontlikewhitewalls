import React, { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { BottomNavigation } from "./BottomNavigation";
import { FilterBar } from "./FilterBar";
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
  
  // Determine if we should show the header/filter based on current route
  const showHeader = !location.pathname.includes("/create-question") && 
                    !location.pathname.includes("/chat") &&
                    !location.pathname.includes("/offer-help");
                    console.log("Current Path:", location.pathname);
                    
  const showFilterBar = location.pathname === "/home";

  // Determine if we should show bottom navigation
  const showBottomNav = !location.pathname.includes("/create-question") && 
                       !location.pathname.includes("/chat") &&
                       !location.pathname.includes("/offer-help");

  return (
    <div className="bg-[#f0efeb] flex flex-row justify-center w-full min-h-screen">
      <div className="bg-[#f0efeb] overflow-hidden w-full  relative min-h-screen">
        {/* Unified Sticky Header */}
        {showHeader && (
          <div className="fixed top-0 left-0 w-full  z-30 bg-[#f0efeb]">
            <Header />
            {showFilterBar && <FilterBar />}
          </div>
        )}
        
        {/* Main Content */}
        <main className={`relative ${showHeader ? (showFilterBar ? 'pt-[140px]' : 'pt-[90px]') : ''} ${showBottomNav ? 'pb-[122px]' : 'pb-4'}`}>
          {/* Gradient overlay for smooth post transitions */}
          {showFilterBar && (
            <div className="fixed top-[140px] left-0 w-full  h-8 bg-gradient-to-b from-[#f0efeb] to-transparent pointer-events-none z-20" />
          )}
          {children}
        </main>
        
        {/* Bottom Navigation */}
        {showBottomNav && <BottomNavigation />}
      </div>
    </div>
  );
};