import React, { useEffect, useRef, useMemo, useState } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  LineData, 
  Time,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  BarSeries,
  LineSeries,
  HistogramSeries
} from 'lightweight-charts';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  data: CandleData[];
  emaShort?: number;
  emaLong?: number;
  showMacd?: boolean;
  macdFast?: number;
  macdSlow?: number;
  macdSignal?: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ 
  data, 
  emaShort = 5,
  emaLong = 13,
  showMacd = true,
  macdFast = 12,
  macdSlow = 26,
  macdSignal = 9
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const ohlcSeriesRef = useRef<ISeriesApi<"Bar"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const emaShortSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const emaLongSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdLineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const signalLineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const histogramSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [chartType, setChartType] = useState<'CANDLE' | 'OHLC'>('CANDLE');

  // EMA Helper
  const calculateEMA = (values: number[], period: number) => {
    const n = values.length;
    const series: number[] = new Array(n).fill(0);
    if (n === 0) return series;
    
    const k = 2 / (period + 1);
    let ema = values[0];
    series[0] = ema;
    
    for (let i = 1; i < n; i++) {
      ema = values[i] * k + ema * (1 - k);
      series[i] = ema;
    }
    return series;
  };

  // MACD Helper
  const calculateMACD = (closes: number[], fast: number, slow: number, signal: number) => {
    const emaFast = calculateEMA(closes, fast);
    const emaSlow = calculateEMA(closes, slow);
    const macdLine = emaFast.map((f, i) => f - emaSlow[i]);
    const signalLine = calculateEMA(macdLine, signal);
    const histogram = macdLine.map((m, i) => m - signalLine[i]);
    return { macdLine, signalLine, histogram };
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.5)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    // Main Series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    candlestickSeriesRef.current = candlestickSeries;

    const ohlcSeries = chart.addSeries(BarSeries, {
      upColor: '#10b981',
      downColor: '#ef4444',
    });
    ohlcSeriesRef.current = ohlcSeries;

    // Volume Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // set as an overlay
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8, // highest point of the series will be 80% away from the top
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // EMA Series
    const emaShortSeries = chart.addSeries(LineSeries, {
      color: '#38bdf8', // Sky 400
      lineWidth: 1,
      priceLineVisible: false,
    });
    emaShortSeriesRef.current = emaShortSeries;

    const emaLongSeries = chart.addSeries(LineSeries, {
      color: '#f472b6', // Pink 400
      lineWidth: 1,
      priceLineVisible: false,
    });
    emaLongSeriesRef.current = emaLongSeries;

    // MACD Chart
    let macdChart: IChartApi | null = null;
    if (showMacd && macdContainerRef.current) {
      macdChart = createChart(macdContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: 'transparent' },
          textColor: 'rgba(255, 255, 255, 0.5)',
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        timeScale: {
          visible: false, // Hide time scale for MACD chart
        },
        handleScroll: false, // Scroll is handled by main chart
        handleScale: false,
      });
      macdChartRef.current = macdChart;

      const macdLineSeries = macdChart.addSeries(LineSeries, {
        color: '#38bdf8',
        lineWidth: 1,
        priceLineVisible: false,
      });
      macdLineSeriesRef.current = macdLineSeries;

      const signalLineSeries = macdChart.addSeries(LineSeries, {
        color: '#fbbf24',
        lineWidth: 1,
        priceLineVisible: false,
      });
      signalLineSeriesRef.current = signalLineSeries;

      const histogramSeries = macdChart.addSeries(HistogramSeries, {
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
      });
      histogramSeriesRef.current = histogramSeries;

      // Sync charts
      chart.timeScale().subscribeVisibleTimeRangeChange((range) => {
        macdChart?.timeScale().setVisibleRange(range!);
      });
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
      if (macdContainerRef.current && macdChart) {
        macdChart.applyOptions({
          width: macdContainerRef.current.clientWidth,
          height: macdContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      macdChart?.remove();
    };
  }, [showMacd]);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const formattedData: CandlestickData[] = data.map(d => ({
      time: (d.time / 1000) as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumeData = data.map(d => ({
      time: (d.time / 1000) as Time,
      value: (d as any).volume || 0,
      color: d.close >= d.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
    }));

    // Toggle visibility based on chartType
    if (chartType === 'CANDLE') {
      candlestickSeriesRef.current?.setData(formattedData);
      ohlcSeriesRef.current?.setData([]);
    } else {
      candlestickSeriesRef.current?.setData([]);
      ohlcSeriesRef.current?.setData(formattedData);
    }

    volumeSeriesRef.current?.setData(volumeData);

    // Calculate and set EMA data
    const closes = data.map(d => d.close);
    const emaShortValues = calculateEMA(closes, emaShort);
    const emaLongValues = calculateEMA(closes, emaLong);

    const emaShortData: LineData[] = data.map((d, i) => ({
      time: (d.time / 1000) as Time,
      value: emaShortValues[i],
    }));

    const emaLongData: LineData[] = data.map((d, i) => ({
      time: (d.time / 1000) as Time,
      value: emaLongValues[i],
    }));

    emaShortSeriesRef.current?.setData(emaShortData);
    emaLongSeriesRef.current?.setData(emaLongData);

    // MACD Data
    if (showMacd && macdChartRef.current) {
      const { macdLine, signalLine, histogram } = calculateMACD(closes, macdFast, macdSlow, macdSignal);
      
      const macdLineData: LineData[] = data.map((d, i) => ({
        time: (d.time / 1000) as Time,
        value: macdLine[i],
      }));

      const signalLineData: LineData[] = data.map((d, i) => ({
        time: (d.time / 1000) as Time,
        value: signalLine[i],
      }));

      const histogramData = data.map((d, i) => ({
        time: (d.time / 1000) as Time,
        value: histogram[i],
        color: histogram[i] >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      }));

      macdLineSeriesRef.current?.setData(macdLineData);
      signalLineSeriesRef.current?.setData(signalLineData);
      histogramSeriesRef.current?.setData(histogramData);
    }

    chartRef.current.timeScale().fitContent();
  }, [data, chartType, emaShort, emaLong, showMacd, macdFast, macdSlow, macdSignal]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2 px-2">
        <button 
          onClick={() => setChartType('CANDLE')}
          className={`px-2 py-1 text-[10px] rounded border ${chartType === 'CANDLE' ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'border-white/10 text-white/40'}`}
        >
          Candles
        </button>
        <button 
          onClick={() => setChartType('OHLC')}
          className={`px-2 py-1 text-[10px] rounded border ${chartType === 'OHLC' ? 'bg-sky-500/20 border-sky-500 text-sky-400' : 'border-white/10 text-white/40'}`}
        >
          OHLC
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 bg-[#38bdf8]" />
            <span className="text-[10px] text-white/40">EMA {emaShort}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-0.5 bg-[#f472b6]" />
            <span className="text-[10px] text-white/40">EMA {emaLong}</span>
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} className="flex-[3] w-full" />
      {showMacd && (
        <div className="w-full h-px bg-white/5 my-2" />
      )}
      {showMacd && (
        <div ref={macdContainerRef} className="flex-1 w-full" />
      )}
    </div>
  );
};
