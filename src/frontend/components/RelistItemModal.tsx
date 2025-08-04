import { useState } from "react";
import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalCloseButton,
	Button,
	Text,
	VStack,
	HStack,
	Box,
	Image,
	useToast,
	Divider,
	Badge,
	useColorModeValue,
	Alert,
	AlertIcon,
	FormControl,
	FormLabel,
	Input,
	InputGroup,
	InputLeftElement,
	FormErrorMessage,
} from "@chakra-ui/react";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { updateProductThunk } from "../redux/slices/productSlice";
import { updateUserData } from "../redux/slices/userSlice";
import type { Product } from "@/types/Product";
import { StatusLevel } from "@/types/Product";
import LocationInput from "./LocationInput";
import type { Location } from "@/types/Product";
import { Timestamp } from 'firebase/firestore';

type RelistItemModalProps = {
	isOpen: boolean;
	onClose: () => void;
	product: Product;
};

const RelistItemModal: React.FC<RelistItemModalProps> = ({ isOpen, onClose, product }) => {
	const dispatch = useAppDispatch();
	const currentUser = useAppSelector(state => state.users.currentUser);
	const [newLocation, setNewLocation] = useState<Location | null>(currentUser?.location || null);
	const [newPrice, setNewPrice] = useState<string>(product.price.toString());
	const [priceError, setPriceError] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showConfirmation, setShowConfirmation] = useState(false);
	const toast = useToast();

	const borderColor = useColorModeValue('gray.200', 'gray.600');
	const bgColor = useColorModeValue('gray.50', 'gray.800');

	const validatePrice = (price: string): boolean => {
		const numPrice = parseFloat(price);
		if (isNaN(numPrice) || numPrice <= 0) {
			setPriceError("Price must be a valid number greater than 0");
			return false;
		}
		if (numPrice > 999999.99) {
			setPriceError("Price cannot exceed $999,999.99");
			return false;
		}
		setPriceError("");
		return true;
	};

	const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setNewPrice(value);
		if (value) {
			validatePrice(value);
		} else {
			setPriceError("Price is required");
		}
	};

	const handleRelist = async () => {
		if (!currentUser) {
			toast({
				title: "Authentication required",
				description: "Please log in to relist this item",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
			return;
		}

		if (!newLocation) {
			toast({
				title: "Location required",
				description: "Please select a location for the relisted item",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
			return;
		}

		if (!validatePrice(newPrice)) {
			return;
		}

		setIsSubmitting(true);
		try {
			// Update the product
			const productUpdates = {
				sellerId: currentUser.id,
				location: newLocation,
				price: parseFloat(newPrice),
				status: StatusLevel.forSale,
				updatedAt: Timestamp.now()
			};

			await dispatch(updateProductThunk({
				productId: product.id,
				updates: productUpdates
			})).unwrap();

			// Update the user - move from purchased to forSale
			const userUpdates = {
				forSale: [...(currentUser.forSale || []), product.id],
				purchased: (currentUser.purchased || []).filter(id => id !== product.id),
			};

			await dispatch(updateUserData({
				userId: currentUser.id,
				updates: userUpdates
			})).unwrap();

			toast({
				title: "Item relisted successfully",
				description: `${product.name} is now available for sale`,
				status: "success",
				duration: 3000,
				isClosable: true,
			});

			onClose();
			setShowConfirmation(false);
		} catch (error) {
			toast({
				title: "Failed to relist item",
				description: error instanceof Error ? error.message : "Please try again later",
				status: "error",
				duration: 3000,
				isClosable: true,
			});
			console.error("Error relisting product:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		setShowConfirmation(false);
		setNewLocation(currentUser?.location || null);
		setNewPrice(product.price.toString());
		setPriceError("");
		onClose();
	};

	const handleLocationChange = (location: Location | null) => {
		setNewLocation(location);
	};

	const isFormValid = newLocation && newPrice && !priceError;

	if (!showConfirmation) {
		return (
			<Modal isOpen={isOpen} onClose={handleClose} size="md">
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>Relist {product.name}</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<VStack spacing={4} align="stretch">
							<Alert status="info">
								<AlertIcon />
								<Text fontSize="sm">
									Relisting will make this item available for sale again. You'll become the new seller.
								</Text>
							</Alert>

							{/* Product Preview */}
							<Box 
								border="1px solid" 
								borderColor={borderColor} 
								borderRadius="md" 
								p={4}
								bg={bgColor}
							>
								<HStack spacing={4}>
									{product.images && product.images.length > 0 && (
										<Image
											src={product.images[0]}
											alt={product.name}
											boxSize="80px"
											objectFit="cover"
											borderRadius="md"
										/>
									)}
									<VStack align="start" spacing={1} flex={1}>
										<Text fontWeight="semibold" noOfLines={2}>
											{product.name}
										</Text>
										<Text fontSize="sm" color="gray.600">
											Original price: ${product.price.toFixed(2)}
										</Text>
										<HStack>
											<Badge colorScheme="blue" variant="subtle">
												{product.condition}
											</Badge>
											<Badge colorScheme="gray" variant="outline">
												{product.status}
											</Badge>
										</HStack>
									</VStack>
								</HStack>
							</Box>

							<Divider />

							{/* Price Input */}
							<FormControl isInvalid={!!priceError} isRequired>
								<FormLabel>New Price</FormLabel>
								<InputGroup>
									<InputLeftElement pointerEvents="none" color="gray.500">
										$
									</InputLeftElement>
									<Input
										type="number"
										placeholder="0.00"
										value={newPrice}
										onChange={handlePriceChange}
										min="0"
										step="0.01"
										pl={8}
									/>
								</InputGroup>
								{priceError && <FormErrorMessage>{priceError}</FormErrorMessage>}
							</FormControl>

							{/* Location Selection */}
							<LocationInput
								label="New Location"
								placeholder="Where will this item be located?"
								value={newLocation}
								onChange={handleLocationChange}
								showCurrentLocationButton={true}
								showClearButton={true}
								isRequired
							/>

							<Alert status="warning" variant="left-accent">
								<AlertIcon />
								<VStack align="start" spacing={1}>
									<Text fontSize="sm" fontWeight="medium">
										Before relisting, please ensure:
									</Text>
									<Text fontSize="sm">
										• You still have possession of this item
									</Text>
									<Text fontSize="sm">
										• The item condition hasn't changed significantly
									</Text>
									<Text fontSize="sm">
										• You're authorized to sell this item
									</Text>
								</VStack>
							</Alert>
						</VStack>
					</ModalBody>
					<ModalFooter>
						<Button variant="ghost" mr={3} onClick={handleClose}>
							Cancel
						</Button>
						<Button
							colorScheme="blue"
							onClick={() => setShowConfirmation(true)}
							isDisabled={!isFormValid}
						>
							Relist Item
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		);
	}

	// Confirmation Modal
	return (
		<Modal isOpen={isOpen} onClose={handleClose} size="md">
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>Confirm Relisting</ModalHeader>
				<ModalCloseButton />
				<ModalBody>
					<VStack spacing={4} align="stretch">
						<Alert status="warning">
							<AlertIcon />
							<Text>
								Are you sure you want to relist "{product.name}"? This action will make the item available for sale again.
							</Text>
						</Alert>

						<Box>
							<Text fontSize="sm" color="gray.600" mb={2}>
								New listing details:
							</Text>
							<VStack align="start" spacing={2} pl={4}>
								<Text fontSize="sm">
									<strong>Seller:</strong> {currentUser?.name}
								</Text>
								<Text fontSize="sm">
									<strong>Location:</strong> {newLocation?.label}
								</Text>
								<Text fontSize="sm">
									<strong>Status:</strong> For Sale
								</Text>
								<Text fontSize="sm">
									<strong>Price:</strong> ${parseFloat(newPrice).toFixed(2)}
									{parseFloat(newPrice) !== product.price && (
										<Text as="span" color="orange.500" ml={2}>
											(was ${product.price.toFixed(2)})
										</Text>
									)}
								</Text>
							</VStack>
						</Box>
					</VStack>
				</ModalBody>
				<ModalFooter>
					<Button 
						variant="ghost" 
						mr={3} 
						onClick={() => setShowConfirmation(false)}
						isDisabled={isSubmitting}
					>
						Back
					</Button>
					<Button
						colorScheme="blue"
						onClick={handleRelist}
						isLoading={isSubmitting}
						loadingText="Relisting..."
					>
						Confirm Relist
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
};

export default RelistItemModal;