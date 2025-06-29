import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPinIcon, LoaderIcon, CheckIcon } from "lucide-react";
import { Input } from "./input";
import { cn } from "../../lib/utils";
import { generateGoogleMapsSearchUrl } from "../../utils/googleMaps";

/**
 * Location suggestion from Nominatim API
 */
interface LocationSuggestion {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance?: number;
  addresstype?: string;
}

/**
 * Selected location data
 */
export interface LocationData {
  /** Display name for the location */
  displayName: string;
  /** Raw input text */
  input: string;
  /** Coordinates [longitude, latitude] */
  coordinates?: [number, number];
  /** Auto-generated Google Maps URL */
  googleMapsUrl?: string;
}

interface LocationInputProps {
  value?: LocationData;
  onChange?: (location: LocationData) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Location input component with autocomplete suggestions using Nominatim API
 * 
 * Uses a "throttled burst" pattern for optimal UX and API compliance:
 * - First request: 500ms after user starts typing
 * - Subsequent requests: Every 1200ms, but only if input has changed
 * - Rate limiting: Built-in 1200ms gaps between requests
 * - Request cancellation: Prevents race conditions and stale results
 * - Immediate UI feedback: Input updates instantly while API calls are throttled
 * 
 * Accepted Value Pattern:
 * - When user selects a suggestion, it's marked as "accepted"
 * - No API requests are made while input matches accepted value
 * - Requests resume only when user types something different
 * - Prevents unwanted requests after clicking suggestions or focusing
 * 
 * Google Maps Integration:
 * - Always generates Google Maps search URLs for any location input
 * - Works for both Nominatim suggestions and manually typed locations
 * - Ensures all locations are clickable even if not in Nominatim database
 */
export const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder = "LX Factory, R. Rodrigues de Faria",
  disabled = false,
  className
}) => {
  const [inputValue, setInputValue] = useState(value?.input || "");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Throttled burst pattern state
  const lastRequestedValueRef = useRef<string>(""); // Track last value we made a request for
  const initialTimerRef = useRef<NodeJS.Timeout>(); // Timer for initial 500ms delay
  const recurringTimerRef = useRef<NodeJS.Timeout>(); // Timer for recurring 1200ms checks
  const abortControllerRef = useRef<AbortController>(); // For cancelling in-flight requests
  const isFirstRequestModeRef = useRef<boolean>(true); // Track if we're in initial vs recurring mode
  const acceptedValueRef = useRef<string>(""); // Track accepted suggestion to prevent unwanted requests

  /**
   * Format a location suggestion for display
   */
  const formatSuggestion = (suggestion: LocationSuggestion): string => {
    return suggestion.display_name;
  };

  /**
   * Format suggestion metadata for display (replaces unhelpful "yes" values)
   */
  const formatSuggestionMeta = (suggestion: LocationSuggestion): string => {
    const type = suggestion.type;
    const category = suggestion.class;
    
    // Handle common unhelpful values
    if (type === "yes" || !type) {
      return category || "Location";
    }
    
    if (category === "yes" || !category) {
      return type || "Location";
    }
    
    // Show both if they're different and meaningful
    if (type !== category) {
      return `${type} · ${category}`;
    }
    
    return type;
  };

  /**
   * Generate Google Maps URL from location name (preferred over coordinates)
   */
  const generateGoogleMapsUrl = (locationName: string): string => {
    return generateGoogleMapsSearchUrl(locationName);
  };

  /**
   * Cancel any in-flight request to prevent race conditions
   */
  const cancelPreviousRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  /**
   * Make API request to Nominatim with proper error handling and cancellation support
   */
  const makeApiRequest = useCallback(async (query: string) => {
    // Cancel any previous request
    cancelPreviousRequest();

    // Don't make requests for empty or very short queries
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Update tracking state
    lastRequestedValueRef.current = query;
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `limit=5&` +
        `addressdetails=1&` +
        `countrycodes=`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Meetball/1.0 (https://meetball.fun) - Event location search',
          },
          signal: abortController.signal, // Enable request cancellation
        }
      );

      // Check if request was cancelled
      if (abortController.signal.aborted) {
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Only update suggestions if this request wasn't cancelled
      if (!abortController.signal.aborted) {
        setSuggestions(data || []);
      }
    } catch (error) {
      // Don't show errors for cancelled requests
      if (!abortController.signal.aborted) {
        console.warn("Failed to fetch location suggestions:", error);
        setSuggestions([]);
      }
    } finally {
      // Only update loading state if this request wasn't cancelled
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [cancelPreviousRequest]);

  /**
   * Clear all timers - used for cleanup and state resets
   */
  const clearAllTimers = useCallback(() => {
    if (initialTimerRef.current) {
      clearTimeout(initialTimerRef.current);
      initialTimerRef.current = undefined;
    }
    if (recurringTimerRef.current) {
      clearTimeout(recurringTimerRef.current);
      recurringTimerRef.current = undefined;
    }
  }, []);

  /**
   * Start the recurring timer that checks every 1200ms if input has changed
   */
  const startRecurringTimer = useCallback(() => {
    const checkAndRequest = () => {
      const currentValue = inputRef.current?.value || "";
      
      // Only make request if input has changed since last request
      if (currentValue !== lastRequestedValueRef.current && currentValue.length >= 3) {
        makeApiRequest(currentValue);
      }
      
      // Schedule next check (only if input is not empty)
      if (currentValue.trim()) {
        recurringTimerRef.current = setTimeout(checkAndRequest, 1200);
      }
    };

    // Start the recurring pattern
    recurringTimerRef.current = setTimeout(checkAndRequest, 1200);
  }, [makeApiRequest]);

  /**
   * Start the initial timer for first request after 500ms
   */
  const startInitialTimer = useCallback(() => {
    initialTimerRef.current = setTimeout(() => {
      const currentValue = inputRef.current?.value || "";
      
      if (currentValue.trim() && currentValue.length >= 3) {
        // Make first request
        makeApiRequest(currentValue);
        
        // Switch to recurring mode
        isFirstRequestModeRef.current = false;
        startRecurringTimer();
      }
    }, 500);
  }, [makeApiRequest, startRecurringTimer]);

  /**
   * Throttled burst pattern effect - handles the smart timing logic
   * Initial request after 500ms, then recurring requests every 1200ms if input changed
   */
  useEffect(() => {
    // If input is empty or too short, reset everything
    if (!inputValue.trim() || inputValue.length < 3) {
      clearAllTimers();
      setSuggestions([]);
      setIsLoading(false);
      isFirstRequestModeRef.current = true;
      lastRequestedValueRef.current = "";
      acceptedValueRef.current = "";
      cancelPreviousRequest();
      return;
    }

    // Check if current input matches an accepted suggestion
    // If so, don't make any requests until user types something different
    if (inputValue === acceptedValueRef.current) {
      // Input matches accepted suggestion, don't make requests
      return;
    }

    // User has typed something different from accepted suggestion
    // Clear accepted value and allow requests
    if (acceptedValueRef.current && inputValue !== acceptedValueRef.current) {
      acceptedValueRef.current = "";
    }

    // Show suggestions dropdown when user starts typing
    if (!showSuggestions) {
      setShowSuggestions(true);
    }

    // If we're in first request mode, start the initial timer
    if (isFirstRequestModeRef.current) {
      clearAllTimers(); // Only clear timers when starting fresh
      startInitialTimer();
    }
    // If we're in recurring mode, let the existing timer handle the input change
    // The recurring timer will detect the change and make a new request

    // Cleanup function - only clear on unmount
    return () => {
      // Don't clear timers on every input change, only on unmount
    };
  }, [inputValue, showSuggestions, startInitialTimer, cancelPreviousRequest]);

  /**
   * Cleanup effect - cancel requests and clear timers on component unmount
   */
  useEffect(() => {
    return () => {
      clearAllTimers();
      cancelPreviousRequest();
    };
  }, []);

  /**
   * Handle input change - provides immediate visual feedback
   * The throttled burst pattern will handle API calls automatically
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSelectedIndex(-1);
    setShowSuggestions(true);

    // Clear accepted value when user manually types something different
    if (newValue !== acceptedValueRef.current) {
      acceptedValueRef.current = "";
    }

    // Always generate Google Maps URL, even for manually typed locations
    // Google Maps has much broader coverage than Nominatim
    const googleMapsUrl = newValue.trim() ? generateGoogleMapsUrl(newValue) : undefined;

    // Update parent immediately with raw input (for immediate UI feedback)
    onChange?.({
      displayName: newValue,
      input: newValue,
      googleMapsUrl,
    });
  };

  /**
   * Handle suggestion selection - marks value as accepted to prevent unwanted requests
   */
  const selectSuggestion = (suggestion: LocationSuggestion) => {
    const displayName = formatSuggestion(suggestion);
    const coordinates: [number, number] = [parseFloat(suggestion.lon), parseFloat(suggestion.lat)];
    const googleMapsUrl = generateGoogleMapsUrl(displayName);

    setInputValue(displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);

    // Mark this value as accepted to prevent unwanted API requests
    acceptedValueRef.current = displayName;
    
    // Reset throttled burst pattern state since user made a selection
    clearAllTimers();
    isFirstRequestModeRef.current = true;
    lastRequestedValueRef.current = "";
    cancelPreviousRequest();

    onChange?.({
      displayName,
      input: displayName,
      coordinates,
      googleMapsUrl,
    });
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  /**
   * Handle clicks outside to close suggestions
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
        
        // Only reset throttled burst pattern if input is not an accepted value
        if (inputValue !== acceptedValueRef.current) {
          clearAllTimers();
          isFirstRequestModeRef.current = true;
          cancelPreviousRequest();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue]);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <MapPinIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue) setShowSuggestions(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10"
          autoComplete="off"
        />
        
        {/* Loading spinner */}
        {isLoading && (
          <LoaderIcon className="absolute right-3 top-3 w-4 h-4 text-gray-400 animate-spin" />
        )}
        
        {/* Success indicator when location is selected */}
        {!isLoading && value?.coordinates && (
          <CheckIcon className="absolute right-3 top-3 w-4 h-4 text-green-500" />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
        >
          {isLoading && suggestions.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
              <LoaderIcon className="w-4 h-4 animate-spin" />
              Searching locations...
            </div>
          )}

          {suggestions.map((suggestion, index) => {
            const displayText = formatSuggestion(suggestion);
            const isSelected = index === selectedIndex;

            return (
              <div
                key={`${suggestion.osm_type}-${suggestion.osm_id}`}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors",
                  isSelected && "bg-blue-50 text-blue-900"
                )}
                onClick={() => selectSuggestion(suggestion)}
              >
                <MapPinIcon className={cn("w-4 h-4 flex-shrink-0", isSelected ? "text-blue-500" : "text-gray-400")} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{displayText}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {formatSuggestionMeta(suggestion)}
                  </p>
                </div>
              </div>
            );
          })}

          {!isLoading && suggestions.length === 0 && inputValue.length >= 3 && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No locations found. Try a different search term.
            </div>
          )}
        </div>
      )}
    </div>
  );
};