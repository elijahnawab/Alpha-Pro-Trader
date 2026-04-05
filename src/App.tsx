import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  TrendingUp, 
  LogOut, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Play, 
  Square,
  Activity,
  Bot,
  ShieldCheck,
  AlertCircle,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { CandlestickChart } from './components/CandlestickChart';

const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block group" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 5, x: '-50%' }}
            className="absolute z-50 bottom-full left-1/2 mb-2 px-3 py-2 bg-black/95 border border-white/10 rounded-lg text-[10px] text-white/80 w-48 text-center shadow-2xl pointer-events-none"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/95" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface Account {
  id: string;
  label: string;
  enabled: boolean;
  futures?: {
    walletBalance: number;
    availableBalance: number;
    unrealizedProfit: number;
    positions?: {
      symbol: string;
      amount: number;
      entryPrice: number;
      markPrice: number;
      unrealizedProfit: number;
      leverage: number;
      marginType: string;
      liquidationPrice: number;
      pnlPct: number;
    }[];
  };
  spot?: {
    dollarTotal: number;
    dollarByAsset: Record<string, number>;
  };
  errFut?: string;
  errSpot?: string;
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('alpha_token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [symbols, setSymbols] = useState<any[]>([]);
  const [market, setMarket] = useState('FUTURES');
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [tpPct, setTpPct] = useState('1.0');
  const [slPct, setSlPct] = useState('0.5');
  const [autoMode, setAutoMode] = useState(false);
  const [emaShort, setEmaShort] = useState('5');
  const [emaLong, setEmaLong] = useState('13');
  const [tradeVol, setTradeVol] = useState('10');
  const [crossCond, setCrossCond] = useState<'UP' | 'DOWN'>('UP');
  const [maxDuration, setMaxDuration] = useState('1');
  const [trailingStop, setTrailingStop] = useState('5');
  const [useRsi, setUseRsi] = useState(false);
  const [useRsiDivergence, setUseRsiDivergence] = useState(false);
  const [rsiPeriod, setRsiPeriod] = useState('14');
  const [rsiOverbought, setRsiOverbought] = useState('70');
  const [rsiOversold, setRsiOversold] = useState('30');
  const [useMacd, setUseMacd] = useState(false);
  const [macdFast, setMacdFast] = useState('12');
  const [macdSlow, setMacdSlow] = useState('26');
  const [macdSignal, setMacdSignal] = useState('9');
  const [currentMacd, setCurrentMacd] = useState({ macdLine: 0, signalLine: 0, histogram: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState<string>('0.00');
  const [prevPrice, setPrevPrice] = useState<string>('0.00');
  const [openSection, setOpenSection] = useState<'BASIC' | 'RISK' | 'INDICATORS'>('BASIC');
  const [status, setStatus] = useState({ msg: 'Ready', ok: true });
  const [loading, setLoading] = useState(false);
  const [liveOrders, setLiveOrders] = useState(false);
  const [tradeLimits, setTradeLimits] = useState({ min: 5, max: 10 });
  const [botLogs, setBotLogs] = useState<{ time: number; msg: string; type: 'info' | 'success' | 'error' }[]>([]);
  const [strategy, setStrategy] = useState<'EMA_CROSS' | 'RSI_REVERSION'>('EMA_CROSS');
  const [botStats, setBotStats] = useState({ trades: 0, wins: 0, losses: 0, totalPnl: 0 });

  // Bot tracking
  const peakProfitRef = React.useRef<Record<string, number>>({});
  const posStartTimeRef = React.useRef<Record<string, number>>({});

  // Account form
  const [newAccLabel, setNewAccLabel] = useState('');
  const [newAccKey, setNewAccKey] = useState('');
  const [newAccSecret, setNewAccSecret] = useState('');

  useEffect(() => {
    if (token) {
      refreshAll();
      const interval = setInterval(() => refreshAll(true), 5000);
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    loadSymbols();
    loadChartData(true);
    fetchPrice();
  }, [market, selectedSymbol]);

  useEffect(() => {
    const interval = setInterval(fetchPrice, 1000);
    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const fetchPrice = async () => {
    if (!selectedSymbol) return;
    try {
      const data = await api(`/api/futures/price?symbol=${encodeURIComponent(selectedSymbol)}`, { auth: false });
      if (data.price) {
        setCurrentPrice(prev => {
          if (prev !== data.price) setPrevPrice(prev);
          return data.price;
        });
      }
    } catch (err) {
      // Silent fail for price updates
    }
  };

  const loadChartData = async (forceClear = false) => {
    if (!selectedSymbol) return;
    try {
      if (forceClear) setChartData([]); 
      const data = await api(`/api/futures/klines?symbol=${encodeURIComponent(selectedSymbol)}&interval=1m&limit=100`, { auth: false });
      if (!Array.isArray(data)) {
        throw new Error('Invalid klines data format');
      }
      const formatted = data.map((k: any) => ({
        time: k[0],
        open: Number(k[1]),
        high: Number(k[2]),
        low: Number(k[3]),
        close: Number(k[4])
      }));
      setChartData(formatted);
    } catch (err: any) {
      console.error('Chart load failed:', err);
      setStatus({ msg: `Chart Error: ${err.message}`, ok: false });
    }
  };

  useEffect(() => {
    let timer: any;
    if (autoMode && token) {
      timer = setInterval(autoTick, 10000); // Every 10s
      autoTick();
    }
    return () => clearInterval(timer);
  }, [autoMode, token, selectedSymbol, emaShort, emaLong, tradeVol, crossCond, tpPct, slPct, useRsi, rsiPeriod, rsiOverbought, rsiOversold, useRsiDivergence, useMacd, macdFast, macdSlow, macdSignal]);

  const calculateEMA = (data: number[], period: number) => {
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return ema;
  };

  const calculateRSI = (data: number[], period: number) => {
    if (data.length <= period) return 50;
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = data[i] - data[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < data.length; i++) {
      const diff = data[i] - data[i - 1];
      if (diff >= 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - diff) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  };

  const detectRSIDivergence = (prices: number[], rsiValues: number[]) => {
    if (prices.length < 20 || rsiValues.length < 20) return { bullish: false, bearish: false };

    // Find local peaks/troughs in a window
    const findLocalExtrema = (data: number[], type: 'min' | 'max', window = 5) => {
      const extrema: { index: number; value: number }[] = [];
      for (let i = window; i < data.length - window; i++) {
        const slice = data.slice(i - window, i + window + 1);
        const val = data[i];
        if (type === 'min' && val === Math.min(...slice)) {
          extrema.push({ index: i, value: val });
        } else if (type === 'max' && val === Math.max(...slice)) {
          extrema.push({ index: i, value: val });
        }
      }
      return extrema;
    };

    const priceLows = findLocalExtrema(prices, 'min');
    const rsiLows = findLocalExtrema(rsiValues, 'min');
    const priceHighs = findLocalExtrema(prices, 'max');
    const rsiHighs = findLocalExtrema(rsiValues, 'max');

    let bullish = false;
    let bearish = false;

    // Bullish Divergence: Price Lower Low, RSI Higher Low
    if (priceLows.length >= 2 && rsiLows.length >= 2) {
      const lastPriceLow = priceLows[priceLows.length - 1];
      const prevPriceLow = priceLows[priceLows.length - 2];
      const lastRsiLow = rsiLows[rsiLows.length - 1];
      const prevRsiLow = rsiLows[rsiLows.length - 2];

      // Ensure they are somewhat synchronized in time (within 5 candles)
      if (Math.abs(lastPriceLow.index - lastRsiLow.index) < 5 && 
          Math.abs(prevPriceLow.index - prevRsiLow.index) < 5) {
        if (lastPriceLow.value < prevPriceLow.value && lastRsiLow.value > prevRsiLow.value) {
          bullish = true;
        }
      }
    }

    // Bearish Divergence: Price Higher High, RSI Lower High
    if (priceHighs.length >= 2 && rsiHighs.length >= 2) {
      const lastPriceHigh = priceHighs[priceHighs.length - 1];
      const prevPriceHigh = priceHighs[priceHighs.length - 2];
      const lastRsiHigh = rsiHighs[rsiHighs.length - 1];
      const prevRsiHigh = rsiHighs[rsiHighs.length - 2];

      if (Math.abs(lastPriceHigh.index - lastRsiHigh.index) < 5 && 
          Math.abs(prevPriceHigh.index - prevRsiHigh.index) < 5) {
        if (lastPriceHigh.value > prevPriceHigh.value && lastRsiHigh.value < prevRsiHigh.value) {
          bearish = true;
        }
      }
    }

    return { bullish, bearish };
  };

  const calculateMACD = (data: number[]) => {
    const fast = parseInt(macdFast) || 12;
    const slow = parseInt(macdSlow) || 26;
    const signal = parseInt(macdSignal) || 9;
    const minData = slow + signal;

    if (data.length < minData) return { macdLine: 0, signalLine: 0, histogram: 0 };
    
    // MACD Line: Fast EMA - Slow EMA
    const emaFast = calculateEMA(data, fast);
    const emaSlow = calculateEMA(data, slow);
    const macdLine = emaFast - emaSlow;
    
    // Signal Line: Signal EMA of MACD Line
    const macdSeries: number[] = [];
    for (let i = signal * 2; i >= 0; i--) {
      const subData = data.slice(0, data.length - i);
      const ef = calculateEMA(subData, fast);
      const es = calculateEMA(subData, slow);
      macdSeries.push(ef - es);
    }
    const signalLine = calculateEMA(macdSeries, signal);
    const histogram = macdLine - signalLine;

    return { macdLine, signalLine, histogram };
  };

  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setBotLogs(prev => [{ time: Date.now(), msg, type }, ...prev].slice(0, 50));
  };

  const autoTick = async () => {
    try {
      // 1. Manage existing positions (Trailing Stop & Max Duration)
      const currentPosKeys = new Set<string>();
      const symbolsWithPositions = new Set<string>();
      
      for (const acc of accounts) {
        if (!acc.enabled || !acc.futures?.positions) continue;
        
        for (const p of acc.futures.positions) {
          const key = `${acc.id}_${p.symbol}`;
          currentPosKeys.add(key);
          symbolsWithPositions.add(p.symbol);
          
          // Track peak profit
          const currentProfit = p.unrealizedProfit;
          const peak = peakProfitRef.current[key] || 0;
          
          // Only track peak if profit is positive
          if (currentProfit > peak && currentProfit > 0) {
            peakProfitRef.current[key] = currentProfit;
          }

          // Trailing Stop Logic
          const tStop = Number(trailingStop);
          if (peak > 0 && tStop > 0) {
            const threshold = peak * (1 - tStop / 100);
            if (currentProfit < threshold) {
              const msg = `Trailing stop triggered for ${p.symbol} on ${acc.label} (Peak: $${peak.toFixed(2)}, Current: $${currentProfit.toFixed(2)})`;
              setStatus({ msg: `Auto: ${msg}`, ok: true });
              addLog(msg, 'success');
              setBotStats(prev => ({
                ...prev,
                trades: prev.trades + 1,
                wins: currentProfit > 0 ? prev.wins + 1 : prev.wins,
                losses: currentProfit <= 0 ? prev.losses + 1 : prev.losses,
                totalPnl: prev.totalPnl + currentProfit
              }));
              await api('/api/futures/close', { method: 'POST', body: { accountId: acc.id, symbol: p.symbol } });
              delete peakProfitRef.current[key];
              delete posStartTimeRef.current[key];
              continue;
            }
          }

          // Manual TP/SL Fallback Monitoring
          const tp = Number(tpPct);
          const sl = Number(slPct);
          const pnl = p.pnlPct; // Percentage PnL

          if (tp > 0 && pnl >= tp) {
            const msg = `Manual Take Profit triggered for ${p.symbol} on ${acc.label} (${pnl.toFixed(2)}%)`;
            setStatus({ msg: `Auto: ${msg}`, ok: true });
            addLog(msg, 'success');
            setBotStats(prev => ({
              ...prev,
              trades: prev.trades + 1,
              wins: prev.wins + 1,
              totalPnl: prev.totalPnl + currentProfit
            }));
            await api('/api/futures/close', { method: 'POST', body: { accountId: acc.id, symbol: p.symbol } });
            delete peakProfitRef.current[key];
            delete posStartTimeRef.current[key];
            continue;
          }

          if (sl > 0 && pnl <= -sl) {
            const msg = `Manual Stop Loss triggered for ${p.symbol} on ${acc.label} (${pnl.toFixed(2)}%)`;
            setStatus({ msg: `Auto: ${msg}`, ok: true });
            addLog(msg, 'error');
            setBotStats(prev => ({
              ...prev,
              trades: prev.trades + 1,
              losses: prev.losses + 1,
              totalPnl: prev.totalPnl + currentProfit
            }));
            await api('/api/futures/close', { method: 'POST', body: { accountId: acc.id, symbol: p.symbol } });
            delete peakProfitRef.current[key];
            delete posStartTimeRef.current[key];
            continue;
          }

          // Max Duration Logic
          if (!posStartTimeRef.current[key]) {
            // Try to find start time from trades
            try {
              const trades = await api(`/api/futures/trades?accountId=${acc.id}&symbol=${p.symbol}`);
              if (trades.length > 0) {
                posStartTimeRef.current[key] = trades[0].time;
              } else {
                posStartTimeRef.current[key] = Date.now();
              }
            } catch {
              posStartTimeRef.current[key] = Date.now();
            }
          }

          const startTime = posStartTimeRef.current[key];
          const maxMin = Number(maxDuration);
          if (startTime && maxMin > 0) {
            const elapsedMin = (Date.now() - startTime) / 60000;
            if (elapsedMin > maxMin) {
              const msg = `Max duration reached for ${p.symbol} on ${acc.label}`;
              setStatus({ msg: `Auto: ${msg}`, ok: true });
              addLog(msg, 'info');
              setBotStats(prev => ({
                ...prev,
                trades: prev.trades + 1,
                wins: currentProfit > 0 ? prev.wins + 1 : prev.wins,
                losses: currentProfit <= 0 ? prev.losses + 1 : prev.losses,
                totalPnl: prev.totalPnl + currentProfit
              }));
              await api('/api/futures/close', { method: 'POST', body: { accountId: acc.id, symbol: p.symbol } });
              delete peakProfitRef.current[key];
              delete posStartTimeRef.current[key];
              continue;
            }
          }
        }
      }

      // Cleanup refs for closed positions
      Object.keys(peakProfitRef.current).forEach(key => {
        if (!currentPosKeys.has(key)) delete peakProfitRef.current[key];
      });
      Object.keys(posStartTimeRef.current).forEach(key => {
        if (!currentPosKeys.has(key)) delete posStartTimeRef.current[key];
      });

      // 2. Detect new signals
      // Skip if we already have a position for this symbol
      if (symbolsWithPositions.has(selectedSymbol)) {
        return;
      }

      const klines = await api(`/api/futures/klines?symbol=${selectedSymbol}&interval=1m&limit=100`, { auth: false });
      const closes = klines.map((k: any) => Number(k[4]));
      
      // Update current indicators for UI
      if (useMacd) {
        setCurrentMacd(calculateMACD(closes));
      }
      
      let signal = false;
      let side: 'BUY' | 'SELL' = 'BUY';

      if (strategy === 'EMA_CROSS') {
        const shortP = Number(emaShort);
        const longP = Number(emaLong);
        
        const eShort = calculateEMA(closes, shortP);
        const eLong = calculateEMA(closes, longP);
        
        const prevCloses = closes.slice(0, -1);
        const prevShort = calculateEMA(prevCloses, shortP);
        const prevLong = calculateEMA(prevCloses, longP);

        if (crossCond === 'UP') {
          if (prevShort <= prevLong && eShort > eLong) signal = true;
          side = 'BUY';
        } else {
          if (prevShort >= prevLong && eShort < eLong) signal = true;
          side = 'SELL';
        }
      } else if (strategy === 'RSI_REVERSION') {
        const rsiVal = calculateRSI(closes, Number(rsiPeriod));
        if (rsiVal < Number(rsiOversold)) {
          signal = true;
          side = 'BUY';
        } else if (rsiVal > Number(rsiOverbought)) {
          signal = true;
          side = 'SELL';
        }
      }

      // RSI Confirmation (only for EMA_CROSS)
      if (signal && strategy === 'EMA_CROSS' && useRsi) {
        const rsiVal = calculateRSI(closes, Number(rsiPeriod));
        if (side === 'BUY' && rsiVal > Number(rsiOverbought)) signal = false; // Overbought, don't buy
        if (side === 'SELL' && rsiVal < Number(rsiOversold)) signal = false; // Oversold, don't sell
      }

      // RSI Divergence Confirmation
      if (signal && useRsiDivergence) {
        // We need a series of RSI values to detect divergence
        const rsiPeriodVal = Number(rsiPeriod);
        const rsiSeries: number[] = [];
        // Calculate RSI for each point in the last 40 candles to have enough data for divergence detection
        for (let i = 40; i >= 0; i--) {
          const subData = closes.slice(0, closes.length - i);
          rsiSeries.push(calculateRSI(subData, rsiPeriodVal));
        }
        
        const { bullish, bearish } = detectRSIDivergence(closes.slice(-41), rsiSeries);
        if (side === 'BUY' && !bullish) signal = false;
        if (side === 'SELL' && !bearish) signal = false;
      }

      // MACD Confirmation (Histogram check)
      if (signal && useMacd) {
        const { histogram } = calculateMACD(closes);
        if (side === 'BUY' && histogram <= 0) signal = false; // Histogram must be positive for BUY
        if (side === 'SELL' && histogram >= 0) signal = false; // Histogram must be negative for SELL
      }

      if (signal) {
        const msg = `${side} signal detected on ${selectedSymbol}`;
        setStatus({ msg: `Auto: ${msg}`, ok: true });
        addLog(msg, 'success');
        await api('/api/futures/trade', {
          method: 'POST',
          body: {
            symbol: selectedSymbol,
            side,
            notional: Number(tradeVol),
            tpPct: Number(tpPct),
            slPct: Number(slPct)
          }
        });
      }
    } catch (err: any) {
      console.error('AutoTick error:', err);
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  const executeTrade = async (side: 'BUY' | 'SELL') => {
    setLoading(true);
    try {
      const res = await api('/api/futures/trade', {
        method: 'POST',
        body: {
          symbol: selectedSymbol,
          side,
          notional: Number(tradeVol),
          tpPct: Number(tpPct),
          slPct: Number(slPct)
        }
      });
      if (res.msg) setStatus({ msg: res.msg, ok: true });
      else setStatus({ msg: `${side} order placed`, ok: true });
      refreshAll();
    } catch (err: any) {
      setStatus({ msg: err.message, ok: false });
    } finally {
      setLoading(false);
    }
  };

  const formatError = (err: any): string => {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (typeof err === 'object') {
      if (err.msg) return err.msg;
      if (err.message) return err.message;
      if (err.error) return typeof err.error === 'string' ? err.error : formatError(err.error);
      return JSON.stringify(err);
    }
    return String(err);
  };

  const api = async (path: string, options: any = {}) => {
    const { method = 'GET', body, auth = true } = options;
    const headers: any = { 'Content-Type': 'application/json' };
    if (auth && token) headers['Authorization'] = `Bearer ${token}`;

    const url = path.startsWith('http') ? path : `${window.location.origin}${path}`;

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null,
      });

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { message: text || 'Non-JSON response' };
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || `API Error: ${res.status}`);
      }
      return data;
    } catch (err: any) {
      console.error('API Fetch Error Details:', {
        path,
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        console.error('Network error or server unreachable:', path);
      }
      throw err;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const path = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const data = await api(path, { method: 'POST', auth: false, body: { username, password } });
      setToken(data.token);
      localStorage.setItem('alpha_token', data.token);
      setStatus({ msg: `Logged in as ${data.username}`, ok: true });
    } catch (err: any) {
      setStatus({ msg: err.message, ok: false });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('alpha_token');
    setAutoMode(false);
    setAccounts([]);
  };

  const refreshAll = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api('/api/user/summary');
      setAccounts(data.accounts || []);
      setUsername(data.user.username);
      setLiveOrders(data.liveOrders);
      if (data.tradeLimits) setTradeLimits(data.tradeLimits);
      setStatus({ msg: 'Data refreshed', ok: true });
      loadChartData(false);
    } catch (err: any) {
      setStatus({ msg: err.message, ok: false });
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const loadSymbols = async () => {
    try {
      const path = market === 'FUTURES' ? '/api/futures/symbols' : '/api/spot/symbols';
      const data = await api(path, { auth: false });
      setSymbols(data.symbols || []);
      if (data.symbols?.length > 0) {
        setSelectedSymbol(data.symbols[0].symbol);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const addAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/accounts', {
        method: 'POST',
        body: { label: newAccLabel, apiKey: newAccKey, apiSecret: newAccSecret }
      });
      setNewAccLabel('');
      setNewAccKey('');
      setNewAccSecret('');
      refreshAll();
      setStatus({ msg: 'Account added', ok: true });
    } catch (err: any) {
      setStatus({ msg: err.message, ok: false });
    }
  };

  const toggleAccount = async (id: string) => {
    try {
      await api(`/api/accounts/${id}/toggle`, { method: 'POST' });
      refreshAll();
    } catch (err: any) {
      setStatus({ msg: err.message, ok: false });
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('Delete this account?')) return;
    try {
      await api(`/api/accounts/${id}`, { method: 'DELETE' });
      refreshAll();
    } catch (err: any) {
      setStatus({ msg: err.message, ok: false });
    }
  };

  const closePosition = async (accountId: string, symbol: string) => {
    if (!confirm(`Close ${symbol} position?`)) return;
    setLoading(true);
    try {
      await api('/api/futures/close', { method: 'POST', body: { accountId, symbol } });
      setStatus({ msg: `Closed ${symbol} position`, ok: true });
      refreshAll();
    } catch (err: any) {
      setStatus({ msg: err.message, ok: false });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-xl"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
              <TrendingUp className="w-8 h-8 text-black" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Alpha Pro Trader</h1>
          <p className="text-white/50 text-center text-sm mb-8">
            {isRegistering ? 'Create your account to start trading' : 'Sign in to manage your accounts'}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50 transition-colors"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50 transition-colors"
                placeholder="Enter password"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-400 text-black font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Processing...' : isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-sky-400 hover:text-sky-300 transition-colors"
            >
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>

          {status.msg && !status.ok && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formatError(status.msg)}</span>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Alpha Pro</h1>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> {username}
                </span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span className={status.ok ? 'text-emerald-400' : 'text-red-400'}>
                  {formatError(status.msg)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {liveOrders ? (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Live Trading Enabled</span>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Simulation Mode</span>
              </div>
            )}
            <button 
              onClick={refreshAll}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-xl transition-colors text-white/60 hover:text-red-400"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Accounts & Balances */}
          <div className="lg:col-span-8 space-y-6">
            {/* Balances Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((acc) => (
                <motion.div 
                  layout
                  key={acc.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${acc.enabled ? 'bg-emerald-500' : 'bg-white/20'}`} />
                      <h3 className="font-bold">{acc.label}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => toggleAccount(acc.id)}
                        className={`text-xs px-2 py-1 rounded-md transition-colors ${acc.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/40'}`}
                      >
                        {acc.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button 
                        onClick={() => deleteAccount(acc.id)}
                        className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Futures Balance</p>
                      <p className="text-lg font-mono font-bold">
                        {acc.futures ? `${acc.futures.walletBalance.toFixed(2)}` : '--'}
                        <span className="text-[10px] ml-1 text-white/40">USDT</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium">Unrealized PnL</p>
                      <p className={`text-lg font-mono font-bold ${acc.futures && acc.futures.unrealizedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {acc.futures ? `${acc.futures.unrealizedProfit >= 0 ? '+' : ''}${acc.futures.unrealizedProfit.toFixed(2)}` : '--'}
                      </p>
                    </div>
                  </div>

                  {acc.errFut && (
                    <div className="text-[10px] text-red-400/80 bg-red-400/5 p-2 rounded-lg border border-red-400/10">
                      {formatError(acc.errFut)}
                    </div>
                  )}

                  {acc.errSpot && (
                    <div className="text-[10px] text-red-400/80 bg-red-400/5 p-2 rounded-lg border border-red-400/10 mt-2">
                      {formatError(acc.errSpot)}
                    </div>
                  )}

                  {/* Spot Balances */}
                  {acc.spot && acc.spot.dollarTotal > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5 mt-2">
                      <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Spot Assets</p>
                      <div className="flex flex-wrap gap-2">
                        {(Object.entries(acc.spot.dollarByAsset) as [string, number][]).map(([asset, val]) => (
                          val > 0 && (
                            <div key={asset} className="bg-white/5 px-2 py-1 rounded-md border border-white/5">
                              <span className="text-[10px] font-bold mr-1">{asset}:</span>
                              <span className="text-[10px] font-mono text-sky-400">{val.toFixed(2)}</span>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Open Positions */}
                  {acc.futures?.positions && acc.futures.positions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Open Positions</p>
                      <div className="space-y-2">
                        {acc.futures.positions.map((p, idx) => (
                          <div key={idx} className="bg-black/20 rounded-xl p-3 border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">{p.symbol}</span>
                                <span className="text-[8px] bg-white/5 px-1 rounded text-white/40">{p.leverage}x</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col items-end">
                                  <span className={`text-xs font-mono font-bold ${p.unrealizedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {p.unrealizedProfit >= 0 ? '+' : ''}{p.unrealizedProfit.toFixed(2)} USDT
                                  </span>
                                  <span className={`text-[10px] font-mono font-medium ${p.pnlPct >= 0 ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
                                    {p.pnlPct >= 0 ? '+' : ''}{p.pnlPct.toFixed(2)}%
                                  </span>
                                </div>
                                <button 
                                  onClick={() => closePosition(acc.id, p.symbol)}
                                  className="p-1.5 hover:bg-red-500/10 rounded-lg text-white/20 hover:text-red-400 transition-all"
                                  title="Close Position"
                                >
                                  <Square className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-[10px] text-white/40">
                              <div>
                                <p>Size</p>
                                <p className="text-white/80">{p.amount.toFixed(3)}</p>
                              </div>
                              <div>
                                <p>Entry</p>
                                <p className="text-white/80">{p.entryPrice.toFixed(2)}</p>
                              </div>
                              <div>
                                <p>Mark</p>
                                <p className="text-white/80">{p.markPrice.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Add Account Card */}
              <button 
                onClick={() => (document.getElementById('add-account-modal') as HTMLDialogElement)?.showModal()}
                className="border-2 border-dashed border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-white/20 hover:text-white/40 transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium">Add New Account</span>
              </button>
            </div>

            {/* Market View */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-96 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sky-400" />
                  <h3 className="font-bold">
                    {selectedSymbol} 
                    <span className={`ml-2 font-mono text-sm transition-colors duration-300 ${
                      Number(currentPrice) > Number(prevPrice) ? 'text-emerald-400' : 
                      Number(currentPrice) < Number(prevPrice) ? 'text-red-400' : 'text-white/60'
                    }`}>
                      ${Number(currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </span>
                    <span className="text-xs text-white/40 font-normal ml-1">1m Chart</span>
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-[10px] mono text-white/40">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
                  </span>
                </div>
              </div>
              <div className="flex-1 w-full relative">
                {chartData.length > 0 ? (
                  <CandlestickChart data={chartData} showMacd={useMacd} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                    <RefreshCw className="w-8 h-8 mb-2 animate-spin" />
                    <p className="text-xs">Loading chart data...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Controls */}
          <div className="lg:col-span-4 space-y-6">
            {/* Trading Controls */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-sky-500" />
                  Terminal
                </h2>
                <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                  <button 
                    onClick={() => setMarket('FUTURES')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${market === 'FUTURES' ? 'bg-sky-500 text-black' : 'text-white/40'}`}
                  >
                    FUTURES
                  </button>
                  <button 
                    onClick={() => setMarket('SPOT')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${market === 'SPOT' ? 'bg-sky-500 text-black' : 'text-white/40'}`}
                  >
                    SPOT
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {market === 'FUTURES' && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                          Trade Volume (USD)
                          <Tooltip text="Amount of USD to use for each trade. Must be within system limits ($5-$10).">
                            <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                          </Tooltip>
                        </label>
                        <input 
                          type="number" 
                          value={tradeVol}
                          onChange={(e) => setTradeVol(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">Symbol</label>
                        <select 
                          value={selectedSymbol}
                          onChange={(e) => setSelectedSymbol(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors appearance-none"
                        >
                          {symbols.map(s => (
                            <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                          Take Profit %
                          <Tooltip text="Target profit percentage to automatically close the position.">
                            <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                          </Tooltip>
                        </label>
                        <input 
                          type="number" 
                          value={tpPct}
                          onChange={(e) => setTpPct(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                          Stop Loss %
                          <Tooltip text="Maximum loss percentage before automatically closing the position.">
                            <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                          </Tooltip>
                        </label>
                        <input 
                          type="number" 
                          value={slPct}
                          onChange={(e) => setSlPct(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                        />
                      </div>
                    </div>
                  </>
                )}

                {market === 'SPOT' && (
                  <div>
                    <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">Symbol</label>
                    <select 
                      value={selectedSymbol}
                      onChange={(e) => setSelectedSymbol(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors appearance-none"
                    >
                      {symbols.map(s => (
                        <option key={s.symbol} value={s.symbol}>{s.symbol}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={() => executeTrade('BUY')}
                    disabled={loading}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    BUY / LONG
                  </button>
                  <button 
                    onClick={() => executeTrade('SELL')}
                    disabled={loading}
                    className="bg-red-500 hover:bg-red-400 text-black font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    SELL / SHORT
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-sky-500" />
                    <div>
                      <h3 className="text-sm font-bold flex items-center gap-1.5">
                        Auto Scalper
                        <Tooltip text="Automated trading bot that executes trades based on technical indicators and risk management rules.">
                          <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                        </Tooltip>
                      </h3>
                      <select 
                        value={strategy}
                        onChange={(e) => setStrategy(e.target.value as any)}
                        className="text-[10px] bg-transparent text-white/40 border-none focus:ring-0 p-0 cursor-pointer hover:text-white/60 transition-colors"
                      >
                        <option value="EMA_CROSS">EMA Crossover</option>
                        <option value="RSI_REVERSION">RSI Mean Reversion</option>
                      </select>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAutoMode(!autoMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${autoMode ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20' : 'bg-white/5 text-white/40'}`}
                  >
                    {autoMode ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                    {autoMode ? 'STOP' : 'START'}
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Section Tabs */}
                  <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                    {(['BASIC', 'RISK', 'INDICATORS'] as const).map((s) => (
                      <Tooltip key={s} text={
                        s === 'BASIC' ? 'Core strategy parameters like EMA periods and entry conditions.' :
                        s === 'RISK' ? 'Risk management settings including max duration and trailing stop.' :
                        'Advanced technical filters like RSI and MACD confirmation.'
                      }>
                        <button
                          onClick={() => setOpenSection(s)}
                          className={`w-full py-1.5 text-[9px] font-bold rounded-lg transition-all ${
                            openSection === s 
                              ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20' 
                              : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                          }`}
                        >
                          {s}
                        </button>
                      </Tooltip>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Tooltip text="Aggressive strategy for fast price movements. Short EMA: 5, Long EMA: 13, 1m duration.">
                      <button 
                        onClick={() => {
                          setEmaShort('5');
                          setEmaLong('13');
                          setTpPct('1.0');
                          setSlPct('0.5');
                          setMaxDuration('1');
                          setTrailingStop('5');
                          setStatus({ msg: 'Quick Scalp preset applied (1m duration)', ok: true });
                        }}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2 text-[10px] font-bold transition-all"
                      >
                        QUICK SCALP (1M)
                      </button>
                    </Tooltip>
                    <Tooltip text="Balanced strategy for medium-term trends. Short EMA: 9, Long EMA: 21, 15m duration.">
                      <button 
                        onClick={() => {
                          setEmaShort('9');
                          setEmaLong('21');
                          setTpPct('3.0');
                          setSlPct('1.5');
                          setMaxDuration('15');
                          setTrailingStop('15');
                          setStatus({ msg: 'Standard Scalp preset applied', ok: true });
                        }}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2 text-[10px] font-bold transition-all"
                      >
                        STANDARD (15M)
                      </button>
                    </Tooltip>
                  </div>

                  <AnimatePresence mode="wait">
                    {openSection === 'BASIC' && (
                      <motion.div
                        key="basic"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                              EMA Short
                              <Tooltip text="Period for the fast Exponential Moving Average. Typically 9 or 12.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                            <input 
                              type="number" 
                              value={emaShort}
                              onChange={(e) => setEmaShort(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                              EMA Long
                              <Tooltip text="Period for the slow Exponential Moving Average. Typically 21 or 26.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                            <input 
                              type="number" 
                              value={emaLong}
                              onChange={(e) => setEmaLong(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                            Condition
                            <Tooltip text="The specific crossover event that triggers a trade entry.">
                              <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                            </Tooltip>
                          </label>
                          <select 
                            value={crossCond}
                            onChange={(e) => setCrossCond(e.target.value as any)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors appearance-none"
                          >
                            <option value="UP">Short crosses Long UP (BUY)</option>
                            <option value="DOWN">Short crosses Long DOWN (SELL)</option>
                          </select>
                        </div>
                      </motion.div>
                    )}

                    {openSection === 'RISK' && (
                      <motion.div
                        key="risk"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                              Max Duration (min)
                              <Tooltip text="Maximum time in minutes a position can stay open before being force-closed.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                            <input 
                              type="number" 
                              value={maxDuration}
                              onChange={(e) => setMaxDuration(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                              Trailing Stop (%)
                              <Tooltip text="Percentage of peak profit to trail. If profit drops by this much from its peak, the trade closes.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                            <input 
                              type="number" 
                              value={trailingStop}
                              onChange={(e) => setTrailingStop(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {openSection === 'INDICATORS' && (
                      <motion.div
                        key="indicators"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="space-y-3"
                      >
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={useRsi} onChange={e => setUseRsi(e.target.checked)} className="rounded border-white/10 bg-black/40 text-sky-500" />
                              <span className="text-[10px] font-bold text-white/60">RSI Confirmation</span>
                              <Tooltip text="Use Relative Strength Index to confirm entry signals.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                          </div>
                          {useRsi && (
                            <div className="grid grid-cols-3 gap-2 pl-6">
                              <div>
                                <label className="flex items-center gap-1 text-[8px] text-white/30 uppercase mb-1">
                                  Period
                                  <Tooltip text="Number of candles used to calculate RSI.">
                                    <Info className="w-2.5 h-2.5" />
                                  </Tooltip>
                                </label>
                                <input type="number" value={rsiPeriod} onChange={e => setRsiPeriod(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px]" />
                              </div>
                              <div>
                                <label className="flex items-center gap-1 text-[8px] text-white/30 uppercase mb-1">
                                  Overbought
                                  <Tooltip text="RSI level for sell confirmation.">
                                    <Info className="w-2.5 h-2.5" />
                                  </Tooltip>
                                </label>
                                <input type="number" value={rsiOverbought} onChange={e => setRsiOverbought(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px]" />
                              </div>
                              <div>
                                <label className="flex items-center gap-1 text-[8px] text-white/30 uppercase mb-1">
                                  Oversold
                                  <Tooltip text="RSI level for buy confirmation.">
                                    <Info className="w-2.5 h-2.5" />
                                  </Tooltip>
                                </label>
                                <input type="number" value={rsiOversold} onChange={e => setRsiOversold(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px]" />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={useRsiDivergence} onChange={e => setUseRsiDivergence(e.target.checked)} className="rounded border-white/10 bg-black/40 text-sky-500" />
                              <span className="text-[10px] font-bold text-white/60">RSI Divergence Filter</span>
                              <Tooltip text="Only enter trades when RSI divergence (Bullish for BUY, Bearish for SELL) is detected against price action.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                          </div>

                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={useMacd} onChange={e => setUseMacd(e.target.checked)} className="rounded border-white/10 bg-black/40 text-sky-500" />
                              <span className="text-[10px] font-bold text-white/60">MACD Histogram Filter</span>
                              <Tooltip text="Ensures the MACD Histogram is positive for BUYs and negative for SELLs to confirm momentum.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                          </div>
                          {useMacd && (
                            <div className="pl-6 space-y-3">
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="flex items-center gap-1 text-[8px] text-white/30 uppercase mb-1">
                                    Fast
                                    <Tooltip text="Short-term EMA period for MACD. Default is 12.">
                                      <Info className="w-2.5 h-2.5" />
                                    </Tooltip>
                                  </label>
                                  <input type="number" value={macdFast} onChange={e => setMacdFast(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px]" />
                                </div>
                                <div>
                                  <label className="flex items-center gap-1 text-[8px] text-white/30 uppercase mb-1">
                                    Slow
                                    <Tooltip text="Long-term EMA period for MACD. Default is 26.">
                                      <Info className="w-2.5 h-2.5" />
                                    </Tooltip>
                                  </label>
                                  <input type="number" value={macdSlow} onChange={e => setMacdSlow(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px]" />
                                </div>
                                <div>
                                  <label className="flex items-center gap-1 text-[8px] text-white/30 uppercase mb-1">
                                    Signal
                                    <Tooltip text="EMA period of the MACD line. Default is 9.">
                                      <Info className="w-2.5 h-2.5" />
                                    </Tooltip>
                                  </label>
                                  <input type="number" value={macdSignal} onChange={e => setMacdSignal(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px]" />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="bg-black/40 p-1.5 rounded-lg border border-white/5 text-center">
                                  <p className="text-[7px] text-white/30 uppercase">MACD</p>
                                  <p className="text-[9px] font-mono font-bold text-sky-400">{currentMacd.macdLine.toFixed(4)}</p>
                                </div>
                                <div className="bg-black/40 p-1.5 rounded-lg border border-white/5 text-center">
                                  <p className="text-[7px] text-white/30 uppercase">Signal</p>
                                  <p className="text-[9px] font-mono font-bold text-amber-400">{currentMacd.signalLine.toFixed(4)}</p>
                                </div>
                                <div className="bg-black/40 p-1.5 rounded-lg border border-white/5 text-center">
                                  <p className="text-[7px] text-white/30 uppercase">Hist</p>
                                  <p className={`text-[9px] font-mono font-bold ${currentMacd.histogram >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {currentMacd.histogram.toFixed(4)}
                                  </p>
                                </div>
                              </div>
                              <p className="text-[9px] text-white/30 italic">
                                Histogram must be positive for BUY and negative for SELL.
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center justify-between text-[10px] mono text-white/60">
                    <span>Status:</span>
                    <span className={autoMode ? 'text-sky-400 animate-pulse' : ''}>{autoMode ? 'RUNNING' : 'IDLE'}</span>
                  </div>
                  <div className="mt-1 text-[10px] mono text-white/30 truncate">
                    {autoMode ? `Monitoring ${selectedSymbol} (${strategy})...` : 'Waiting for activation...'}
                  </div>
                </div>
              </div>
            </div>

            {/* Bot Activity Logs */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col h-64">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-500" />
                  Bot Activity
                  <Tooltip text="Real-time log of bot actions, signal detections, and trade executions.">
                    <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                  </Tooltip>
                </h2>
                <button 
                  onClick={() => setBotLogs([])}
                  className="text-[10px] text-white/20 hover:text-white/40 transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                {botLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[10px] text-white/20 italic">
                    No activity recorded yet
                  </div>
                ) : (
                  botLogs.map((log, i) => (
                    <div key={i} className="text-[10px] flex gap-2 items-start animate-in fade-in slide-in-from-left-2 duration-300">
                      <span className="text-white/20 font-mono shrink-0">
                        {new Date(log.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className={`font-medium ${
                        log.type === 'success' ? 'text-emerald-400' : 
                        log.type === 'error' ? 'text-red-400' : 'text-sky-400'
                      }`}>
                        {log.msg}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bot Performance */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="font-bold flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-sky-500" />
                Bot Performance
                <Tooltip text="Cumulative statistics of the bot's trading performance since activation.">
                  <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                </Tooltip>
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Total Trades</p>
                  <p className="text-lg font-mono font-bold">{botStats.trades}</p>
                </div>
                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Win Rate</p>
                  <p className="text-lg font-mono font-bold text-emerald-400">
                    {botStats.trades > 0 ? ((botStats.wins / botStats.trades) * 100).toFixed(1) : '0.0'}%
                  </p>
                </div>
                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Wins / Losses</p>
                  <p className="text-lg font-mono font-bold">
                    <span className="text-emerald-400">{botStats.wins}</span>
                    <span className="text-white/20 mx-1">/</span>
                    <span className="text-red-400">{botStats.losses}</span>
                  </p>
                </div>
                <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Total PnL</p>
                  <p className={`text-lg font-mono font-bold ${botStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {botStats.totalPnl >= 0 ? '+' : ''}{botStats.totalPnl.toFixed(2)}
                    <span className="text-[10px] ml-1 text-white/40">USDT</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="font-bold flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-sky-500" />
                System Info
                <Tooltip text="General system status and configuration limits.">
                  <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                </Tooltip>
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40 flex items-center gap-1.5">
                    Live Trading
                    <Tooltip text="When enabled, the bot will execute real trades on your Binance accounts. When disabled, it only monitors signals.">
                      <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                    </Tooltip>
                  </span>
                  <span className={`${liveOrders ? 'text-emerald-400' : 'text-red-400'} font-mono font-bold`}>
                    {liveOrders ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Trade Limit</span>
                  <span className="text-white/80 font-mono">${tradeLimits.min.toFixed(2)} - ${tradeLimits.max.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Active Accounts</span>
                  <span className="text-white/80 font-mono">{accounts.filter(a => a.enabled).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Account Modal */}
      <dialog id="add-account-modal" className="bg-transparent backdrop:bg-black/80 p-0">
        <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 m-4">
          <h2 className="text-xl font-bold mb-6">Add Binance Account</h2>
          <form onSubmit={addAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">Label</label>
              <input 
                type="text" 
                value={newAccLabel}
                onChange={(e) => setNewAccLabel(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50 transition-colors"
                placeholder="e.g. Main Account"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">API Key</label>
              <input 
                type="text" 
                value={newAccKey}
                onChange={(e) => setNewAccKey(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50 transition-colors"
                placeholder="Enter Binance API Key"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">API Secret</label>
              <input 
                type="password" 
                value={newAccSecret}
                onChange={(e) => setNewAccSecret(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50 transition-colors"
                placeholder="Enter Binance API Secret"
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => (document.getElementById('add-account-modal') as HTMLDialogElement)?.close()}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 bg-sky-500 hover:bg-sky-400 text-black font-bold py-3 rounded-xl transition-all"
              >
                Add Account
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </div>
  );
}
