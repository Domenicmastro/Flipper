import { useEffect, useState } from "react";
import {
	ProductModal,
	ProductGrid,
	FilterCard,
	HomeSearchBar,
} from "../components";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import {
	fetchProducts,
	selectFilteredProducts,
	selectLoading,
	selectError,
	setSelectedProduct,
	clearError,
} from "../redux/slices/productSlice";
import {
	selectCurrentUser,
	fetchWishlistProducts,
	selectUserNames,
	fetchAllUsers,
	fetchUserNameById,
} from "../redux/slices/userSlice";
import {
	fetchRecommendations,
	selectRecommendations,
	selectRecommendationsLoading,
	selectRecommendationsError,
} from "../redux/slices/recommendationsSlice";

export default function HomePage() {
	const dispatch = useAppDispatch();
	const allProducts = useAppSelector(selectFilteredProducts);
	const recommendedProducts = useAppSelector(selectRecommendations);
	const loading = useAppSelector(selectLoading);
	const recommendationsLoading = useAppSelector(selectRecommendationsLoading);
	const error = useAppSelector(selectError);
	const recommendationsError = useAppSelector(selectRecommendationsError);
	const currentUser = useAppSelector(selectCurrentUser);
	const [showFilters, setShowFilters] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	// Use recommended products if user is logged in, otherwise use all products
	//const products = currentUser ? recommendedProducts : allProducts;
	const isLoading = currentUser ? recommendationsLoading : loading;
	const currentError = currentUser ? recommendationsError : error;

	const [imageSearchResults, setImageSearchResults] = useState<any[]>([]);
	const [isImageSearchActive, setIsImageSearchActive] = useState(false);
	const products = isImageSearchActive
		? imageSearchResults
		: currentUser && recommendedProducts.length > 0
			? recommendedProducts
			: allProducts;
	// const products =
	// 	imageSearchResults.length > 0 ? imageSearchResults : reduxProducts;
	const [imageSearchAttempted, setImageSearchAttempted] = useState(false);
	const [isImageSearchLoading, setIsImageSearchLoading] = useState(false);

	// Check if mobile on mount and window resize
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	// Fetch user names for displaying in product cards
	const userNames = useAppSelector(selectUserNames);

	useEffect(() => {
		const sellerIds = [...new Set(products.map((p) => p.sellerId))];
		sellerIds.forEach((id) => {
			if (!userNames[id]) {
				dispatch(fetchUserNameById(id));
			}
		});
	}, [products, userNames, dispatch]);

	useEffect(() => {
		// Always fetch all products (needed for fallback and when not logged in)
		dispatch(fetchProducts());

		// Fetch recommendations if user is logged in
		if (currentUser?.id) {
			dispatch(fetchWishlistProducts(currentUser.id));
			dispatch(fetchRecommendations(currentUser.id));
		}

		dispatch(fetchAllUsers());
	}, [dispatch, currentUser?.id]);

	// Clear error after 5 seconds or on dismiss
	useEffect(() => {
		if (currentError) {
			const timer = setTimeout(() => dispatch(clearError()), 5000);
			return () => clearTimeout(timer);
		}
	}, [currentError, dispatch]);

	const handleProductClick = (product: (typeof products)[0]) => {
		dispatch(setSelectedProduct(product));
	};

	const handleImageSearchResults = (results: any[]) => {
		setImageSearchResults(results);
		setIsImageSearchActive(true);
		setImageSearchAttempted(true);
	};

	const renderError = () => {
		if (!currentError) return null;

		return (
			<div
				style={{
					backgroundColor: "#fee",
					border: "1px solid #fcc",
					borderRadius: 4,
					padding: 12,
					margin: 16,
					color: "#c33",
				}}
			>
				<p>
					<strong>Error:</strong> {currentError}
				</p>
				<button
					onClick={() => dispatch(clearError())}
					style={{
						marginTop: 8,
						padding: "4px 8px",
						backgroundColor: "#c33",
						color: "white",
						border: "none",
						borderRadius: 4,
						cursor: "pointer",
					}}
				>
					Dismiss
				</button>
				<button
					onClick={() => {
						if (currentUser) {
							dispatch(fetchRecommendations(currentUser.id));
						} else {
							dispatch(fetchProducts());
						}
					}}
					style={{
						marginTop: 8,
						marginLeft: 8,
						padding: "4px 8px",
						backgroundColor: "#0070f3",
						color: "white",
						border: "none",
						borderRadius: 4,
						cursor: "pointer",
					}}
				>
					Retry
				</button>
			</div>
		);
	};

	return (
		<div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
			{/* Error Display */}
			{renderError()}

			{/* Show recommendation indicator when logged in */}
			{currentUser && (
				<div
					style={{
						padding: "8px 16px",
						backgroundColor: "#e6f3ff",
						borderBottom: "1px solid #b3d9ff",
						color: "#0066cc",
						fontSize: "14px",
						textAlign: "center",
					}}
				>
					Showing personalized recommendations for you
				</div>
			)}

			{/* Mobile Filter Toggle */}
			{isMobile && (
				<div
					style={{
						padding: "8px 16px",
						borderBottom: "1px solid #ccc",
						backgroundColor: "#f9f9f9",
					}}
				>
					<button
						onClick={() => setShowFilters(!showFilters)}
						style={{
							padding: "8px 16px",
							backgroundColor: "#0070f3",
							color: "white",
							border: "none",
							borderRadius: 4,
							cursor: "pointer",
							fontSize: "14px",
						}}
					>
						{showFilters ? "Hide Filters" : "Show Filters"}
					</button>
				</div>
			)}

			{/* Main content */}
			<div
				style={{
					display: "flex",
					flex: 1,
					overflow: "hidden",
					flexDirection: isMobile ? "column" : "row",
				}}
			>
				{/* Sidebar */}
				<div
					style={{
						width: isMobile ? "100%" : "300px",
						minWidth: isMobile ? "auto" : "250px",
						maxWidth: isMobile ? "100%" : "350px",
						display: isMobile && !showFilters ? "none" : "flex",
						flexDirection: "column",
						overflowY: "auto",
						borderRight: isMobile ? "none" : "1px solid #ccc",
						borderBottom: isMobile ? "1px solid #ccc" : "none",
						maxHeight: isMobile ? "40vh" : "100%",
						backgroundColor: "#f9f9f9",
					}}
				>
					<HomeSearchBar
						onImageSearchResults={handleImageSearchResults}
						onClearImageSearch={() => {
							setImageSearchResults([]);
							setIsImageSearchActive(false);
							setImageSearchAttempted(false);
						}}
						isImageSearchActive={isImageSearchActive}
						setImageSearchLoading={setIsImageSearchLoading}
					/>

					<FilterCard />
				</div>

				{/* No results message */}
				{imageSearchAttempted && imageSearchResults.length === 0 && (
					<div
						style={{
							textAlign: "center",
							marginTop: 32,
							fontSize: 18,
							color: "#555",
						}}
					>
						No matching products found.
					</div>
				)}

				{/* Product display */}
				<ProductGrid
					products={products}
					loading={isLoading}
					error={currentError}
					sellerNames={userNames}
					onProductClick={handleProductClick}
					isMobile={isMobile}
					onRetry={() => {
						if (currentUser) {
							dispatch(fetchRecommendations(currentUser.id));
						} else {
							dispatch(fetchProducts());
						}
					}}
				/>
			</div>

			{/* Reusable Modal */}
			<ProductModal mode="buyer" />
		</div>
	);
}
