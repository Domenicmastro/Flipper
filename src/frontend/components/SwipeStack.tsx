import TinderCard from "react-tinder-card";
import SwipeCard from "./SwipeCard";
import type { RefObject } from "react";
import type { Product } from "@/types/Product";

interface SwipeDirection {
  (dir: "left" | "right", product: Product): void;
}

interface SwipeStackProps {
  products: Product[]; // already filtered
  currentIndex: number;
  childRefs: RefObject<any>[];
  imageHeight: string | number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  swipedIds: string[];
  onSwipeDirection: SwipeDirection;
  onCardClick?: (product: Product) => void;
}

export default function SwipeStack({
  products,
  childRefs,
  imageHeight,
  onSwipeDirection,
  onCardClick,
}: SwipeStackProps) {
  return (
    <>
      {products.map((product, index) => (
        <TinderCard
          ref={childRefs[index]}
          key={product.id ?? `fallback-${index}`}
          onSwipe={(dir) => onSwipeDirection(dir as "left" | "right", product)}
          preventSwipe={["up", "down"]}
        >
          <div onClick={() => onCardClick?.(product)}>
            <SwipeCard product={product} imageHeight={imageHeight} />
          </div>
        </TinderCard>
      ))}
    </>
  );
}
