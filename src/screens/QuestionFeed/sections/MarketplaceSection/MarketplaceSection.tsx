import { ArrowUpDownIcon } from "lucide-react";
import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { Separator } from "../../../../components/ui/separator";

export const MarketplaceSection = (): JSX.Element => {
  // Define filter categories data for mapping
  const filterCategories = [
    {
      id: "meetverse",
      label: "Meetverse",
      isActive: true,
      className: "bg-[#ffefc1] border-[#e6ca72] text-neutral-800",
    },
    {
      id: "summeet",
      label: "The summeet 2025",
      isActive: false,
      className: "bg-white text-neutral-800",
    },
    {
      id: "dublin",
      label: "Dublin Tech Sum...",
      isActive: false,
      className: "bg-[#e9e6d9] text-neutral-800",
    },
  ];

  return (
    <nav className="flex w-full items-center justify-between pt-2.5 pb-0 px-3.5 sticky top-[90px] bg-background z-10">
      <div className="flex items-start gap-2 overflow-x-auto no-scrollbar">
        {filterCategories.map((category) => (
          <Badge
            key={category.id}
            variant="outline"
            className={`h-8 px-4 py-2 rounded-[32px] font-normal text-xs whitespace-nowrap ${category.className}`}
          >
            {category.label}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 ml-2">
        <Separator orientation="vertical" className="h-[25px]" />
        <button className="flex items-center justify-center">
          <ArrowUpDownIcon className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};
