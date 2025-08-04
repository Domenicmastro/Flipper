import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ProductGrid,
  FilterCard,
  HomeSearchBar,
  ProductModal,
} from "../components";
import { type Product } from "../../types";
import { Link } from "react-router-dom";
import {
  fetchWishlistProducts,
  selectCurrentUser,
  selectWishlistProducts,
  selectUserError
} from "../redux/slices/userSlice";
import { setSelectedProduct } from "../redux/slices/productSlice";
import { useAppDispatch } from "../redux/hooks";
import type { AppDispatch } from "../redux/store";

export default function Wishlist() {
  const dispatch = useDispatch<AppDispatch>();
  const appDispatch = useAppDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const wishlistProducts = useSelector(selectWishlistProducts);
  const error = useSelector(selectUserError);

  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (currentUser !== null) {
      setIsUserLoaded(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.wishlist?.length) {
      dispatch(fetchWishlistProducts(currentUser.id));
    }
  }, [dispatch, currentUser?.wishlist?.join(",")]);


  const handleProductClick = (product: Product) => {
    appDispatch(setSelectedProduct(product));
  };

  const handleRetry = () => {
    if (currentUser?.id) {
      dispatch(fetchWishlistProducts(currentUser.id));
    }
  };

  // Create seller names object for ProductGrid
  const sellerNames = wishlistProducts.reduce((acc, product) => {
    acc[product.sellerId] = product.sellerId; // You might want to fetch actual seller names
    return acc;
  }, {} as Record<string, string>);

  // Custom error message for wishlist-specific scenarios
  const getErrorMessage = () => {
    if (!currentUser) {
      return "Please log in to view your wishlist.";
    }
    if (error) {
      return error;
    }
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Mobile Filter Toggle */}
      {isMobile && (
        <div style={{ 
          padding: "8px 16px", 
          borderBottom: "1px solid #ccc",
          backgroundColor: "#f9f9f9"
        }}>
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
      <div style={{ 
        display: "flex", 
        flex: 1, 
        overflow: "hidden",
        flexDirection: isMobile ? "column" : "row"
      }}>
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
          <HomeSearchBar />
          <FilterCard />
        </div>

        {/* Product display using ProductGrid */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {!isUserLoaded ? (
            <ProductGrid
              products={[]}
              loading={true}
              error={null}
              sellerNames={{}}
              onProductClick={handleProductClick}
              isMobile={isMobile}
              onRetry={handleRetry}
            />
          ) : !currentUser ? (
            <div
              style={{
                textAlign: "center",
                padding: isMobile ? "20px" : "40px",
                color: "#666",
              }}
            >
              <p style={{ fontSize: isMobile ? "14px" : "16px" }}>
                Please log in to view your wishlist.
              </p>
            </div>
          ) : wishlistProducts.length === 0 && !error ? (
            <div
              style={{
                textAlign: "center",
                padding: isMobile ? "20px" : "40px",
                color: "#666",
              }}
            >
              <p style={{ fontSize: isMobile ? "14px" : "16px" }}>
                Your wishlist is empty.
              </p>
              <Link
                to="/"
                style={{
                  color: "#0070f3",
                  textDecoration: "none",
                  fontWeight: "bold",
                  fontSize: isMobile ? "14px" : "16px",
                }}
              >
                Browse products to add to your wishlist
              </Link>
            </div>
          ) : (
            <ProductGrid
              products={wishlistProducts}
              loading={false}
              error={getErrorMessage()}
              sellerNames={sellerNames}
              onProductClick={handleProductClick}
              isMobile={isMobile}
              onRetry={handleRetry}
            />
          )}
        </div>
      </div>

      {/* Reusable Modal - same as Home page */}
      <ProductModal mode="buyer" />
    </div>
  );
}