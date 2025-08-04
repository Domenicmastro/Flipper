import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
	Heading,
	Text,
	Box,
	Flex,
	Image,
	Button,
	// useToast,
} from "@chakra-ui/react";
import type { RootState, AppDispatch } from "../redux/store";
import { fetchProductsBySeller } from "../redux/slices/productBySellerSlice";
import { type Product, StatusLevel } from "@/types/Product";
import { setSelectedProduct } from "../redux/slices/productSlice";
import ProductModal from "../components/ProductModal";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import EditProfileModal from "../components/EditProfileModal";
import ReviewUserModal from "../components/ReviewUserModal";
import { useDisclosure } from "@chakra-ui/react";
import {
	// updateUserData,
	fetchUserById,
	selectAllUsers,
	fetchWishlistProducts,
} from "../redux/slices/userSlice";
import { fetchProducts } from "../redux/slices/productSlice";
import ProductGrid from "../components/ProductGrid";
import { useReviewSubmission } from "../redux/hooks/useReviewSubmission";
import type { ReviewScore } from "@/types/User";
import UserReviewModal from "../components/UserReviewModal";

const UserProfile = () => {
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const dispatch = useDispatch<AppDispatch>();
	// const toast = useToast();
	const { isOpen, onOpen, onClose } = useDisclosure();
	const {
		isOpen: isReviewOpen,
		onOpen: onReviewOpen,
		onClose: onReviewClose,
	} = useDisclosure();

	const [currentModalMode, setCurrentModalMode] = useState<
		"buyer" | "seller" | "purchased"
	>("buyer");

	const { submitReview } = useReviewSubmission({
		onSuccess: () => {
			onReviewClose();
		},
	});

	const allUsers = useSelector(selectAllUsers);
	const currentUser = useSelector(
		(state: RootState) => state.users.currentUser
	);
	const allProducts = useSelector(
		(state: RootState) => state.products.products
	);
	const wishlistProducts = useSelector(
		(state: RootState) => state.users.wishlistProducts
	);

	// to track product updates
	const productLastModified = useSelector(
		(state: RootState) => state.products.lastModified
	);

	const isCurrentUser = currentUser?.id === id;

	const user = allUsers.find((u) => u.id === id);

	const viewedUserWishlistProducts = isCurrentUser
		? wishlistProducts
		: allProducts.filter((p) => user?.wishlist?.includes(p.id));

	useEffect(() => {
		if (id) {
			dispatch(fetchUserById(id));
			dispatch(fetchProductsBySeller(id));
			dispatch(fetchProducts());
			if (!isCurrentUser) {
				dispatch(fetchWishlistProducts(id));
			}
		}
	}, [id, dispatch, isCurrentUser]);

	// for fetch on edit
	useEffect(() => {
		if (id && productLastModified) {
			dispatch(fetchProducts());
			dispatch(fetchProductsBySeller(id));
		}
	}, [productLastModified, id, dispatch]);

	// const handleSaveProfile = (updates: {
	// 	name: string;
	// 	image: string;
	// 	location?: Location | null;
	// }) => {
	// 	if (!user?.id) return;

	// 	const safeUpdates: Partial<typeof user> = {
	// 		name: updates.name,
	// 		image: updates.image,
	// 		// Only include location if it's not null
	// 		...(updates.location ? { location: updates.location } : {}),
	// 	};

	// 	dispatch(updateUserData({ userId: user.id, updates: safeUpdates }))
	// 		.unwrap()
	// 		.then(() => {
	// 			toast({
	// 				title: "Profile updated!",
	// 				status: "success",
	// 				duration: 3000,
	// 				isClosable: true,
	// 			});
	// 		})
	// 		.catch((error: string) => {
	// 			toast({
	// 				title: "Failed to update profile.",
	// 				description: error,
	// 				status: "error",
	// 				duration: 3000,
	// 				isClosable: true,
	// 			});
	// 		});
	// };

	const handleSubmitReview = async (reviewData: {
		score: ReviewScore;
		comment: string;
		role: "buyer" | "seller";
	}) => {
		if (!user?.id) return;
		await submitReview(user.id, reviewData);
	};

	const handleForSaleProductClick = (product: Product) => {
		setCurrentModalMode(isCurrentUser ? "seller" : "buyer");
		dispatch(setSelectedProduct(product));
	};

	const handlePurchasedProductClick = (product: Product) => {
		setCurrentModalMode("purchased");
		dispatch(setSelectedProduct(product));
	};

	const handleWishlistProductClick = (product: Product) => {
		setCurrentModalMode("buyer");
		dispatch(setSelectedProduct(product));
	};

	if (!user) return <Text>Loading profile...</Text>;

	const averageRating =
		user.reviews.length > 0
			? user.reviews.reduce((sum, r) => sum + r.score, 0) / user.reviews.length
			: 0;

	const renderStars = (avg: number) => {
		const iconSize = 18;
		const stars = [];
		for (let i = 1; i <= 5; i++) {
			if (avg >= i) stars.push(<FaStar key={i} color="gold" size={iconSize} />);
			else if (avg >= i - 0.5)
				stars.push(<FaStarHalfAlt key={i} color="gold" size={iconSize} />);
			else stars.push(<FaRegStar key={i} color="lightgray" size={iconSize} />);
		}
		return stars;
	};

	const purchasedProducts = allProducts.filter((p: Product) =>
		user?.purchased?.includes(p.id)
	);

	const {
		isOpen: isReviewModalOpen,
		onOpen: onReviewModalOpen,
		onClose: onReviewModalClose,
        // eslint-disable-next-line react-hooks/rules-of-hooks
	} = useDisclosure();

	return (
		<>
			<Box mb={6}>
				<Flex direction={{ base: "column", md: "row" }} gap={2} mt={4}>
					{isCurrentUser && (
						<Button p={4} onClick={onOpen}>
							Edit Profile
						</Button>
					)}
					{isCurrentUser && (
						<Button onClick={() => navigate("/recommended")} p={4}>
							View Recommended
						</Button>
					)}
				</Flex>
			</Box>

			<Flex direction={{ base: "column", md: "row" }} gap={4}>
				<Box
					border="1px solid lightgray"
					borderRadius={8}
					width={{ base: "100%", md: "40%" }}
					height="600px"
					overflow="hidden"
					display="flex"
					flexDirection="column"
				>
					<Box
						flex="1"
						display="flex"
						alignItems="center"
						justifyContent="center"
						overflow="hidden"
						bg="gray.50"
					>
						<Image
							src={user.image ?? ""}
							alt="User Profile"
							objectFit="contain"
							maxWidth="100%"
							maxHeight="100%"
						/>
					</Box>

					<Box p={4} flexShrink={0} bg="white" borderTop="1px solid lightgray">
						<Flex justify="space-between" align="start" wrap="wrap">
							<Box>
								<Heading size="md" mb={2}>
									{user.name}
								</Heading>
								<Text fontSize="sm" color="gray.600" mb={1}>
									{user.email}
								</Text>
								{user.location?.label && (
									<Text fontSize="sm" color="gray.600" mb={2}>
										{user.location.label}
									</Text>
								)}
								<Flex align="center" gap={2}>
									<Flex>{renderStars(averageRating)}</Flex>
									<Text
										fontSize="sm"
										color="gray.500"
										cursor="pointer"
										textDecoration="underline"
										onClick={onReviewModalOpen}
									>
										({user.reviews.length} review
										{user.reviews.length !== 1 ? "s" : ""})
									</Text>
								</Flex>
							</Box>

							{!isCurrentUser && currentUser && (
								<Flex direction="column" align="end" gap={2} mt={{ base: 4, md: 0 }}>
									<Button colorScheme="indigo" w="160px"
											onClick={async () => {
												try {
													const res = await fetch("/api/messages/conversation/get-or-create", {
														method: "PUT",
														headers: {
															"Content-Type": "application/json",
														},
														body: JSON.stringify({
															userId1: currentUser?.id,
															userId2: user.id,
														}),
													});

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
											}}>
										Contact User
									</Button>
									<Button onClick={onReviewOpen} colorScheme="blue" w="160px">
										Review User
									</Button>
								</Flex>
							)}
						</Flex>
					</Box>
				</Box>

				<Box
					border="1px solid lightgray"
					borderRadius={8}
					p={4}
					height="600px"
					width={{ base: "100%", md: "60%" }}
					overflow="hidden"
					display="flex"
					flexDirection="column"
				>
					<Box mb={2} fontWeight="bold" fontSize="lg" flexShrink={0}>
						Items for Sale
					</Box>
					<Box flex={1} overflowY="auto">
						<ProductGrid
							products={allProducts.filter(
								(prod) =>
									prod.sellerId === id && prod.status === StatusLevel.forSale
							)}
							loading={false}
							error={null}
							sellerNames={{ [user.id]: user.name }}
							onProductClick={handleForSaleProductClick}
							isMobile={false}
							onRetry={() => {}}
						/>
					</Box>
				</Box>
			</Flex>

			<Box
				mt={6}
				border="1px solid lightgray"
				borderRadius={8}
				p={4}
				height="600px"
				overflow="hidden"
			>
				<Box mb={2} fontWeight="bold" fontSize="lg" flexShrink={0}>
					{isCurrentUser ? "Purchased Items" : "Wishlist"}
				</Box>
				<Box flex={1} overflowY="auto">
					<ProductGrid
						products={
							isCurrentUser ? purchasedProducts : viewedUserWishlistProducts
						}
						loading={false}
						error={null}
						sellerNames={allUsers.reduce(
							(acc, u) => ({ ...acc, [u.id]: u.name }),
							{}
						)}
						onProductClick={
							isCurrentUser
								? handlePurchasedProductClick
								: handleWishlistProductClick
						}
						isMobile={false}
						onRetry={() => {}}
					/>
				</Box>
			</Box>

			<ProductModal mode={currentModalMode} />

			{isCurrentUser && user && (
				<EditProfileModal
					isOpen={isOpen}
					onClose={onClose}
					user={user}
					// onSave={handleSaveProfile}
				/>
			)}

			{!isCurrentUser && user && (
				<ReviewUserModal
					isOpen={isReviewOpen}
					onClose={onReviewClose}
					user={user}
					onSubmit={handleSubmitReview}
				/>
			)}
			{user && (
				<UserReviewModal
					isOpen={isReviewModalOpen}
					onClose={onReviewModalClose}
					user={user}
				/>
			)}
		</>
	);
};

export default UserProfile;
