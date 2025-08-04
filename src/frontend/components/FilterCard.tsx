import {
	Box,
	Heading,
	Accordion,
	AccordionItem,
	AccordionButton,
	AccordionPanel,
	AccordionIcon,
	Checkbox,
	VStack,
	Input,
	Text,
	useColorModeValue,
	Switch,
	HStack,
	Button,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { Category, Condition } from "@/types";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
	setCategory,
	setPriceRange,
	setLocation,
	setCondition,
	clearFilters,
	selectFilters,
} from "../redux/slices/productSlice";

export default function FilterCard() {
	const bg = useColorModeValue("gray.50", "gray.700");
	const borderColor = useColorModeValue("gray.200", "gray.600");
	const textColor = useColorModeValue("gray.800", "gray.100");

	const dispatch = useAppDispatch();
	const filters = useAppSelector(selectFilters);

	const [useUserLocation, setUseUserLocation] = useState(false);
	const [userCoords, setUserCoords] = useState<{
		lat: number;
		lon: number;
	} | null>(null);
	const [localMinPrice, setLocalMinPrice] = useState(
		filters.minPrice.toString()
	);
	const [localMaxPrice, setLocalMaxPrice] = useState(
		filters.maxPrice === Infinity ? "" : filters.maxPrice.toString()
	);

	useEffect(() => {
		if (useUserLocation && navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					setUserCoords({
						lat: pos.coords.latitude,
						lon: pos.coords.longitude,
					});
					dispatch(
						setLocation(
							`${pos.coords.latitude.toFixed(2)},${pos.coords.longitude.toFixed(2)}`
						)
					);
				},
				(err) => {
					console.error("Location error:", err);
					setUseUserLocation(false);
				}
			);
		} else if (!useUserLocation) {
			setUserCoords(null);
			if (filters.location.includes(",")) {
				// Clear location if it was set by geolocation
				dispatch(setLocation(""));
			}
		}
	}, [useUserLocation, dispatch, filters.location]);

	const handleLocationChange = (value: string) => {
		dispatch(setLocation(value));
	};

	const handleCategoryChange = (categoryValue: string, isChecked: boolean) => {
		if (isChecked) {
			dispatch(setCategory([...filters.category, categoryValue]));
		} else {
			dispatch(
				setCategory(filters.category.filter((cat) => cat !== categoryValue))
			);
		}
	};

	const handleConditionChange = (
		conditionValue: string,
		isChecked: boolean
	) => {
		if (isChecked) {
			dispatch(setCondition([...filters.condition, conditionValue]));
		} else {
			dispatch(
				setCondition(filters.condition.filter((c) => c !== conditionValue))
			);
		}
	};

	const handlePriceChange = () => {
		const min = localMinPrice === "" ? 0 : parseFloat(localMinPrice) || 0;
		const max =
			localMaxPrice === "" ? Infinity : parseFloat(localMaxPrice) || Infinity;
		dispatch(setPriceRange({ min, max }));
	};

	const handleClearFilters = () => {
		dispatch(clearFilters());
		setLocalMinPrice("0");
		setLocalMaxPrice("");
		setUseUserLocation(false);
		setUserCoords(null);
	};

	return (
		<Box
			flex={1}
			overflowY="auto"
			p={4}
			borderWidth={1}
			borderRadius="md"
			bg={bg}
			borderColor={borderColor}
			color={textColor}
			minWidth="250px"
			maxWidth="300px"
		>
			<HStack justify="space-between" mb={4}>
				<Heading as="h4" size="md">
					Filters
				</Heading>
				<Button size="sm" variant="outline" onClick={handleClearFilters}>
					Clear All
				</Button>
			</HStack>

			<Accordion allowMultiple defaultIndex={[0, 1, 2, 3]}>
				{/* Location Section */}
				<AccordionItem>
					<AccordionButton>
						<Box flex="1" textAlign="left">
							Location
						</Box>
						<AccordionIcon />
					</AccordionButton>
					<AccordionPanel pb={4}>
						<VStack align="start" spacing={3}>
							<HStack>
								<Switch
									isChecked={useUserLocation}
									onChange={(e) => setUseUserLocation(e.target.checked)}
								/>
								<Text>Use my location</Text>
							</HStack>

							{useUserLocation && userCoords && (
								<Text fontSize="sm" color="gray.500">
									Lat: {userCoords.lat.toFixed(2)}, Lon:{" "}
									{userCoords.lon.toFixed(2)}
								</Text>
							)}

							<Input
								placeholder="Search for a location..."
								value={filters.location}
								onChange={(e) => handleLocationChange(e.target.value)}
								isDisabled={useUserLocation}
							/>
						</VStack>
					</AccordionPanel>
				</AccordionItem>

				{/* Category Section */}
				<AccordionItem>
					<AccordionButton>
						<Box flex="1" textAlign="left">
							Category
						</Box>
						<AccordionIcon />
					</AccordionButton>
					<AccordionPanel pb={4}>
						<VStack align="start" spacing={3}>
							{Object.values(Category).map((cat) => (
								<Checkbox
									key={cat}
									isChecked={filters.category.includes(cat)}
									onChange={(e) => handleCategoryChange(cat, e.target.checked)}
								>
									{cat}
								</Checkbox>
							))}
						</VStack>
					</AccordionPanel>
				</AccordionItem>

				{/* Price Section */}
				<AccordionItem>
					<AccordionButton>
						<Box flex="1" textAlign="left">
							Price
						</Box>
						<AccordionIcon />
					</AccordionButton>
					<AccordionPanel pb={4}>
						<VStack spacing={3} align="start">
							<Text>Min Price</Text>
							<Input
								type="number"
								placeholder="0"
								value={localMinPrice}
								onChange={(e) => setLocalMinPrice(e.target.value)}
								onBlur={handlePriceChange}
								min={0}
								step={10}
							/>
							<Text>Max Price</Text>
							<Input
								type="number"
								placeholder="No limit"
								value={localMaxPrice}
								onChange={(e) => setLocalMaxPrice(e.target.value)}
								onBlur={handlePriceChange}
								min={0}
								step={10}
							/>
						</VStack>
					</AccordionPanel>
				</AccordionItem>

				{/* Condition Section */}
				<AccordionItem>
					<AccordionButton>
						<Box flex="1" textAlign="left">
							Condition
						</Box>
						<AccordionIcon />
					</AccordionButton>
					<AccordionPanel pb={4}>
						<VStack align="start" spacing={3}>
							{Object.values(Condition).map((cond) => (
								<Checkbox
									key={cond}
									isChecked={filters.condition.includes(cond)}
									onChange={(e) =>
										handleConditionChange(cond, e.target.checked)
									}
								>
									{cond}
								</Checkbox>
							))}
						</VStack>
					</AccordionPanel>
				</AccordionItem>
			</Accordion>
		</Box>
	);
}
