import React from 'react';
import type { PriceCandleData } from '@predictor/shared';

interface CandlestickChartProps {
  data: PriceCandleData[];
  currentPrice?: number;
  width?: number;
  height?: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  currentPrice,
  width = 400,
  height = 300,
}) => {
  return (
    <div 
      className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center"
      style={{ width, height }}
    >
      <div className="text-white text-center">
        <div className="text-2xl font-bold">${currentPrice?.toFixed(2) || '50000.00'}</div>
        <div className="text-sm opacity-70">BTC/USDT</div>
        <div className="text-xs opacity-50 mt-2">Chart Coming Soon...</div>
      </div>
    </div>
  );
};