import React from "react";
import { FaHeart } from "react-icons/fa";
import type { Product } from "@/types/Product";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../redux/store";
import {
	addProductToWishlist,
	removeProductFromWishlist,
} from "../redux/slices/userSlice";
import { PriceDisplay } from "../components";
import "./HomeProductCard.css";
import SellerDisplay from "./SellerDisplay";
import { ConditionLabel } from "../components";

interface HomeProductCardProps {
	product: Product;
	onClick?: () => void;
	sellerName: string;
	mode?: "buyer" | "seller" | "purchased";
}

function HomeProductCard({
	product,
	onClick,
	mode = "buyer",
}: HomeProductCardProps) {
	const user = useSelector((state: RootState) => state.users.currentUser);
	const dispatch = useDispatch<AppDispatch>();

	const favorited = !!user?.wishlist?.includes(product.id);

	// Hide heart button if:
	// 1. User is viewing their own products (seller mode)
	// 2. User is viewing their purchased items (purchased mode)
	// 3. The product belongs to the current user
	const shouldShowHeart = mode === "buyer" && user?.id !== product.sellerId;

	const toggleFavorite = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!user) {
			alert("Please log in to favorite items.");
			return;
		}

		if (favorited) {
			dispatch(
				removeProductFromWishlist({ userId: user.id, productId: product.id })
			);
		} else {
			dispatch(
				addProductToWishlist({ userId: user.id, productId: product.id })
			);
		}
	};

	const primaryImage = product.images?.[0] ?? "";
	const secondaryImage = product.images?.[1] ?? product.images?.[0] ?? "";

	return (
		<div
			className="product-card"
			style={{ position: "relative", cursor: "pointer" }}
			onClick={onClick}
		>
			<div className="image-stack">
				<img src={primaryImage} className="product-image base-image" />
				<img src={secondaryImage} className="product-image hover-image" />
			</div>

			{shouldShowHeart && (
				<button
					className={`heart-button ${favorited ? "favorited" : ""}`}
					aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
					onClick={toggleFavorite}
					type="button"
				>
					<FaHeart />
				</button>
			)}

			<div className="product-info">
				<div className="product-name" title={product.name}>
					{product.name || "Product Name"}
				</div>
				<ConditionLabel condition={product.condition} />
				<div className="product-meta vertical">
					<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
						<PriceDisplay
							basePrice={
								product.isAuction
									? (product.currentBid ?? product.startingBid ?? 0)
									: (product.price ?? 0)
							}
							priceComparisons={product.priceComparisons}
							fontSize="1em"
							customColor={product.isAuction ? "#b7791f" : undefined}
						/>
						{product.isAuction && (
							<span
								style={{
									backgroundColor: "#fffbea",
									color: "#b7791f",
									fontSize: "0.65em",
									fontWeight: 600,
									padding: "1px 5px",
									borderRadius: "4px",
									marginLeft: "2px",
								}}
							>
								Auction
							</span>
						)}
					</div>

					<SellerDisplay sellerId={product.sellerId} asLink={false} />
				</div>
			</div>
		</div>
	);
}

export default HomeProductCard;
