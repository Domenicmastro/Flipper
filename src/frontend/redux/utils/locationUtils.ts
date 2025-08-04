import { type Location } from '@/types';

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a location is within a specified radius of another location
 * @param centerLocation - The center location to search from
 * @param targetLocation - The location to check
 * @param radiusKm - The radius in kilometers
 * @returns true if the target location is within the radius
 */
export function isWithinRadius(
  centerLocation: Location,
  targetLocation: Location,
  radiusKm: number
): boolean {
  const distance = calculateDistance(
    centerLocation.lat,
    centerLocation.lng,
    targetLocation.lat,
    targetLocation.lng
  );
  
  return distance <= radiusKm;
}

/**
 * Format distance for display
 * @param distanceKm - Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
}

/**
 * Get a human-readable location string for display
 * @param location - Location object
 * @returns Short location string
 */
export function getLocationDisplayString(location: Location): string {
  if (location.city && location.province) {
    return `${location.city}, ${location.province}`;
  } else if (location.city) {
    return location.city;
  } else if (location.province) {
    return location.province;
  } else {
    return location.label;
  }
}

/**
 * Filter products by location and radius
 * @param products - Array of products with location data
 * @param centerLocation - Center location for filtering
 * @param radiusKm - Radius in kilometers
 * @returns Filtered array of products
 */
export function filterProductsByLocation<T extends { location?: Location | null }>(
  products: T[],
  centerLocation: Location,
  radiusKm: number
): T[] {
  return products.filter(product => {
    if (!product.location) return false;
    return isWithinRadius(centerLocation, product.location, radiusKm);
  });
}

/**
 * Sort products by distance from a center location
 * @param products - Array of products with location data
 * @param centerLocation - Center location for sorting
 * @returns Sorted array of products (closest first)
 */
export function sortProductsByDistance<T extends { location?: Location | null }>(
  products: T[],
  centerLocation: Location
): (T & { distance?: number })[] {
  return products
    .map(product => ({
      ...product,
      distance: product.location 
        ? calculateDistance(
            centerLocation.lat,
            centerLocation.lng,
            product.location.lat,
            product.location.lng
          )
        : Infinity
    }))
    .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
}

/**
 * Get suggestions for location search based on user's current location
 * @param userLocation - User's current location
 * @returns Array of suggested search locations
 */
export function getLocationSuggestions(userLocation: Location): Location[] {
  const suggestions: Location[] = [];
  
  // Add the user's city if available
  if (userLocation.city && userLocation.province) {
    suggestions.push({
      ...userLocation,
      label: `${userLocation.city}, ${userLocation.province}`
    });
  }
  
  // Add the user's province if available
  if (userLocation.province && userLocation.country) {
    suggestions.push({
      ...userLocation,
      label: `${userLocation.province}, ${userLocation.country}`
    });
  }
  
  return suggestions;
}

/**
 * Validate location coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns true if coordinates are valid
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
}

/**
 * Create a location object from coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @param label - Optional label for the location
 * @returns Location object
 */
export function createLocationFromCoords(
  lat: number,
  lng: number,
  label?: string
): Location {
  if (!isValidCoordinates(lat, lng)) {
    throw new Error('Invalid coordinates provided');
  }
  
  return {
    lat,
    lng,
    label: label || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  };
}