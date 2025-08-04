import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { fetchUserById, selectUserById } from "../redux/slices/userSlice";
import { FaStar, FaRegStar, FaStarHalfAlt } from "react-icons/fa";
import type { Review } from "../../types/User";

interface SellerDisplayProps {
  sellerId: string;
  asLink?: boolean;
  size?: "small" | "large";
  onClick?: () => void;
}

const SellerDisplay: React.FC<SellerDisplayProps> = ({
  sellerId,
  asLink = true,
  size = "small",
  onClick,
}) => {
  const dispatch = useAppDispatch();
  const seller = useAppSelector((state) => selectUserById(state, sellerId));

  useEffect(() => {
    if (!seller) {
      dispatch(fetchUserById(sellerId));
    }
  }, [sellerId, seller, dispatch]);

  if (!seller) return null;

  const { name, image, reviews } = seller;

  const average =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: Review) => sum + r.score, 0) / reviews.length
      : null;

  const renderStars = (avg: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (avg >= i) stars.push(<FaStar key={i} color="gold" size={iconSize} />);
      else if (avg >= i - 0.5) stars.push(<FaStarHalfAlt key={i} color="gold" size={iconSize} />);
      else stars.push(<FaRegStar key={i} color="lightgray" size={iconSize} />);
    }
    return stars;
  };

  // Size variants
  const avatarSize = size === "large" ? 48 : 24;
  const fontSize = size === "large" ? "1.3rem" : "0.85rem";
  const iconSize = size === "large" ? 26 : 12;

  const content = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        textDecoration: "none",
        color: "inherit",
        fontSize,
      }}
    >
      <img
        src={image}
        alt={name}
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: "50%",
          objectFit: "cover",
        }}
      />
      <span style={{ fontWeight: 500 }}>{name}</span>
      {average !== null && (
        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          {renderStars(average)}
        </div>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link
        to={`/user/${sellerId}`}
        onClick={onClick}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        {content}
      </Link>
    );
  }

  return content;
};

export default SellerDisplay;
