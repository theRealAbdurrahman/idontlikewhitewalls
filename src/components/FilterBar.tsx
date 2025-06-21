import React from "react";
import { ArrowUpDownIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useAppStore } from "../stores/appStore";

/**
 * Filter bar component for the home feed
 */
export const FilterBar: React.FC = () => {
  const { events, activeFilters, sortBy, setActiveFilters, setSortBy } = useAppStore();

  // Get active events for filter options
  const activeEvents = events.filter(event => event.isJoined || event.isCheckedIn);
  
  // Create filter categories
  const filterCategories = [
    {
      id: "all",
      label: "All",
      isActive: activeFilters.includes("all"),
    },
    ...activeEvents.slice(0, 4).map(event => ({
      id: event.id,
      label: event.name.length > 15 ? `${event.name.slice(0, 15)}...` : event.name,
      isActive: activeFilters.includes(event.id),
    })),
  ];

  const handleFilterClick = (filterId: string) => {
    if (filterId === "all") {
      setActiveFilters(["all"]);
    } else {
      // Toggle individual filter
      const newFilters = activeFilters.includes(filterId)
        ? activeFilters.filter(id => id !== filterId)
        : [...activeFilters.filter(id => id !== "all"), filterId];
      
      // If no filters selected, default to "all"
      setActiveFilters(newFilters.length === 0 ? ["all"] : newFilters);
    }
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as typeof sortBy);
  };

  return (
    <nav className="flex w-full items-center justify-between pt-2.5 pb-2.5 px-3.5 bg-[#f0efeb]">
      {/* Filter Categories */}
      <div className="flex items-start gap-2 overflow-x-auto no-scrollbar flex-1">
        {filterCategories.map((category) => (
          <Badge
            key={category.id}
            variant="outline"
            onClick={() => handleFilterClick(category.id)}
            className={`h-8 px-4 py-2 rounded-[32px] font-normal text-xs whitespace-nowrap cursor-pointer transition-colors ${
              category.isActive
                ? "bg-[#ffefc1] border-[#e6ca72] text-neutral-800"
                : "bg-white text-neutral-800 hover:bg-gray-50"
            }`}
          >
            {category.label}
          </Badge>
        ))}
        
        {/* Show overflow indicator if there are more events */}
        {activeEvents.length > 4 && (
          <Badge
            variant="outline"
            className="h-8 px-4 py-2 rounded-[32px] font-normal text-xs whitespace-nowrap bg-gray-100 text-gray-600"
          >
            +{activeEvents.length - 4} more
          </Badge>
        )}
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center justify-center gap-2 ml-2">
        <Separator orientation="vertical" className="h-[25px]" />
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-auto border-none bg-transparent shadow-none p-1 h-auto">
            <ArrowUpDownIcon className="w-5 h-5" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest</SelectItem>
            <SelectItem value="most_uplifted">Most Uplifted</SelectItem>
            <SelectItem value="most_helpers">Most Helpers</SelectItem>
            <SelectItem value="most_relatable">Most Relatable</SelectItem>
            <SelectItem value="bookmarked">Bookmarked</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </nav>
  );
};