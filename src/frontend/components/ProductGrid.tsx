import React from "react";
import type { Product } from "@/types/Product";
import LoadingWidgit from "./LoadingWidgit";
import HomeProductCard from "./HomeProductCard";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  error?: string | null;
  mode?: "buyer" | "seller" | "purchased";
  sellerNames?: Record<string, string>;
  onProductClick?: (product: Product) => void;
  isMobile?: boolean;
  onRetry?: () => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  error = null,
  sellerNames = {},
  mode = "buyer",
  onProductClick,
  isMobile = false,
  onRetry,
}) => {
  const handleClick = (product: Product) => {
    if (onProductClick) onProductClick(product);
  };

  if (error) {
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
          <strong>Error:</strong> {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginTop: 8,
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
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <LoadingWidgit text="Loading Products..."/>
    );
  }

  if (products.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: isMobile ? "20px" : "40px",
          color: "#666",
        }}
      >
        <p style={{ fontSize: isMobile ? "14px" : "16px" }}>
          No products found matching your criteria.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: isMobile ? "14px" : "16px",
            }}
          >
            Refresh Products
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="product-grid"
      style={{
        display: "grid",
        overflow: "auto",
        padding: isMobile ? "12px" : "16px",
        gridTemplateColumns: isMobile
          ? "repeat(auto-fill, minmax(240px, 1fr))"
          : "repeat(auto-fill, minmax(280px, 1fr))",
        gap: isMobile ? "16px" : "24px",
        alignContent: "start",
        gridAutoRows: "max-content",
        alignItems: "start",
        justifyContent: "center", // Center the grid when there are few items
      }}
    >
      {products.map((product, index) => product.status === "For Sale" && (
        <HomeProductCard
          key={product.id ?? `fallback-key-${index}`}
          product={product}
          mode={mode}
          sellerName={sellerNames[product.sellerId] || "Unknown"}
          onClick={() => handleClick(product)}
        />
      ))}
    </div>
  );
};

export default ProductGrid;