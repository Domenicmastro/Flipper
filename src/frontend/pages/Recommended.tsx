// for the purpose of verifying recommendations, will merge this into main page later

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  HomeProductCard,
  FilterCard,
  HomeSearchBar,
} from "../components";
import { type Product } from "../../types";
import { useMediaQuery } from "react-responsive";
import { Link } from "react-router-dom";

import {
    selectCurrentUser,
    selectUserError
} from "../redux/slices/userSlice"

import {
  fetchRecommendations,
  selectRecommendations
} from "../redux/slices/recommendationsSlice";

import type { AppDispatch } from "../redux/store";

export default function Recommendations() {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector(selectCurrentUser);
  const recommendations = useSelector(selectRecommendations);

  console.log("Recommendations in component:", recommendations);
  const error = useSelector(selectUserError);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  useEffect(() => {
    if (currentUser !== null) {
      setIsUserLoaded(true);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?.id) {
      dispatch(fetchRecommendations(currentUser.id));
    }
  }, [dispatch, currentUser?.id]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Main content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div
          style={{
            width: 300,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            borderRight: "1px solid #ccc",
          }}
        >
          <HomeSearchBar />
          <FilterCard />
        </div>

        {/* Product display */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
            alignContent: "start",
          }}
        >
          {!isUserLoaded ? (
            <p>Loading user...</p>
          ) : error ? (
            <p style={{ color: "red" }}>Error: {error}</p>
          ) : !currentUser ? (
            <p>Please log in to view your recommendations.</p>
          ) : recommendations.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>
              <p>No recommendations available.</p>
              <Link
                to="/"
                style={{
                  color: "#0070f3",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                Browse products
              </Link>
            </div>
          ) : (
            recommendations.map((product, index) => (
              <HomeProductCard
                key={product.id || `product-${index}`}
                product={product}
                sellerName={product.sellerId}
                onClick={() => setSelectedProduct(product)}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal popup */}
      {selectedProduct && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
          onClick={() => setSelectedProduct(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              width: "100%",
              maxWidth: 800,
              padding: 24,
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: 24,
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
              }}
            >
              &times;
            </button>

            {/* Left: Image */}
            <div style={{ flex: 1 }}>
              <img
                src={selectedProduct.images[0] || "/NoImage.png"}
                alt={selectedProduct.name}
                style={{
                  width: "100%",
                  borderRadius: 8,
                  objectFit: "cover",
                  maxHeight: 400,
                }}
              />
            </div>

            {/* Right: Info */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.8rem", marginBottom: 12 }}>
                  {selectedProduct.name}
                </h2>
                <p style={{ marginBottom: 12 }}>{selectedProduct.description}</p>
                <p
                  style={{
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                    marginBottom: 12,
                  }}
                >
                  ${selectedProduct.price.toFixed(2)}
                </p>
                <p style={{ fontStyle: "italic", color: "#555" }}>
                  Seller: {selectedProduct.sellerId || "Unknown"}
                </p>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <Link
                  to={`/purchase/${selectedProduct.id}`}
                  style={{
                    flex: 1,
                    display: "inline-block",
                    textAlign: "center",
                    backgroundColor: "#0070f3",
                    color: "white",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontWeight: "bold",
                  }}
                >
                  Purchase
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
