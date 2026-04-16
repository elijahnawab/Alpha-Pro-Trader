import React, { useEffect, useRef, useState } from 'react';
import { 
  Settings,
  Eye,
  EyeOff,
  TrendingUp,
  Info
} from 'lucide-react';
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
  volume?: number;
}

interface CandlestickChartProps {
  data: CandleData[];
  emaShort?: number;
  emaLong?: number;
  onEmaShortChange?: (val: string) => void;
  onEmaLongChange?: (val: string) => void;
  showMacd?: boolean;
  macdFast?: number;
  macdSlow?: number;
  macdSignal?: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ 
  data, 
  emaShort = 9,
  emaLong = 21,
  onEmaShortChange,
  onEmaLongChange,
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
  const [showEma, setShowEma] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [legendData, setLegendData] = useState<CandleData | null>(null);

  // EMA Helper
  const calculateEMA = (values: number[], period: number) => {
    const n = values.length;
    const series: number[] = new Array(n).fill(0);
    if (n === 0 || isNaN(period) || period <= 0) return series;
    
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
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          labelBackgroundColor: '#38bdf8',
        },
        horzLine: {
          labelBackgroundColor: '#38bdf8',
        },
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
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // EMA Series
    const emaShortSeries = chart.addSeries(LineSeries, {
      color: '#38bdf8',
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });
    emaShortSeriesRef.current = emaShortSeries;

    const emaLongSeries = chart.addSeries(LineSeries, {
      color: '#f472b6',
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
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
          vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        timeScale: {
          visible: false,
        },
        handleScroll: false,
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
        if (range && macdChart) {
          macdChart.timeScale().setVisibleRange(range);
        }
      });
    }

    // Subscribe to crosshair move for legend
    chart.subscribeCrosshairMove((param) => {
      if (param.time && param.seriesData.size > 0) {
        const candle = param.seriesData.get(chartType === 'CANDLE' ? candlestickSeries : ohlcSeries) as any;
        if (candle) {
          setLegendData({
            time: Number(param.time) * 1000,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          });
        }
      } else {
        setLegendData(null);
      }
    });

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
      chartRef.current = null;
      macdChartRef.current = null;
      candlestickSeriesRef.current = null;
      ohlcSeriesRef.current = null;
      volumeSeriesRef.current = null;
      emaShortSeriesRef.current = null;
      emaLongSeriesRef.current = null;
      macdLineSeriesRef.current = null;
      signalLineSeriesRef.current = null;
      histogramSeriesRef.current = null;
    };
  }, [showMacd, chartType]);

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return;

    const formattedData: CandlestickData[] = data
      .filter(d => d && !isNaN(d.open) && !isNaN(d.high) && !isNaN(d.low) && !isNaN(d.close))
      .map(d => ({
        time: (d.time / 1000) as Time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

    const volumeData = data
      .filter(d => d && !isNaN(d.time))
      .map(d => ({
        time: (d.time / 1000) as Time,
        value: d.volume || 0,
        color: d.close >= d.open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
      }));

    if (chartType === 'CANDLE') {
      candlestickSeriesRef.current?.setData(formattedData);
      ohlcSeriesRef.current?.setData([]);
    } else {
      candlestickSeriesRef.current?.setData([]);
      ohlcSeriesRef.current?.setData(formattedData);
    }

    volumeSeriesRef.current?.setData(volumeData);

    const closes = data.map(d => d.close);
    const emaShortValues = calculateEMA(closes, emaShort);
    const emaLongValues = calculateEMA(closes, emaLong);

    const emaShortData: LineData[] = showEma ? data.map((d, i) => ({
      time: (d.time / 1000) as Time,
      value: emaShortValues[i],
    })) : [];

    const emaLongData: LineData[] = showEma ? data.map((d, i) => ({
      time: (d.time / 1000) as Time,
      value: emaLongValues[i],
    })) : [];

    emaShortSeriesRef.current?.setData(emaShortData);
    emaLongSeriesRef.current?.setData(emaLongData);

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

    chartRef.current?.timeScale().fitContent();
  }, [data, chartType, emaShort, emaLong, showMacd, macdFast, macdSlow, macdSignal, showEma]);

  const lastCandle = data[data.length - 1];
  const displayCandle = legendData || lastCandle;

  return (
    <div className="w-full h-full flex flex-col relative group/chart">
      {/* Chart Header / Controls */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-3">
          {/* Chart Type Switcher */}
          <div className="flex bg-white/5 rounded-xl p-1 border border-white/10 shadow-inner">
            <button 
              onClick={() => setChartType('CANDLE')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200 ${chartType === 'CANDLE' ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
            >
              Candles
            </button>
            <button 
              onClick={() => setChartType('OHLC')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200 ${chartType === 'OHLC' ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
            >
              OHLC
            </button>
          </div>

          <div className="h-6 w-px bg-white/10 mx-1" />

          {/* EMA Toggle */}
          <button 
            onClick={() => setShowEma(!showEma)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 ${showEma ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}
          >
            {showEma ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span className="text-[10px] font-bold uppercase tracking-wider">EMA</span>
          </button>

          {/* Settings Toggle */}
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl border transition-all duration-200 ${showSettings ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/5'}`}
          >
            <Settings className={`w-4 h-4 ${showSettings ? 'animate-spin-slow' : ''}`} />
          </button>

          {/* EMA Config Inputs */}
          {showSettings && (
            <div className="flex items-center gap-4 ml-2 p-1.5 bg-white/5 border border-white/10 rounded-xl animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                <input 
                  type="number"
                  value={emaShort}
                  onChange={(e) => onEmaShortChange?.(e.target.value)}
                  className="w-14 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-sky-500/50 transition-colors"
                  placeholder="Short"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#f472b6] shadow-[0_0_8px_rgba(244,114,182,0.5)]" />
                <input 
                  type="number"
                  value={emaLong}
                  onChange={(e) => onEmaLongChange?.(e.target.value)}
                  className="w-14 bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-mono focus:outline-none focus:border-sky-500/50 transition-colors"
                  placeholder="Long"
                />
              </div>
            </div>
          )}
        </div>

        {/* Legend / OHLC Display */}
        {displayCandle && (
          <div className="flex items-center gap-4 text-[10px] font-mono">
            <div className="flex gap-3">
              <span className="text-white/30 uppercase">O</span>
              <span className="text-white/80">{displayCandle.open.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-white/30 uppercase">H</span>
              <span className="text-emerald-400">{displayCandle.high.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-white/30 uppercase">L</span>
              <span className="text-rose-400">{displayCandle.low.toFixed(2)}</span>
            </div>
            <div className="flex gap-3">
              <span className="text-white/30 uppercase">C</span>
              <span className={displayCandle.close >= displayCandle.open ? 'text-emerald-400' : 'text-rose-400'}>
                {displayCandle.close.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Chart Container */}
      <div className="flex-1 relative min-h-0">
        <div ref={chartContainerRef} className="absolute inset-0 w-full h-full" />
        
        {/* Indicators Legend (Overlay) */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
          {showEma && (
            <div className="flex flex-col gap-1.5 bg-black/40 backdrop-blur-sm p-2 rounded-lg border border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-0.5 bg-[#38bdf8] rounded-full" />
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">EMA {emaShort}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-0.5 bg-[#f472b6] rounded-full" />
                <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">EMA {emaLong}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MACD Section */}
      {showMacd && (
        <div className="h-32 mt-4 relative border-t border-white/5 pt-4">
          <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded border border-white/5 pointer-events-none">
            <TrendingUp className="w-3 h-3 text-sky-400/50" />
            <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">MACD ({macdFast}, {macdSlow}, {macdSignal})</span>
          </div>
          <div ref={macdContainerRef} className="w-full h-full" />
        </div>
      )}
    </div>
  );
};

