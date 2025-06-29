/**
 * Google Maps URL utilities for creating search and location links
 * Based on Google Maps URL API: https://developers.google.com/maps/documentation/urls/get-started
 */

/**
 * Generate a Google Maps search URL using the place name/address
 * This opens Google Maps with a search for the specified location
 * 
 * @param locationName - The place name or address to search for
 * @returns Google Maps search URL
 */
export function generateGoogleMapsSearchUrl(locationName: string): string {
  if (!locationName || !locationName.trim()) {
    return '';
  }

  // URL encode the location name for proper formatting
  const encodedLocation = encodeURIComponent(locationName.trim());
  
  // Use Google Maps search API format
  return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
}

/**
 * Generate a Google Maps URL using coordinates
 * This centers the map on the exact coordinates
 * 
 * @param coordinates - [longitude, latitude] coordinate pair
 * @returns Google Maps coordinate URL
 */
export function generateGoogleMapsCoordinateUrl(coordinates: [number, number]): string {
  const [lng, lat] = coordinates;
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/**
 * Open Google Maps in a new tab with the specified location
 * Uses search format for better user experience
 * 
 * @param locationName - The place name or address to search for
 */
export function openLocationInGoogleMaps(locationName: string): void {
  if (!locationName || !locationName.trim()) {
    console.warn('No location provided to open in Google Maps');
    return;
  }

  const url = generateGoogleMapsSearchUrl(locationName);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Create a clickable location element that opens Google Maps when clicked
 * Returns the click handler function
 * 
 * @param locationName - The place name or address
 * @returns Click handler function
 */
export function createLocationClickHandler(locationName: string) {
  return (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    openLocationInGoogleMaps(locationName);
  };
}