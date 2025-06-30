import React, { useState, useRef } from "react";
import { cn } from "../../lib/utils";
import { Input } from "./input";

interface ClickableInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  displayValue?: string; // Optional custom display value
  icon?: React.ReactNode;
  type?: "text" | "url" | "email";
}

export const ClickableInput: React.FC<ClickableInputProps> = ({
  value = "",
  onChange,
  placeholder = "",
  disabled = false,
  className,
  displayValue,
  icon,
  type = "text"
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasContent = Boolean(value || inputValue);
  const displayText = displayValue || value || inputValue;

  const handleEdit = () => {
    if (disabled) return;
    setIsEditMode(true);
    setInputValue(value);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = () => {
    setIsEditMode(false);
    onChange?.(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditMode(false);
      setInputValue(value); // Reset to original value
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

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
        <Input
          ref={inputRef}
          type={type}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("flex-1 border-0 bg-white text-base md:text-lg p-0", className)}
          autoComplete="off"
        />
      ) : (
        <div className="flex-1">
          {hasContent ? (
            <div className="text-base md:text-lg text-gray-900">
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