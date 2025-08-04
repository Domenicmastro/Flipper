import {
	Box,
	Flex,
	IconButton,
	useBreakpointValue,
	useToast,
	Drawer,
	DrawerOverlay,
	DrawerContent,
	DrawerHeader,
	DrawerBody,
	Button,
	useDisclosure,
	Tooltip,
	useColorModeValue,
} from "@chakra-ui/react";
import {useState, createRef, useEffect, useMemo } from "react";
import SwipeControls from "../components/SwipeControls";
import SwipeStack from "../components/SwipeStack";
import { showToast } from "../../utils/toasts";
import type { Product } from "../../types/Product";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
	addProductToWishlist,
	fetchUserById,
	removeProductFromWishlist,
	selectCurrentUser,
} from "../redux/slices/userSlice";
import {
  fetchRecommendations,
  selectRecommendations,
  selectRecommendationsLoading,
} from "../redux/slices/recommendationsSlice";
import { setSelectedProduct } from "../redux/slices/productSlice";
import ProductModal from "../components/ProductModal";
import { FaHeart, FaTimes } from "react-icons/fa";

type SwipeDirection = "left" | "right";
type SwipeHistoryItem = { product: Product; direction: SwipeDirection };

export default function SwipePage() {
	const dispatch = useAppDispatch();
	const rawProducts = useAppSelector(selectRecommendations);
	const recommendationsLoading = useAppSelector(selectRecommendationsLoading);
	const currentUser = useAppSelector(selectCurrentUser);

	const bg = useColorModeValue("gray.100", "gray.800");
	const sidebarBg = useColorModeValue("white", "gray.900");
	const iconHoverBg = useColorModeValue("gray.100", "gray.700");
	const drawerBg = useColorModeValue("white", "gray.800");

	const ICON_BUTTON_STYLE = {
		isRound: true,
		variant: "ghost",
		colorScheme: "gray",
		size: "lg",
		boxShadow: "lg",
		_hover: { bg: iconHoverBg },
		position: "absolute" as const,
		top: "50%",
		transform: "translateY(-50%)",
		zIndex: 2,
	};

	const isMobile = useBreakpointValue({ base: true, md: false }) ?? true;
	const cardWidth = useBreakpointValue({ base: "90vw", md: "420px" });
	const imageHeight = useBreakpointValue({ base: "500px", md: "700px" }) ?? "600px";

	const [recentlyAdded, setRecentlyAdded] = useState<string[]>([]);
	const [swipeHistory, setSwipeHistory] = useState<SwipeHistoryItem[]>([]);
	const [swipedIds, setSwipedIds] = useState<string[]>([]);
	const toast = useToast();
	const { isOpen, onOpen, onClose } = useDisclosure();

	// Filter out products already wishlisted or swiped
	const swipableProducts = rawProducts.filter(
		(p) =>
			!currentUser?.wishlist?.includes(String(p.id)) &&
			!swipedIds.includes(String(p.id))
	);
	

	// Recreate refs when swipableProducts change
	const childRefs: React.RefObject<any>[] = useMemo(() => {
		return Array(swipableProducts.length)
			.fill(0)
			.map(() => createRef<any>());
	}, [swipableProducts.length]);

	const [currentIndex, setCurrentIndex] = useState(swipableProducts.length - 1);
	
	useEffect(() => {
		setCurrentIndex(swipableProducts.length - 1);
		//console.log("CURRENTREFS ");
		//console.log(childRefs);
	}, [swipableProducts.length]);

	// Fetch recommendations on mount
	useEffect(() => {
		if (currentUser?.id) {
			dispatch(fetchRecommendations(currentUser.id));
		}
	}, [dispatch, currentUser?.id]);

	const handleProductClick = (product: Product) => {
		dispatch(setSelectedProduct(product));
	};

	const processSwipe = (dir: SwipeDirection, product: Product) => {
		const productId = String(product.id);
		setSwipeHistory((prev) => [...prev, { product, direction: dir }]);

		if (dir === "right") {
			if (!isMobile) showToast(toast, "wishlist", product.name);
			setRecentlyAdded((prev) =>
				[productId, ...prev.filter((id) => id !== productId)].slice(0, 10)
			);

			if (currentUser && !currentUser.wishlist?.includes(productId)) {
				dispatch(addProductToWishlist({ userId: currentUser.id, productId }));
				dispatch(fetchUserById(currentUser.id)); // Ensure state reflects new wishlist
			}
		} else if (dir === "left") {
			if (!isMobile) showToast(toast, "skip", product.name);
		}
		setSwipedIds((prev) => [...prev, productId]);
		setCurrentIndex((prev) => prev - 1);
		
		//console.log("SWIPE PROCESSED DIRECTION: " + dir)
	};

	const swipe = async (dir: SwipeDirection) => {
		//console.log("SWIPING" + dir)
		if (currentIndex < 0 || !childRefs[currentIndex]?.current){
			//console.log("ENDING RECS" + currentIndex);
			//console.log(childRefs)
			return;
		} 
		await childRefs[currentIndex].current.swipe(dir);
	};

	const handleUndo = async () => {
		if (swipeHistory.length === 0) return;

		const last = swipeHistory[swipeHistory.length - 1];
		const productId = String(last.product.id);

		// Revert local swipe state
		setSwipedIds((prev) => prev.filter((id) => id !== productId));
		setSwipeHistory((prev) => prev.slice(0, -1));
		setCurrentIndex((prev) => prev + 1);

		// If it was added to wishlist, remove it
		if (
			last.direction === "right" &&
			currentUser?.wishlist?.includes(productId)
		) {
			await dispatch(
				removeProductFromWishlist({ userId: currentUser.id, productId })
			);
			await dispatch(fetchUserById(currentUser.id));
			setRecentlyAdded((prev) => prev.filter((id) => id !== productId));
		}
	};

	const renderRecentlyAddedList = () =>
		recentlyAdded.length === 0 ? (
			<Box color="gray.500">No items yet</Box>
		) : (
			recentlyAdded.map((id) => {
				const product = rawProducts.find((p) => String(p.id) === id);
				if (!product) return null;
				return (
					<Flex key={product.id} mb={4} gap={3} align="center">
						<Box boxSize="60px">
							<img
								src={product.images[0]}
								alt={product.name}
								style={{ objectFit: "cover", borderRadius: "8px" }}
							/>
						</Box>
						<Box>
							<Box fontWeight="semibold" fontSize="sm">
								{product.name}
							</Box>
							<Box fontSize="sm" color="gray.600">
								${product.price}
							</Box>
						</Box>
					</Flex>
				);
			})
		);

	if (recommendationsLoading) {
		return (
			<Flex minH="100vh" bg={bg} w="100%" align="center" justify="center">
				<Box textAlign="center">
					<Box fontSize="lg" mb={2}>Loading your personalized recommendations...</Box>
					<Box color="gray.500">This may take a moment</Box>
				</Box>
			</Flex>
		);
	}

	if (swipableProducts.length === 0) {
		return (
			<Flex minH="100vh" bg={bg} w="100%" align="center" justify="center">
				<Box textAlign="center">
					<Box fontSize="lg" mb={2}>No more products to swipe!</Box>
					<Box color="gray.500">Check back later for new recommendations</Box>
					<Button
						mt={4}
						colorScheme="blue"
						onClick={() =>
							currentUser?.id && dispatch(fetchRecommendations(currentUser.id))
						}
					>
						Refresh Recommendations
					</Button>
				</Box>
			</Flex>
		);
	}

	return (
		<Flex minH="100vh" bg={bg} w="100%">
			{!isMobile && (
				<Box w="320px" bg={sidebarBg} p={4} shadow="md" overflowY="auto" position="sticky" top="0">
					<Box fontWeight="bold" fontSize="lg" mb={1}>Recently Added</Box>
					<Box fontSize="sm" color="gray.600" mb={3}>
						From your personalized recommendations
					</Box>
					{renderRecentlyAddedList()}
				</Box>
			)}

			<Flex flex="1" direction="column" align="center" justify="center" px={4}>
				<Box position="relative" w={cardWidth} h="550px" mb={6}>
					{!isMobile && (
						<Tooltip label="Skip" hasArrow placement="left">
							<IconButton
								{...ICON_BUTTON_STYLE}
								aria-label="Skip"
								icon={<FaTimes />}
								colorScheme="gray"
								onClick={() => swipe("left")}
								left="-60px"
							/>
						</Tooltip>
					)}

					<SwipeStack
						products={swipableProducts}
						currentIndex={currentIndex}
						childRefs={childRefs}
						imageHeight={imageHeight}
						setCurrentIndex={setCurrentIndex}
						swipedIds={swipedIds}
						onSwipeDirection={processSwipe}
						onCardClick={handleProductClick}
					/>

					{!isMobile && (
						<Tooltip label="Add to Wishlist" hasArrow placement="right">
							<IconButton
								{...ICON_BUTTON_STYLE}
								aria-label="Add to Wishlist"
								icon={<FaHeart />}
								colorScheme="pink"
								onClick={() => swipe("right")}
								right="-60px"
							/>
						</Tooltip>
					)}
				</Box>

				<SwipeControls
					onUndo={handleUndo}
					disableUndo={swipeHistory.length === 0}
				/>

				{isMobile && (
					<Button mt={4} colorScheme="blue" onClick={onOpen}>
						Recently Added
					</Button>
				)}
			</Flex>

			{!isMobile && <Box w="320px" />}

			<Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
				<DrawerOverlay />
				<DrawerContent bg={drawerBg} borderTopRadius="xl">
					<DrawerHeader>Recently Added</DrawerHeader>
					<DrawerBody maxH="60vh" overflowY="auto">
						{renderRecentlyAddedList()}
					</DrawerBody>
				</DrawerContent>
			</Drawer>

      {/* Reusable modal */}
      <ProductModal />
    </Flex>
  );
}
