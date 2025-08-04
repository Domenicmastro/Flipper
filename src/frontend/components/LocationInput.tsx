import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Input,
  List,
  ListItem,
  Text,
  HStack,
  VStack,
  Spinner,
  useColorModeValue,
  IconButton,
  FormControl,
  FormLabel,
  FormErrorMessage,
  useOutsideClick,
} from '@chakra-ui/react';
import { MdLocationOn, MdGpsFixed, MdClear } from 'react-icons/md';
import { useLocation } from '../redux/hooks/useLocation';
import { type Location } from "@/types"

interface LocationInputProps {
  label?: string;
  placeholder?: string;
  value?: Location | null;
  onChange: (location: Location | null) => void;
  onInputChange?: (input: string) => void;
  isRequired?: boolean;
  isInvalid?: boolean;
  errorMessage?: string;
  isDisabled?: boolean;
  countryCode?: string;
  maxResults?: number;
  size?: 'sm' | 'md' | 'lg';
  showCurrentLocationButton?: boolean;
  showClearButton?: boolean;
}

const LocationInput: React.FC<LocationInputProps> = ({
  label,
  placeholder = 'Search for a location...',
  value,
  onChange,
  onInputChange,
  isRequired = false,
  isInvalid = false,
  errorMessage,
  isDisabled = false,
  countryCode = 'ca',
  maxResults = 5,
  size = 'md',
  showCurrentLocationButton = true,
  showClearButton = true,
}) => {
  const [inputValue, setInputValue] = useState(value?.label || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  const {
    suggestions,
    isLoading,
    isGettingCurrentLocation,
    debouncedSearch,
    getCurrentLocation,
    clearSuggestions
  } = useLocation({
    maxResults,
    countryCode
  });

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const highlightBg = useColorModeValue('blue.50', 'blue.800');

  // Close suggestions when clicking outside
  useOutsideClick({
    ref: listRef,
    handler: () => {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  });

  useEffect(() => {
    if (value?.label !== inputValue) {
      setInputValue(value?.label || '');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onInputChange?.(newValue);
    
    if (newValue.trim()) {
      debouncedSearch(newValue);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      onChange(null);
    }
    
    setHighlightedIndex(-1);
  };

  const handleSuggestionClick = (location: Location) => {
    setInputValue(location.label);
    onChange(location);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    clearSuggestions();
  };

  const handleCurrentLocation = async () => {
    const location = await getCurrentLocation();
    if (location) {
      setInputValue(location.label);
      onChange(location);
      setShowSuggestions(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange(null);
    setShowSuggestions(false);
    clearSuggestions();
    onInputChange?.('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    if (inputValue.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <FormControl isRequired={isRequired} isInvalid={isInvalid} isDisabled={isDisabled}>
      {label && <FormLabel>{label}</FormLabel>}
      
      <Box position="relative" ref={listRef}>
        <HStack>
          <Box flex={1} position="relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              placeholder={placeholder}
              size={size}
              pr={showClearButton && inputValue ? "2.5rem" : "1rem"}
            />
            
            {showClearButton && inputValue && (
              <IconButton
                aria-label="Clear location"
                icon={<MdClear />}
                size="sm"
                variant="ghost"
                position="absolute"
                right="0.5rem"
                top="50%"
                transform="translateY(-50%)"
                onClick={handleClear}
                zIndex={2}
              />
            )}
          </Box>
          
          {showCurrentLocationButton && (
            <IconButton
              aria-label="Use current location"
              icon={isGettingCurrentLocation ? <Spinner size="sm" /> : <MdGpsFixed />}
              onClick={handleCurrentLocation}
              isLoading={isGettingCurrentLocation}
              size={size}
              variant="outline"
              colorScheme="blue"
            />
          )}
        </HStack>

        {showSuggestions && (
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            zIndex={1000}
            bg={bg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            boxShadow="lg"
            maxH="200px"
            overflowY="auto"
            mt={1}
          >
            {isLoading && (
              <Box p={3} textAlign="center">
                <Spinner size="sm" mr={2} />
                <Text display="inline">Searching...</Text>
              </Box>
            )}
            
            {!isLoading && suggestions.length === 0 && inputValue.trim() && (
              <Box p={3} textAlign="center">
                <Text color="gray.500">No locations found</Text>
              </Box>
            )}
            
            {!isLoading && suggestions.length > 0 && (
              <List spacing={0}>
                {suggestions.map((suggestion, index) => (
                  <ListItem
                    key={suggestion.placeId || index}
                    p={3}
                    cursor="pointer"
                    bg={index === highlightedIndex ? highlightBg : 'transparent'}
                    _hover={{ bg: hoverBg }}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <HStack>
                      <MdLocationOn color="gray.500" />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontWeight="medium" noOfLines={1}>
                          {suggestion.label}
                        </Text>
                        {suggestion.city && suggestion.province && (
                          <Text fontSize="sm" color="gray.500" noOfLines={1}>
                            {suggestion.city}, {suggestion.province}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </Box>
      
      {isInvalid && errorMessage && (
        <FormErrorMessage>{errorMessage}</FormErrorMessage>
      )}
    </FormControl>
  );
};

export default LocationInput;