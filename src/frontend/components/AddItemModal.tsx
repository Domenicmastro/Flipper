import React, { useState } from "react";
import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalFooter,
	ModalBody,
	ModalCloseButton,
	Button,
	FormControl,
	FormLabel,
	Input,
	Textarea,
	Select,
	RadioGroup,
	Radio,
	VStack,
	HStack,
	Box,
	Text,
	Flex,
	Badge,
	IconButton,
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	NumberIncrementStepper,
	NumberDecrementStepper,
	Switch,
	Divider,
	Grid,
	GridItem,
	useColorModeValue,
	Image,
	AspectRatio,
	Center,
	Wrap,
	WrapItem,
	Tag,
	TagLabel,
	TagCloseButton,
	useToast,
} from "@chakra-ui/react";
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	AddIcon,
	CloseIcon,
	CalendarIcon,
} from "@chakra-ui/icons";
import {
	Condition,
	StatusLevel,
	Category,
	Attributes,
	type AttributeCategory,
	type Attribute,
	type AttributeValue,
	type PriceComparison,
} from "@/types/Product";
import ConditionLabel from "../components/ConditionLabel";
import ImageUpload from "../components/ImageUpload";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { addProductThunk, fetchProducts } from "../redux/slices/productSlice";
import { selectCurrentUser } from "@/frontend/redux/slices/userSlice.ts";
import { LoadScript, Autocomplete } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""; // Store this in `.env`
const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = [
	"places",
];

interface AddItemModalPopupProps {
	isOpen: boolean;
	onClose: () => void;
}

const AddItemModalPopup: React.FC<AddItemModalPopupProps> = ({
	isOpen,
	onClose,
}) => {
	// Form state
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		price: 0,
		condition: Condition.New,
		category: "",
		location: {
			label: "",
			lat: 49.2827,
			lng: -123.1207,
			city: "Vancouver",
			province: "British Columbia",
			country: "Canada",
		},
		tags: [] as string[],
		attributes: [] as Attribute[],
		isAuction: false,
		startingBid: 0,
		auctionDuration: 7, // days
		priceComparisons: [] as PriceComparison[],
	});

	const [uploadedImages, setUploadedImages] = useState<string[]>([]);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [newTag, setNewTag] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const dispatch = useAppDispatch();
	const currentUser = useAppSelector(selectCurrentUser);
	const toast = useToast();

	// Colors
	const bgColor = useColorModeValue("white", "gray.800");
	const borderColor = useColorModeValue("gray.200", "gray.600");
	const textColor = useColorModeValue("gray.600", "gray.300");
	const accentColor = useColorModeValue("blue.500", "blue.300");

	// Image carousel handlers
	const nextImage = () => {
		if (uploadedImages.length > 0) {
			setCurrentImageIndex((prev) => (prev + 1) % uploadedImages.length);
		}
	};

	const prevImage = () => {
		if (uploadedImages.length > 0) {
			setCurrentImageIndex(
				(prev) => (prev - 1 + uploadedImages.length) % uploadedImages.length
			);
		}
	};

	// Form handlers
	const handleInputChange = (field: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	const handleLocationChange = (field: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			location: {
				...prev.location,
				[field]: value,
			},
		}));
	};

	const handleImageUpload = (urls: string[]) => {
		setUploadedImages(urls);
		setCurrentImageIndex(0);
	};

	const addTag = () => {
		if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
			setFormData((prev) => ({
				...prev,
				tags: [...prev.tags, newTag.trim()],
			}));
			setNewTag("");
		}
	};

	const removeTag = (tagToRemove: string) => {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.filter((tag) => tag !== tagToRemove),
		}));
	};

	const addAttribute = (category: AttributeCategory, value: AttributeValue) => {
		const newAttribute: Attribute = { category, value };
		setFormData((prev) => ({
			...prev,
			attributes: [
				...prev.attributes.filter((attr) => attr.category !== category),
				newAttribute,
			],
		}));
	};

	const removeAttribute = (category: AttributeCategory) => {
		setFormData((prev) => ({
			...prev,
			attributes: prev.attributes.filter((attr) => attr.category !== category),
		}));
	};

	const handleSubmit = async () => {
		if (!currentUser) {
			toast({
				title: "Authentication required",
				description: "Please log in to add items",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
			return;
		}

		if (!formData.name || !formData.category || uploadedImages.length === 0) {
			toast({
				title: "Missing required fields",
				description:
					"Please fill in all required fields and add at least one image",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
			return;
		}

		setIsSubmitting(true);

		try {
			const auctionEndsAt = formData.isAuction
				? new Date(Date.now() + formData.auctionDuration * 24 * 60 * 60 * 1000)
				: undefined;

			const newProduct = {
				name: formData.name,
				description: formData.description,
				images: uploadedImages,
				condition: formData.condition,
				status: StatusLevel.forSale,
				price: formData.isAuction ? 0 : formData.price,
				location: formData.location,
				sellerId: currentUser.id,
				tags: formData.tags,
				attributes: formData.attributes,
				categoryIds: [formData.category],
				categories: [formData.category as Category],
				priceComparisons: formData.priceComparisons,
				isAuction: formData.isAuction,
				startingBid: formData.isAuction ? formData.startingBid : undefined,
				currentBid: formData.isAuction ? formData.startingBid : undefined,
				bidCount: formData.isAuction ? 0 : undefined,
				auctionEndsAt: auctionEndsAt?.toISOString(),
				bidderId: undefined,
			};

			await dispatch(addProductThunk(newProduct)).unwrap();

			dispatch(fetchProducts());

			toast({
				title: "Item added successfully!",
				description: `Your ${formData.isAuction ? "auction" : "item"} has been listed`,
				status: "success",
				duration: 3000,
				isClosable: true,
			});

			onClose();
			resetForm();
		} catch (error) {
			console.error("Add product failed:", error);
			toast({
				title: "Failed to add item",
				description: "Please try again later",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			price: 0,
			condition: Condition.New,
			category: "",
			location: {
				label: "",
				lat: 49.2827,
				lng: -123.1207,
				city: "Vancouver",
				province: "British Columbia",
				country: "Canada",
			},
			tags: [],
			attributes: [],
			isAuction: false,
			startingBid: 0,
			auctionDuration: 7,
			priceComparisons: [],
		});
		setUploadedImages([]);
		setCurrentImageIndex(0);
		setNewTag("");
	};

	const [autocomplete, setAutocomplete] =
		useState<google.maps.places.Autocomplete | null>(null);

	const onLoadAutocomplete = (auto: google.maps.places.Autocomplete) => {
		setAutocomplete(auto);
	};

	const onPlaceChanged = () => {
		if (autocomplete) {
			const place = autocomplete.getPlace();

			const lat = place.geometry?.location?.lat();
			const lng = place.geometry?.location?.lng();
			const addressComponents = place.address_components;

			if (!lat || !lng || !addressComponents) return;

			const getComponent = (types: string[]) =>
				addressComponents.find((comp) =>
					types.some((type) => comp.types.includes(type))
				)?.long_name || "";

			handleLocationChange("label", place.formatted_address || "");
			handleLocationChange("lat", lat);
			handleLocationChange("lng", lng);
			handleLocationChange("city", getComponent(["locality", "sublocality"]));
			handleLocationChange(
				"province",
				getComponent(["administrative_area_level_1"])
			);
			handleLocationChange("country", getComponent(["country"]));
		}
	};

	const addPriceComparison = () => {
		setFormData((prev) => ({
			...prev,
			priceComparisons: [
				...prev.priceComparisons,
				{ url: "", price: "0.00" } as PriceComparison,
			],
		}));
	};

	const updatePriceComparison = (
		index: number,
		field: "url" | "price",
		value: any
	) => {
		const updated = [...formData.priceComparisons];
		updated[index][field] = field === "price" ? parseFloat(value) || 0 : value;
		setFormData((prev) => ({ ...prev, priceComparisons: updated }));
	};

	const removePriceComparison = (index: number) => {
		setFormData((prev) => ({
			...prev,
			priceComparisons: prev.priceComparisons.filter((_, i) => i !== index),
		}));
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
			<ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
			<ModalContent bg={bgColor} borderRadius="2xl" maxH="90vh">
				<ModalHeader
					borderBottom="1px"
					borderColor={borderColor}
					pb={4}
					fontSize="2xl"
					fontWeight="bold"
				>
					<Flex align="center" gap={3}>
						<AddIcon color={accentColor} />
						Add New {formData.isAuction ? "Auction" : "Item"}
					</Flex>
				</ModalHeader>
				<ModalCloseButton />

				<ModalBody py={6}>
					<Grid templateColumns="1fr 1fr" gap={8}>
						{/* Left Column - Images */}
						<GridItem>
							<VStack spacing={6}>
								{/* Image Carousel */}
								<Box w="full">
									<Text fontSize="lg" fontWeight="semibold" mb={4}>
										Product Images
									</Text>

									{uploadedImages.length > 0 ? (
										<Box position="relative">
											<AspectRatio ratio={4 / 3} mb={4}>
												<Image
													src={uploadedImages[currentImageIndex]}
													alt={`Product image ${currentImageIndex + 1}`}
													objectFit="cover"
													borderRadius="xl"
													border="2px"
													borderColor={borderColor}
												/>
											</AspectRatio>

											{uploadedImages.length > 1 && (
												<>
													<IconButton
														aria-label="Previous image"
														icon={<ChevronLeftIcon />}
														position="absolute"
														left={2}
														top="50%"
														transform="translateY(-50%)"
														bg="blackAlpha.600"
														color="white"
														_hover={{ bg: "blackAlpha.800" }}
														borderRadius="full"
														size="sm"
														onClick={prevImage}
													/>
													<IconButton
														aria-label="Next image"
														icon={<ChevronRightIcon />}
														position="absolute"
														right={2}
														top="50%"
														transform="translateY(-50%)"
														bg="blackAlpha.600"
														color="white"
														_hover={{ bg: "blackAlpha.800" }}
														borderRadius="full"
														size="sm"
														onClick={nextImage}
													/>
												</>
											)}

											<Badge
												position="absolute"
												bottom={2}
												right={2}
												bg="blackAlpha.600"
												color="white"
												borderRadius="full"
												px={2}
												py={1}
											>
												{currentImageIndex + 1} / {uploadedImages.length}
											</Badge>
										</Box>
									) : (
										<AspectRatio ratio={4 / 3} mb={4}>
											<Center
												border="2px dashed"
												borderColor={borderColor}
												borderRadius="xl"
												bg="gray.50"
												_dark={{ bg: "gray.700" }}
											>
												<VStack>
													<AddIcon color="gray.400" boxSize={8} />
													<Text color="gray.400" fontSize="lg">
														No images uploaded yet
													</Text>
												</VStack>
											</Center>
										</AspectRatio>
									)}

									<ImageUpload
										multiple={true}
										maxFiles={5}
										onUploadComplete={handleImageUpload}
										variant="compact"
										label=""
									/>
								</Box>

								{/* Auction Toggle */}
								<Box
									w="full"
									p={4}
									bg="gray.50"
									_dark={{ bg: "gray.700" }}
									borderRadius="xl"
								>
									<FormControl display="flex" alignItems="center">
										<FormLabel
											htmlFor="auction-toggle"
											mb="0"
											fontSize="lg"
											fontWeight="semibold"
										>
											<CalendarIcon mr={2} />
											List as Auction
										</FormLabel>
										<Switch
											id="auction-toggle"
											isChecked={formData.isAuction}
											onChange={(e) =>
												handleInputChange("isAuction", e.target.checked)
											}
											colorScheme="blue"
											size="lg"
										/>
									</FormControl>
									<Text fontSize="sm" color={textColor} mt={2}>
										Enable to create an auction listing instead of a fixed price
									</Text>
								</Box>
							</VStack>
						</GridItem>

						{/* Right Column - Form */}
						<GridItem>
							<VStack spacing={6} align="stretch">
								{/* Basic Information */}
								<Box>
									<Text fontSize="lg" fontWeight="semibold" mb={4}>
										Basic Information
									</Text>

									<FormControl isRequired mb={4}>
										<FormLabel>Item Name</FormLabel>
										<Input
											placeholder="Enter item name"
											value={formData.name}
											onChange={(e) =>
												handleInputChange("name", e.target.value)
											}
											fontSize="lg"
											borderRadius="lg"
										/>
									</FormControl>

									<FormControl mb={4}>
										<FormLabel>Description</FormLabel>
										<Textarea
											placeholder="Describe your item..."
											value={formData.description}
											onChange={(e) =>
												handleInputChange("description", e.target.value)
											}
											rows={4}
											borderRadius="lg"
										/>
									</FormControl>

									<FormControl isRequired mb={4}>
										<FormLabel>Category</FormLabel>
										<Select
											placeholder="Choose a category"
											value={formData.category}
											onChange={(e) =>
												handleInputChange("category", e.target.value)
											}
											borderRadius="lg"
										>
											{Object.values(Category).map((category) => (
												<option key={category} value={category}>
													{category}
												</option>
											))}
										</Select>
									</FormControl>
								</Box>

								<Divider />

								{/* Condition */}
								<Box>
									<FormControl isRequired mb={4}>
										<FormLabel>Condition</FormLabel>
										<RadioGroup
											value={formData.condition}
											onChange={(value) =>
												handleInputChange("condition", value)
											}
										>
											<Grid templateColumns="1fr 1fr" gap={2}>
												{Object.values(Condition).map((condition) => (
													<Radio key={condition} value={condition}>
														<ConditionLabel condition={condition} />
													</Radio>
												))}
											</Grid>
										</RadioGroup>
									</FormControl>
								</Box>

								<Divider />

								{/* Pricing */}
								<Box>
									<Text fontSize="lg" fontWeight="semibold" mb={4}>
										Pricing
									</Text>

									{formData.isAuction ? (
										<HStack spacing={4}>
											<FormControl isRequired flex={1}>
												<FormLabel>Starting Bid ($)</FormLabel>
												<NumberInput
													value={formData.startingBid}
													onChange={(_, value) =>
														handleInputChange("startingBid", value)
													}
													min={0}
													precision={2}
												>
													<NumberInputField borderRadius="lg" />
													<NumberInputStepper>
														<NumberIncrementStepper />
														<NumberDecrementStepper />
													</NumberInputStepper>
												</NumberInput>
											</FormControl>
											<FormControl isRequired flex={1}>
												<FormLabel>Duration (days)</FormLabel>
												<NumberInput
													value={formData.auctionDuration}
													onChange={(_, value) =>
														handleInputChange("auctionDuration", value)
													}
													min={1}
													max={30}
												>
													<NumberInputField borderRadius="lg" />
													<NumberInputStepper>
														<NumberIncrementStepper />
														<NumberDecrementStepper />
													</NumberInputStepper>
												</NumberInput>
											</FormControl>
										</HStack>
									) : (
										<FormControl isRequired>
											<FormLabel>Price ($)</FormLabel>
											<NumberInput
												value={formData.price}
												onChange={(_, value) =>
													handleInputChange("price", value)
												}
												min={0}
												precision={2}
											>
												<NumberInputField borderRadius="lg" />
												<NumberInputStepper>
													<NumberIncrementStepper />
													<NumberDecrementStepper />
												</NumberInputStepper>
											</NumberInput>
										</FormControl>
									)}
								</Box>
								<Box mt={4}>
									<Text fontSize="md" fontWeight="semibold" mb={2}>
										Price Comparisons
									</Text>

									<VStack spacing={3} align="stretch">
										{formData.priceComparisons.map((comparison, index) => (
											<HStack key={index}>
												<Input
													placeholder="Competitor URL"
													value={comparison.url}
													onChange={(e) =>
														updatePriceComparison(index, "url", e.target.value)
													}
													flex={2}
												/>
												<NumberInput
													value={comparison.price}
													onChange={(_, value) =>
														updatePriceComparison(index, "price", value)
													}
													min={0}
													precision={2}
													flex={1}
												>
													<NumberInputField />
													<NumberInputStepper>
														<NumberIncrementStepper />
														<NumberDecrementStepper />
													</NumberInputStepper>
												</NumberInput>
												<IconButton
													aria-label="Remove"
													icon={<CloseIcon boxSize={3} />}
													size="sm"
													colorScheme="red"
													variant="ghost"
													onClick={() => removePriceComparison(index)}
												/>
											</HStack>
										))}

										<Button
											onClick={addPriceComparison}
											leftIcon={<AddIcon />}
											size="sm"
											alignSelf="start"
										>
											Add Price Comparison
										</Button>
									</VStack>
								</Box>

								<Divider />

								{/* Location */}
								<Box>
									<Text fontSize="lg" fontWeight="semibold" mb={4}>
										Location
									</Text>
									<LoadScript
										googleMapsApiKey={GOOGLE_MAPS_API_KEY}
										libraries={libraries}
									>
										<FormControl>
											<FormLabel>Address</FormLabel>
											<div className="relative z-50 overflow-visible">
												<Autocomplete
													onLoad={onLoadAutocomplete}
													onPlaceChanged={onPlaceChanged}
												>
													<Input
														placeholder="Search for location"
														value={formData.location.label}
														onChange={(e) =>
															handleLocationChange("label", e.target.value)
														}
														borderRadius="lg"
													/>
												</Autocomplete>
											</div>
										</FormControl>
									</LoadScript>
								</Box>

								<Divider />

								{/* Attributes */}
								<Box>
									<Text fontSize="lg" fontWeight="semibold" mb={4}>
										Attributes
									</Text>
									<VStack spacing={3} align="stretch">
										{Object.entries(Attributes).map(([category, values]) => (
											<HStack key={category} spacing={3}>
												<Text minW="80px" fontSize="sm" fontWeight="medium">
													{category}:
												</Text>
												<Select
													placeholder={`Select ${category.toLowerCase()}`}
													size="sm"
													value={
														formData.attributes.find(
															(attr) => attr.category === category
														)?.value || ""
													}
													onChange={(e) => {
														if (e.target.value) {
															addAttribute(
																category as AttributeCategory,
																e.target.value as AttributeValue
															);
														} else {
															removeAttribute(category as AttributeCategory);
														}
													}}
													borderRadius="lg"
												>
													{values.map((value) => (
														<option key={value} value={value}>
															{value}
														</option>
													))}
												</Select>
											</HStack>
										))}
									</VStack>
								</Box>

								<Divider />

								{/* Tags */}
								<Box>
									<Text fontSize="lg" fontWeight="semibold" mb={4}>
										Tags
									</Text>
									<HStack mb={3}>
										<Input
											placeholder="Add a tag"
											value={newTag}
											onChange={(e) => setNewTag(e.target.value)}
											onKeyPress={(e) => e.key === "Enter" && addTag()}
											size="sm"
											borderRadius="lg"
										/>
										<Button onClick={addTag} size="sm" colorScheme="blue">
											Add
										</Button>
									</HStack>
									<Wrap>
										{formData.tags.map((tag) => (
											<WrapItem key={tag}>
												<Tag size="md" colorScheme="blue" borderRadius="full">
													<TagLabel>{tag}</TagLabel>
													<TagCloseButton onClick={() => removeTag(tag)} />
												</Tag>
											</WrapItem>
										))}
									</Wrap>
								</Box>
							</VStack>
						</GridItem>
					</Grid>
				</ModalBody>

				<ModalFooter borderTop="1px" borderColor={borderColor} pt={4}>
					<HStack spacing={3}>
						<Button variant="outline" onClick={onClose} borderRadius="lg">
							Cancel
						</Button>
						<Button
							colorScheme="blue"
							onClick={handleSubmit}
							isLoading={isSubmitting}
							loadingText="Adding..."
							borderRadius="lg"
							px={8}
						>
							Add {formData.isAuction ? "Auction" : "Item"}
						</Button>
					</HStack>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export default AddItemModalPopup;
