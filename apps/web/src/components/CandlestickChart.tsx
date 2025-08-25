import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import type { PriceCandleData } from '../shared';

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
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current || hasError) return;

    try {
      // Create chart with proper options
      const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1a1a2e' },
        textColor: '#ffffff',
      },
      width,
      height,
      grid: {
        vertLines: { color: '#2a2a3e' },
        horzLines: { color: '#2a2a3e' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#485c7b',
      },
      timeScale: {
        borderColor: '#485c7b',
        timeVisible: true,
        secondsVisible: true,
      },
    });

    // Add candlestick series (v5 API)
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Set initial data if available
    if (data.length > 0) {
      try {
        const chartData = data.map(candle => ({
          time: Math.floor(candle.time / 1000), // Convert to seconds for lightweight-charts
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        })).filter(candle => 
          candle.open > 0 && candle.high > 0 && candle.low > 0 && candle.close > 0
        );

        if (chartData.length > 0) {
          candlestickSeries.setData(chartData);
        }
      } catch (error) {
        console.warn('Error setting chart data:', error);
      }
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
      };
    } catch (error) {
      console.error('Error creating chart:', error);
      setHasError(true);
    }
  }, [width, height, data, hasError]);

  // Update data when it changes
  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      try {
        const chartData = data.map(candle => ({
          time: Math.floor(candle.time / 1000), // Convert to seconds
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        })).filter(candle => 
          candle.open > 0 && candle.high > 0 && candle.low > 0 && candle.close > 0
        );

        if (chartData.length > 0) {
          seriesRef.current.setData(chartData);
        }
      } catch (error) {
        console.warn('Error updating chart data:', error);
      }
    }
  }, [data]);

  if (hasError) {
    return (
      <div 
        className="w-full h-full bg-gray-800 rounded-lg relative flex items-center justify-center"
        style={{ width, height }}
      >
        <div className="text-center text-white">
          <div className="text-2xl font-bold">${currentPrice?.toFixed(2) || '---'}</div>
          <div className="text-sm opacity-70">BTC/USDT</div>
          <div className="text-xs opacity-50 mt-2">Chart temporarily unavailable</div>
          <button 
            onClick={() => setHasError(false)}
            className="mt-2 px-3 py-1 bg-blue-500 rounded text-xs hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={chartContainerRef}
      className="w-full h-full bg-gray-800 rounded-lg relative"
      style={{ width, height }}
    >
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <div className="text-center">
            <div className="text-2xl font-bold">${currentPrice?.toFixed(2) || '---'}</div>
            <div className="text-sm opacity-70">BTC/USDT</div>
            <div className="text-xs opacity-50 mt-2">Loading chart data...</div>
          </div>
        </div>
      )}
    </div>
  );
};