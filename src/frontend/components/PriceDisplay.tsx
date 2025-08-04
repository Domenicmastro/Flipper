import React from 'react';
import type { PriceComparison } from '@/types/Product';

interface PriceDisplayProps {
  basePrice: number;
  priceComparisons?: PriceComparison[];
  fontSize?: string;
  customColor?: string;
}

const getPriceColor = (count: number): string => {
  if (count === 0) return 'red';
  if (count === 1) return 'goldenrod';
  if (count === 2) return 'lightgreen';
  return 'green';
};

const PriceDisplay: React.FC<PriceDisplayProps> = ({
  basePrice,
  priceComparisons = [],
  fontSize = '1em',
  customColor,
}) => {
  const comparisonPrices = priceComparisons
    .map(p => parseFloat(p.price))
    .filter(p => !isNaN(p));

  const averageComparisonPrice =
    comparisonPrices.length > 0
      ? comparisonPrices.reduce((sum, val) => sum + val, 0) / comparisonPrices.length
      : null;

  const color = customColor ?? getPriceColor(comparisonPrices.length);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ color, fontWeight: 'bold', fontSize }}>
        ${basePrice.toFixed(2)}
      </span>
      {averageComparisonPrice !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',}}>
          <span
            style={{
              textDecoration: 'line-through',
              color: '#888',
              fontSize: `calc(${fontSize} * 0.85)`,
            }}
          >
            ${averageComparisonPrice.toFixed(2)}
          </span>
          <span style={{
                  backgroundColor: "#fffbea",
                  color: "#b7791f",
                  fontSize: "0.65em",
                  fontWeight: 600,
                  padding: "1px 5px",
                  borderRadius: "4px",
                  marginLeft: "2px"
                }}>
            Save {Math.floor((1 - (basePrice / averageComparisonPrice)) * 100)}%!
          </span>
        </div>
      )}
    </div>
  );
};

export default PriceDisplay;