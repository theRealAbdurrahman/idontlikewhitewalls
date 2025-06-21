import { BellIcon, PlusIcon, SearchIcon } from "lucide-react";
import React from "react";
import { Avatar } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { ContentCreatorSection } from "./sections/ContentCreatorSection";
import { MarketplaceSection } from "./sections/MarketplaceSection";

export const QuestionFeed = (): JSX.Element => {
  return (
    <div className="bg-[#f0efeb] flex flex-row justify-center w-full">
      <div className="bg-[#f0efeb] overflow-hidden w-full  relative min-h-screen">
        {/* Header */}
        <header className="flex w-full h-[90px] items-center justify-between pt-10 pb-0 px-3.5 fixed top-0 left-0 z-10 bg-[#f0efeb]">
          <Avatar className="w-[35px] h-[35px]">
            <img
              src="/mask-group-3.png"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </Avatar>

          <img
            className="relative w-[140.93px] h-7"
            alt="Meetball Logo"
            src="/Meetball Logo.svg"
          />

          <Button
            variant="ghost"
            size="icon"
            className="w-[46px] h-[46px] bg-[#e9e6d9] rounded-full p-0"
          >
            <SearchIcon className="w-5 h-5" />
          </Button>
        </header>

        {/* Main Content */}
        <main className="pt-[100px] pb-[122px] relative">
          {/* Marketplace Section */}
          <MarketplaceSection />

          {/* Content Creator Section */}
          <ContentCreatorSection />
          <div className="w-full h-[53px] top-[100px] bg-[linear-gradient(0deg,rgba(240,239,235,0)_0%,rgba(240,239,235,1)_100%)] absolute left-0" />
        </main>

        {/* Floating Action Button */}
        <Button className="w-[50px] h-[50px] fixed bottom-[103px] right-[30px] bg-[#3ec6c6] rounded-full shadow-[0px_4px_8px_#00000040] p-0 flex items-center justify-center">
          <PlusIcon className="w-[22px] h-[22px] text-white" />
        </Button>

        {/* Bottom Gradient */}
        <div className="fixed w-full  h-[97px] bottom-0 left-0 bg-[linear-gradient(180deg,rgba(240,239,235,0)_0%,rgba(240,239,235,1)_100%)]" />

        {/* Navigation Bar */}
        <nav className="flex flex-col w-full  h-28 items-center justify-center gap-2.5 px-2.5 py-[25px] fixed bottom-0 left-0 z-10">
          <div className="flex h-[60px] items-center justify-center relative self-stretch w-full bg-[#ffffff80] rounded-[100px] overflow-hidden shadow-[0px_0px_4px_#0000001a] backdrop-blur-[6px] backdrop-brightness-[100%] [-webkit-backdrop-filter:blur(6px)_brightness(100%)]">
            <div className="flex flex-col items-center justify-center gap-[5px] px-0 py-2.5 relative flex-1 self-stretch grow">
              <Button
                variant="ghost"
                size="icon"
                className="w-11 h-11 bg-[#ffca2880] rounded-full p-0 mt-[-2.00px] mb-[-2.00px]"
              >
                <BellIcon className="w-6 h-6" />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center gap-[5px] px-0 py-2.5 relative flex-1 self-stretch grow">
              <Button
                variant="ghost"
                size="icon"
                className="w-11 h-11 rounded-full p-0 mt-[-2.00px] mb-[-2.00px]"
              >
                <img
                  className="w-6 h-6"
                  alt="Message question"
                  src="/message-question.svg"
                />
              </Button>
            </div>

            <div className="flex flex-col items-center justify-center gap-[5px] px-0 py-2.5 relative flex-1 self-stretch grow">
              <Button
                variant="ghost"
                size="icon"
                className="w-11 h-11 rounded-full p-0 mt-[-2.00px] mb-[-2.00px]"
              >
                <img
                  className="w-6 h-6"
                  alt="Chat bubble"
                  src="/chat-bubble.svg"
                />
              </Button>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
};
