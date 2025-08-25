import React from 'react';
import type { PriceCandleData } from '../shared';

interface SimplePriceChartProps {
  data: PriceCandleData[];
  currentPrice: number;
  width?: number;
  height?: number;
}

export const SimplePriceChart: React.FC<SimplePriceChartProps> = ({
  data,
  currentPrice,
  width,
  height,
}) => {
  // Use container dimensions or defaults - ensure they're numbers
  const containerWidth = typeof width === 'number' ? width : 400;
  const containerHeight = typeof height === 'number' ? height : 300;

  // Take last 60 data points for display
  const chartData = data.slice(-60);
  
  if (chartData.length < 2) {
    return (
      <div 
        className="bg-gray-800 rounded-lg flex items-center justify-center w-full h-full"
      >
        <div className="text-center text-white">
          <div className="text-3xl font-bold">${currentPrice.toFixed(2)}</div>
          <div className="text-sm opacity-70">BTC/USDT</div>
          <div className="text-xs opacity-50 mt-2">Collecting price data...</div>
        </div>
      </div>
    );
  }

  // Calculate price range for scaling (include high/low)
  const allPrices = chartData.flatMap(d => [d.open, d.high, d.low, d.close]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;
  
  // Calculate dimensions for candlesticks
  const padding = 20;
  const chartWidth = containerWidth - padding * 2;
  const chartHeight = containerHeight - padding * 2;
  const candleWidth = Math.max(3, Math.min(8, chartWidth / chartData.length - 2));
  
  // Create candlestick elements
  const candlesticks = chartData.map((candle, index) => {
    const x = padding + (index / (chartData.length - 1)) * chartWidth;
    const highY = padding + (1 - (candle.high - minPrice) / priceRange) * chartHeight;
    const lowY = padding + (1 - (candle.low - minPrice) / priceRange) * chartHeight;
    const openY = padding + (1 - (candle.open - minPrice) / priceRange) * chartHeight;
    const closeY = padding + (1 - (candle.close - minPrice) / priceRange) * chartHeight;
    
    const isGreen = candle.close >= candle.open;
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY) || 1;
    
    return {
      x,
      highY,
      lowY,
      bodyTop,
      bodyHeight,
      isGreen,
      candle
    };
  });

  // Calculate price change
  const firstPrice = chartData[0]?.close || currentPrice;
  const lastPrice = chartData[chartData.length - 1]?.close || currentPrice;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = ((priceChange / firstPrice) * 100);
  const isPositive = priceChange >= 0;

  return (
    <div 
      className="bg-gray-800 rounded-lg relative w-full h-full"
    >
      {/* Price Info */}
      <div className="absolute top-4 left-4 z-10 text-white">
        <div className="text-2xl font-bold">${currentPrice.toFixed(2)}</div>
        <div className="text-sm opacity-70">BTC/USDT</div>
        <div className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
        </div>
      </div>

      {/* Chart */}
      <svg width="100%" height="100%" viewBox={`0 0 ${containerWidth} ${containerHeight}`} className="absolute inset-0">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#374151" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Price level lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((level, i) => {
          const y = padding + level * chartHeight;
          const price = maxPrice - level * priceRange;
          return (
            <g key={i}>
              <line
                x1={padding}
                y1={y}
                x2={padding + chartWidth}
                y2={y}
                stroke="#374151"
                strokeWidth="0.5"
                strokeDasharray="2,2"
              />
              <text
                x={padding - 5}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#9ca3af"
              >
                ${price.toFixed(0)}
              </text>
            </g>
          );
        })}
        
        {/* Candlesticks */}
        {candlesticks.map((stick, index) => (
          <g key={index}>
            {/* Wick (high-low line) */}
            <line
              x1={stick.x}
              y1={stick.highY}
              x2={stick.x}
              y2={stick.lowY}
              stroke={stick.isGreen ? "#10b981" : "#ef4444"}
              strokeWidth="1.5"
            />
            
            {/* Body (open-close rectangle) */}
            <rect
              x={stick.x - candleWidth / 2}
              y={stick.bodyTop}
              width={candleWidth}
              height={Math.max(stick.bodyHeight, 2)}
              fill={stick.isGreen ? "#10b981" : "#ef4444"}
              stroke={stick.isGreen ? "#059669" : "#dc2626"}
              strokeWidth="0.5"
              rx="1"
            />
          </g>
        ))}
        
        {/* Current price indicator */}
        {chartData.length > 0 && (
          <circle
            cx={padding + chartWidth}
            cy={padding + (1 - (currentPrice - minPrice) / priceRange) * chartHeight}
            r="4"
            fill={isPositive ? "#10b981" : "#ef4444"}
            stroke="#ffffff"
            strokeWidth="2"
          />
        )}
      </svg>

      {/* Time labels */}
      <div className="absolute bottom-2 left-4 right-4 flex justify-between text-xs text-gray-400">
        <span>-60s</span>
        <span>Now</span>
      </div>
    </div>
  );
};
