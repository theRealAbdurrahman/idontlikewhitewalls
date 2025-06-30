import React, { useState } from "react";
import { cn } from "../../lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface ClickableSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  children: React.ReactNode; // SelectItems
  displayValue?: string; // Custom display text
}

export const ClickableSelect: React.FC<ClickableSelectProps> = ({
  value = "",
  onValueChange,
  placeholder = "",
  disabled = false,
  className,
  icon,
  children,
  displayValue
}) => {
  const [isEditMode, setIsEditMode] = useState(false);

  const hasContent = Boolean(value);
  const displayText = displayValue || value;

  const handleEdit = () => {
    if (disabled) return;
    setIsEditMode(true);
  };

  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue);
    setIsEditMode(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsEditMode(false);
    }
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-all duration-200 rounded-md",
        !isEditMode && "cursor-pointer hover:bg-gray-50"
      )}
      onClick={!isEditMode ? handleEdit : undefined}
    >
      {icon && <div className="w-5 h-5 text-gray-400 flex-shrink-0">{icon}</div>}
      {isEditMode ? (
        <Select 
          value={value} 
          onValueChange={handleValueChange}
          onOpenChange={handleOpenChange}
          disabled={disabled}
          open={true}
        >
          <SelectTrigger className={cn("flex-1 border-0 bg-gradient-to-br from-gray-100 to-gray-50 text-base md:text-lg h-auto shadow-sm p-0", className)}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {children}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex-1">
          {hasContent ? (
            <div className="text-base md:text-lg text-gray-900 capitalize">
              {displayText}
            </div>
          ) : (
            <div className="text-base md:text-lg text-gray-400">
              {placeholder}
            </div>
          )}
        </div>
      )}
    </div>
  );
};