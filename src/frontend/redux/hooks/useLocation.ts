import { useState, useCallback, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import { type Location } from "@/types"

interface NominatimResult {
  place_id: string;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    province?: string;
    country?: string;
    postcode?: string;
  };
}

interface UseLocationOptions {
  debounceMs?: number;
  maxResults?: number;
  countryCode?: string; // e.g., 'ca' for Canada
}

export const useLocation = (options: UseLocationOptions = {}) => {
  const {
    debounceMs = 300,
    maxResults = 5,
    countryCode = 'ca'
  } = options;

  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  
  const toast = useToast();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatLocation = (result: NominatimResult): Location => {
    const { address } = result;
    const city = address.city || address.town || address.village || '';
    const province = address.state || address.province || '';
    const country = address.country || '';
    
    // Create a clean label
    const parts = [city, province, country].filter(Boolean);
    const label = parts.join(', ');

    return {
      label: label || result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      placeId: result.place_id,
      postalCode: address.postcode,
      city,
      province,
      country
    };
  };

  const searchLocations = useCallback(async (query: string): Promise<Location[]> => {
    if (!query.trim()) {
      setSuggestions([]);
      return [];
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: maxResults.toString(),
        addressdetails: '1',
        countrycodes: countryCode
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'User-Agent': 'Flipper/1.0 (dom@example.com)'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Location search failed');
      }

      const results: NominatimResult[] = await response.json();
      const locations = results.map(formatLocation);
      
      setSuggestions(locations);
      return locations;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, ignore
        return [];
      }
      
      console.error('Location search error:', error);
      toast({
        title: 'Location search failed',
        description: 'Please try again or enter location manually',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setSuggestions([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [maxResults, countryCode, toast]);

  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchLocations(query);
    }, debounceMs);
  }, [searchLocations, debounceMs]);

  const getCurrentLocation = useCallback(async (): Promise<Location | null> => {
    if (!navigator.geolocation) {
      toast({
        title: 'Location not supported',
        description: 'Your browser does not support location services',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    }

    setIsGettingCurrentLocation(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        format: 'json',
        addressdetails: '1'
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params}`,
        {
          headers: {
            'User-Agent': 'Flipper/1.0 (dom@example.com)'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const result: NominatimResult = await response.json();
      const location = formatLocation(result);
      
      setCurrentLocation(location);
      return location;
    } catch (error) {
      console.error('Get current location error:', error);
      
      let errorMessage = 'Could not get your current location';
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
      }

      toast({
        title: 'Location Error',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      
      return null;
    } finally {
      setIsGettingCurrentLocation(false);
    }
  }, [toast]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    suggestions,
    isLoading,
    currentLocation,
    isGettingCurrentLocation,
    searchLocations,
    debouncedSearch,
    getCurrentLocation,
    clearSuggestions
  };
};