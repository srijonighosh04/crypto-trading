"use client";

import React, { useEffect, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, UTCTimestamp } from "lightweight-charts";
import { OhlcEntry } from "@/types/coingecko";

interface CandlestickChartProps {
  data: OhlcEntry[];
}

export default function CandlestickChart({ data }: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create the lightweight-charts instance
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#121420" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#1f2235" },
        horzLines: { color: "#1f2235" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        borderColor: "#1f2235",
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: "#1f2235",
      },
      crosshair: {
        vertLine: {
          color: "#6366f1",
          width: 1,
          style: 3, // dashed
          labelBackgroundColor: "#6366f1",
        },
        horzLine: {
          color: "#6366f1",
          width: 1,
          style: 3, // dashed
          labelBackgroundColor: "#6366f1",
        },
      },
    });

    chartRef.current = chart;

    // Add the candlestick series using v5+ unified addSeries method
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    seriesRef.current = candlestickSeries;

    // Format, deduplicate, and sort the data for lightweight-charts
    const seenTimes = new Set<number>();
    const formattedData = data
      .map((entry) => ({
        time: Math.floor(entry[0] / 1000) as UTCTimestamp, // convert timestamp from ms to seconds
        open: entry[1],
        high: entry[2],
        low: entry[3],
        close: entry[4],
      }))
      .filter((item) => {
        if (seenTimes.has(item.time)) {
          return false;
        }
        seenTimes.add(item.time);
        return true;
      })
      .sort((a, b) => a.time - b.time);

    candlestickSeries.setData(formattedData);

    // Automatically fit the data in the timescale viewport
    chart.timeScale().fitContent();

    // Handle container resize dynamically using ResizeObserver
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    // Clean up instances on component unmount
    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data]);

  return (
    <div className="w-full relative rounded-xl overflow-hidden border border-border bg-card p-4">
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
