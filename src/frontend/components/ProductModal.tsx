import {
	Box,
	Button,
	Flex,
	IconButton,
	Tag,
	TagLabel,
	Text,
	useDisclosure
} from "@chakra-ui/react";
import { useMediaQuery } from "react-responsive";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
	setSelectedProduct,
	selectSelectedProduct,
	updateProductThunk,
	deleteProductThunk,
	markProductAsSoldThunk,
	fetchProductByIdThunk,
	updateProductInList,
} from "../redux/slices/productSlice";
import {
	fetchUserById,
	addProductToWishlist,
	removeProductFromWishlist,
	updateUserListsOnSale,
} from "../redux/slices/userSlice";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import PriceDisplay from "./PriceDisplay";
import SellerDisplay from "./SellerDisplay";
import ReviewUserModal from "./ReviewUserModal";
import RelistItemModal from "./RelistItemModal";
import EditProductModal from "./EditProductModal";
import MarkAsSoldModal from "./MarkAsSoldModal";
import { useReviewSubmission } from "../redux/hooks/useReviewSubmission";
import type {
	Product,
	User,
	AttributeCategory,
	ReviewScore,
} from "../../types";
import type { RootState } from "../redux/store";
import PlaceBidModal from "./PlaceBidModal";
import ConditionLabel from "./ConditionLabel";
import { useNavigate } from "react-router-dom";

type ProductModalProps = {
	mode?: "buyer" | "seller" | "purchased";
};

export default function ProductModal({ mode = "buyer" }: ProductModalProps) {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const [sellerUser, setSellerUser] = useState<User | null>(null);
	const selectedProduct = useAppSelector(selectSelectedProduct);
	const user = useAppSelector((state: RootState) => state.users.currentUser);
	const location = useLocation();
	const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const {
		isOpen: isPlaceBidOpen,
		onOpen: onPlaceBidOpen,
		onClose: onPlaceBidClose,
	} = useDisclosure();

	// Check if product is in wishlist
	const favorited = !!user?.wishlist?.includes(selectedProduct?.id || "");

	const shouldAddToWishlist =
		mode === "buyer" && user?.id !== selectedProduct?.sellerId;

	// Review submission hook
	const { submitReview } = useReviewSubmission({
		onSuccess: () => {
			onReviewClose();
		},
	});

	// Modal hooks
	const {
		isOpen: isReviewOpen,
		onOpen: onReviewOpen,
		onClose: onReviewClose,
	} = useDisclosure();
	const {
		isOpen: isRelistOpen,
		onOpen: onRelistOpen,
		onClose: onRelistClose,
	} = useDisclosure();
	const {
		isOpen: isEditOpen,
		onOpen: onEditOpen,
		onClose: onEditClose,
	} = useDisclosure();
	const {
		isOpen: isMarkAsSoldOpen,
		onOpen: onMarkAsSoldOpen,
		onClose: onMarkAsSoldClose,
	} = useDisclosure();

	useEffect(() => {
		// Whenever the path changes, clear selected product (close modal)
		dispatch(setSelectedProduct(null));
	}, [location.pathname, dispatch]);

	// Fetch seller when modal is open and product has a sellerId
	useEffect(() => {
		if (isReviewOpen && selectedProduct?.sellerId) {
			dispatch(fetchUserById(selectedProduct.sellerId))
				.unwrap()
				.then((user) => setSellerUser(user))
				.catch(() => setSellerUser(null));
		}
	}, [isReviewOpen, selectedProduct?.sellerId, dispatch]);

	if (!selectedProduct) return null;

	const images = selectedProduct.images?.length
		? selectedProduct.images
		: ["/NoImage.png"];
	const currentImage = images[currentImageIndex];

	const handlePrev = () => {
		setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
	};

	const handleNext = () => {
		setCurrentImageIndex((prev) => (prev + 1) % images.length);
	};

	const handleClose = () => {
		dispatch(setSelectedProduct(null));
	};

	const handleWishlistToggle = () => {
		if (!user) {
			alert("Please log in to favorite items.");
			return;
		}

		if (!selectedProduct?.id) return;

		if (favorited) {
			dispatch(
				removeProductFromWishlist({
					userId: user.id,
					productId: selectedProduct.id,
				})
			);
		} else {
			dispatch(
				addProductToWishlist({ userId: user.id, productId: selectedProduct.id })
			);
		}
	};

	const handleReviewSubmit = async (reviewData: {
		score: ReviewScore;
		comment: string;
		role: "buyer" | "seller";
	}) => {
		if (!selectedProduct?.sellerId) return;

		await submitReview(selectedProduct.sellerId, reviewData);
	};

	const handleEditSubmit = (updates: Partial<Product>) => {
		if (!selectedProduct?.id) return;

		dispatch(updateProductThunk({ productId: selectedProduct.id, updates }))
			.unwrap()
			.then(() => {
				console.log("Product updated!");
				onEditClose();
			})
			.catch((err) => {
				console.error("Failed to update product:", err);
			});
	};

	const handleMarkAsSold = async (buyerId: string) => {
		if (!selectedProduct?.id || !user?.id) return;

		try {
			// Mark product as sold
			await dispatch(
				markProductAsSoldThunk({
					productId: selectedProduct.id,
					buyerId,
				})
			).unwrap();

			// Update user lists (remove from seller's forSale, add to buyer's purchased)
			await dispatch(
				updateUserListsOnSale({
					sellerId: user.id,
					buyerId,
					productId: selectedProduct.id,
				})
			).unwrap();

			console.log("Product marked as sold successfully!");
		} catch (error) {
			console.error("Failed to mark product as sold:", error);
			throw error; // Re-throw so the modal can handle the error
		}
	};

	// Group attributes by category
	const groupedAttributes =
		selectedProduct.attributes?.reduce(
			(acc, attr) => {
				if (!acc[attr.category]) {
					acc[attr.category] = [];
				}
				acc[attr.category].push(attr.value);
				return acc;
			},
			{} as Record<AttributeCategory, string[]>
		) || {};

	const formatAuctionEndsAt = (auctionEndsAt: any): string => {
		if (!auctionEndsAt) return "N/A";
		let date: Date;
		// Handle plain object like { seconds: ..., nanoseconds: ... }
		if (
			typeof auctionEndsAt === "object" &&
			typeof auctionEndsAt.seconds === "number"
		) {
			date = new Date(auctionEndsAt.seconds * 1000); // Convert seconds to ms
		} else {
			return "N/A"; // Unknown format
		}

		return isNaN(date.getTime())
			? "Invalid Date"
			: date.toLocaleString("en-US", {
					dateStyle: "medium",
					timeStyle: "short",
				});
	};

	// Check if product is already sold
	const isProductSold = selectedProduct.status === "sold";

	return (
		<>
			<Box
				position="fixed"
				top={0}
				left={0}
				w="100vw"
				h="100vh"
				bg="blackAlpha.600"
				display="flex"
				alignItems="center"
				justifyContent="center"
				zIndex={1000}
				p={4}
				onClick={handleClose}
			>
				<Box
					bg='white'
					borderRadius="xl"
					p={6}
					maxW="900px"
					maxH="90vh"
					w="100%"
					h={isMobile ? "90vh" : "600px"}
					overflowY="auto"
					onClick={(e) => e.stopPropagation()}
					position="relative"
				>
					<Flex direction={isMobile ? "column" : "row"} gap={6} height="100%">
						{/* Image Carousel */}
						<Box
							flex={1}
							position="relative"
							height={isMobile ? "300px" : "100%"}
							minHeight="300px"
						>
							<img
								src={currentImage}
								alt={selectedProduct.name}
								style={{
									width: "100%",
									height: "100%",
									objectFit: "contain",
									borderRadius: "8px",
									transition: "opacity 0.3s ease-in-out",
								}}
								onError={(e) => (e.currentTarget.src = "/NoImage.png")}
							/>

							{images.length > 1 && (
								<>
									<IconButton
										icon={<ChevronLeftIcon />}
										aria-label="Previous image"
										position="absolute"
										top="50%"
										left="8px"
										transform="translateY(-50%)"
										onClick={handlePrev}
										variant="ghost"
										size="sm"
									/>
									<IconButton
										icon={<ChevronRightIcon />}
										aria-label="Next image"
										position="absolute"
										top="50%"
										right="8px"
										transform="translateY(-50%)"
										onClick={handleNext}
										variant="ghost"
										size="sm"
									/>
								</>
							)}
						</Box>

						{/* Product Info */}
						<Box
							flex={1}
							display="flex"
							flexDirection="column"
							justifyContent="space-between"
						>
							<Box overflowY="auto">
								<Box color="black" as="h2" fontSize="3xl" fontWeight="bold" mb={3}>
									{selectedProduct.name}
									{isProductSold && (
										<Tag size="md" colorScheme="red" variant="solid" ml={3}>
											SOLD
										</Tag>
									)}
								</Box>
								<Box color="gray.600" fontSize="lg" mb={3}>
									{selectedProduct.description}
								</Box>
								<ConditionLabel condition={selectedProduct.condition} />

								<PriceDisplay
									basePrice={
										selectedProduct.isAuction
											? (selectedProduct.currentBid ??
												selectedProduct.startingBid ??
												0)
											: (selectedProduct.price ?? 0)
									}
									priceComparisons={selectedProduct.priceComparisons}
									fontSize="1.3em"
									customColor={
										selectedProduct.isAuction ? "#b7791f" : undefined
									}
								/>
								{/* Auction Details */}
								{selectedProduct.isAuction && (
									<Box mb={5}>
										<Text
											fontSize="md"
											fontWeight="semibold"
											mb={2}
											color="gray.700"
										>
											Auction Details
										</Text>
										<Flex
											direction="column"
											gap={1}
											fontSize="sm"
											color="gray.600"
										>
											<Text>
												<Text as="span" fontWeight="medium" color="gray.800">
													Starting Bid:
												</Text>{" "}
												${selectedProduct.startingBid}
											</Text>
											<Text>
												<Text as="span" fontWeight="medium" color="gray.800">
													Current Bid:
												</Text>{" "}
												${selectedProduct.currentBid}
											</Text>
											{selectedProduct.auctionEndsAt && (
												<Text>
													<Text as="span" fontWeight="medium" color="gray.800">
														Ends:
													</Text>{" "}
													{formatAuctionEndsAt(selectedProduct.auctionEndsAt)}
												</Text>
											)}
										</Flex>
									</Box>
								)}

								{/* Product Attributes */}
								{Object.keys(groupedAttributes).length > 0 && (
									<Box mb={4}>
										<Text
											fontSize="md"
											fontWeight="semibold"
											mb={2}
											color="gray.700"
										>
											Details:
										</Text>
										<Flex direction="column" gap={2}>
											{Object.entries(groupedAttributes).map(
												([category, values]) => (
													<Flex key={category} align="center" gap={2}>
														<Text
															fontSize="sm"
															fontWeight="medium"
															color="gray.600"
															minW="60px"
														>
															{category}:
														</Text>
														<Flex gap={1} flexWrap="wrap">
															{values.map((value, index) => (
																<Tag
																	key={index}
																	size="sm"
																	colorScheme="blue"
																	variant="subtle"
																>
																	<TagLabel>{value}</TagLabel>
																</Tag>
															))}
														</Flex>
													</Flex>
												)
											)}
										</Flex>
									</Box>
								)}

								{/* Tags */}
								{selectedProduct.tags && selectedProduct.tags.length > 0 && (
									<Box mb={4}>
										<Text
											fontSize="md"
											fontWeight="semibold"
											mb={2}
											color="gray.700"
										>
											Tags:
										</Text>
										<Flex gap={2} flexWrap="wrap">
											{selectedProduct.tags.map((tag, index) => (
												<Tag
													key={index}
													size="md"
													colorScheme="teal"
													variant="solid"
													borderRadius="full"
												>
													<TagLabel># {tag}</TagLabel>
												</Tag>
											))}
										</Flex>
									</Box>
								)}

								<SellerDisplay
									sellerId={selectedProduct.sellerId}
									asLink={true}
									size="large"
									onClick={handleClose}
								/>
							</Box>

							{/* Action Buttons */}
							{mode === "seller" ? (
								<Flex direction="column" gap={3} mt={6}>
									<Button
										colorScheme="green"
										onClick={onMarkAsSoldOpen}
										isDisabled={isProductSold}
									>
										{isProductSold ? "Already Sold" : "Mark As Sold"}
									</Button>

									<Button
										colorScheme="orange"
										onClick={onEditOpen}
										isDisabled={isProductSold}
									>
										Edit Product
									</Button>

									{/* Delete Item button (red, at bottom) */}
									<Button
										colorScheme="red"
										onClick={async () => {
											if (!selectedProduct?.id) return;
											const confirmDelete = window.confirm(
												"Are you sure you want to delete this product?"
											);
											if (!confirmDelete) return;

											try {
												await dispatch(
													deleteProductThunk(selectedProduct.id)
												).unwrap();
												console.log("Deleted item:", selectedProduct.id);
												handleClose(); // Close modal after deletion
											} catch (err) {
												console.error("Failed to delete item:", err);
											}
										}}
									>
										Delete Item
									</Button>
								</Flex>
							) : mode === "purchased" ? (
								<Flex direction="column" gap={3} mt={6}>
									<Button colorScheme="blue" onClick={onReviewOpen}>
										Review Seller
									</Button>
									<Button colorScheme="purple" onClick={onRelistOpen}>
										Relist Item
									</Button>
								</Flex>
							) : (
								// else we're a buyer
								<Flex direction="column" gap={3} mt={6}>
									<Button
										colorScheme={favorited ? "gray" : "teal"}
										onClick={handleWishlistToggle}
										isDisabled={isProductSold || !shouldAddToWishlist}
									>
										{favorited ? "Remove from Wishlist" : "Add to Wishlist"}
									</Button>
									<Button
										colorScheme="indigo"
										onClick={async () => {
											if (!user) {
												navigate("/login");
												return;
											}
											if (user.id === selectedProduct.sellerId) return;

											try {
												const res = await fetch("/api/messages/conversation/get-or-create", {
													method: "PUT",
													headers: {
														"Content-Type": "application/json",
													},
													body: JSON.stringify({
														userId1: user.id,
														userId2: selectedProduct.sellerId,
														productId: selectedProduct.id,
													}),
												});

												console.log(user.id, selectedProduct.sellerId, selectedProduct.id);

												if (!res.ok) {
													throw new Error("Failed to create or get conversation");
												}
												console.log("Conversation created or retrieved successfully");
												const conversationId = await res.json();
												navigate(`/messages/${conversationId}`);
											} catch (error) {
												console.error("Failed to open message:", error);
												alert("Failed to open message. Please try again later.");
											}
										}}
										isDisabled={Boolean(isProductSold || (user && user.id === selectedProduct.sellerId))}
									>
										Contact Seller
									</Button>
									{selectedProduct.isAuction ? (
										<Button
											colorScheme="blue"
											onClick={onPlaceBidOpen}
											isDisabled={!user}
										>
											{!user ? "Login to Bid" : "Place Bid"}
										</Button>
										) : (
										<Button
											colorScheme="gold"
											as={Link}
											to={`/purchase/${selectedProduct.id}`}
											onClick={handleClose}
                                            isDisabled={Boolean(isProductSold || (user && user.id === selectedProduct.sellerId))}
										>
											{isProductSold ? "Sold Out" : "Purchase"}
										</Button>
										)}
								</Flex>
							)}
						</Box>
					</Flex>

					<IconButton
						aria-label="Close"
						icon={<>&times;</>}
						position="absolute"
						top={3}
						right={3}
						variant="ghost"
						fontSize="2xl"
						onClick={handleClose}
					/>
				</Box>
			</Box>

			{/* Modals */}
			{sellerUser && (
				<ReviewUserModal
					isOpen={isReviewOpen}
					onClose={onReviewClose}
					user={sellerUser}
					onSubmit={handleReviewSubmit}
				/>
			)}

			{selectedProduct && (
				<EditProductModal
					isOpen={isEditOpen}
					onClose={onEditClose}
					product={selectedProduct}
					onSubmit={handleEditSubmit}
				/>
			)}

			{selectedProduct && (
				<MarkAsSoldModal
					isOpen={isMarkAsSoldOpen}
					onClose={onMarkAsSoldClose}
					product={selectedProduct}
					onMarkAsSold={handleMarkAsSold}
				/>
			)}

			<RelistItemModal
				isOpen={isRelistOpen}
				onClose={onRelistClose}
				product={selectedProduct}
			/>
			{selectedProduct && user?.id && (
				<PlaceBidModal
					isOpen={isPlaceBidOpen}
					onClose={onPlaceBidClose}
					productId={selectedProduct.id}
					currentUserId={user.id}
					onSuccess={async () => {
						onPlaceBidClose();
						dispatch(fetchProductByIdThunk(selectedProduct.id)); // for modal
						const updated = await dispatch(
							fetchProductByIdThunk(selectedProduct.id)
						).unwrap();

						dispatch(updateProductInList(updated)); // 🔁 refresh product card in list
					}}
				/>
			)}
		</>
	);
}
