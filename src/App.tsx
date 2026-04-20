import React, { useState, useEffect, useMemo } from 'react';
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
  ShieldAlert,
  AlertCircle,
  AlertTriangle,
  Bell,
  BellOff,
  Info,
  BarChart2,
  Search,
  ChevronDown,
  ArrowUpDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  History,
  Zap,
  Layers,
  Clock,
  Wallet,
  Key,
  Lock,
  Globe,
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { CandlestickChart } from './components/CandlestickChart';

const Tooltip = ({ text, children }: { text: string; children: React.ReactNode; key?: React.Key }) => {
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

const AccordionSection = ({ 
  id, 
  title, 
  icon: Icon, 
  expanded, 
  onToggle, 
  children,
  tooltip
}: { 
  id: string; 
  title: string; 
  icon: any; 
  expanded: boolean; 
  onToggle: () => void; 
  children: React.ReactNode;
  tooltip?: string;
}) => (
  <div className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-3 transition-colors ${expanded ? 'bg-white/5' : 'hover:bg-white/5'}`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${expanded ? 'bg-sky-500 text-black' : 'bg-white/5 text-white/40'}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-left">
          <h4 className={`text-xs font-bold uppercase tracking-wider ${expanded ? 'text-white' : 'text-white/40'}`}>{title}</h4>
          {tooltip && !expanded && <p className="text-[9px] text-white/20 truncate w-48">{tooltip}</p>}
        </div>
      </div>
      <ChevronDown className={`w-4 h-4 text-white/20 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
    </button>
    <AnimatePresence initial={false}>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <div className="p-4 border-t border-white/5 bg-white/[0.02]">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface Account {
  id: string;
  label: string;
  group?: string;
  enabled: boolean;
  futures?: {
    walletBalance: number;
    availableBalance: number;
    unrealizedProfit: number;
    canTrade?: boolean;
    canWithdraw?: boolean;
    canDeposit?: boolean;
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
  restrictions?: {
    ipRestrict: boolean;
    enableWithdrawals: boolean;
    enableReading: boolean;
    enableFutures: boolean;
    enableSpotAndMarginTrading: boolean;
    tradingAuthorityExpirationTime?: number;
  } | null;
  permissionError?: boolean;
}

const PRESETS_DATA = [
  {
    name: 'Pro Scalper',
    desc: 'Advanced scalping with 200 EMA trend filter and volume spike detection.',
    params: {
      strategy: 'SCALPING' as const,
      tpBuyPct: '1.2',
      tpSellPct: '1.2',
      slBuyPct: '0.6',
      slSellPct: '0.6',
      maxDuration: '10',
      trailingStop: '15',
      profitFloorPct: '0.4',
      useProfitFloor: true,
      tpSlMode: 'PERCENTAGE' as const,
      useVolumeSpike: true,
      volumeSpikeThreshold: '20'
    }
  },
  {
    name: 'Aggressive Scalp',
    desc: 'High frequency trading with tight stops and aggressive trailing.',
    params: {
      emaShort: '5',
      emaLong: '13',
      tpBuyPct: '1.5',
      tpSellPct: '1.5',
      slBuyPct: '0.5',
      slSellPct: '0.5',
      maxDuration: '5',
      trailingStop: '10',
      profitFloorPct: '0.5',
      useProfitFloor: true,
      strategy: 'EMA_CROSS' as const,
      tpSlMode: 'PERCENTAGE' as const
    }
  },
  {
    name: 'Conservative Trend',
    desc: 'Follows major trends with wider stops and longer duration.',
    params: {
      emaShort: '20',
      emaLong: '50',
      tpBuyPct: '3.0',
      tpSellPct: '3.0',
      slBuyPct: '1.5',
      slSellPct: '1.5',
      maxDuration: '60',
      trailingStop: '20',
      profitFloorPct: '1.0',
      useProfitFloor: true,
      strategy: 'EMA_CROSS' as const,
      tpSlMode: 'PERCENTAGE' as const
    }
  },
  {
    name: 'RSI Reversion',
    desc: 'Trades overbought/oversold conditions for quick reversals.',
    params: {
      strategy: 'RSI_REVERSION' as const,
      rsiPeriod: '14',
      rsiOversold: '30',
      rsiOverbought: '70',
      tpBuyPct: '1.0',
      tpSellPct: '1.0',
      slBuyPct: '0.5',
      slSellPct: '0.5',
      maxDuration: '15',
      trailingStop: '0',
      profitFloorPct: '0',
      useProfitFloor: false,
      tpSlMode: 'PERCENTAGE' as const
    }
  },
  {
    name: 'Balanced Scalp',
    desc: 'A middle-ground approach for consistent performance.',
    params: {
      emaShort: '10',
      emaLong: '20',
      tpBuyPct: '2.0',
      tpSellPct: '2.0',
      slBuyPct: '1.0',
      slSellPct: '1.0',
      maxDuration: '30',
      trailingStop: '15',
      profitFloorPct: '0.5',
      useProfitFloor: true,
      strategy: 'EMA_CROSS' as const
    }
  }
];

const SymbolSelector = ({
  selectedSymbol,
  setSelectedSymbol,
  symbols,
  symbolSearch,
  setSymbolSearch,
  isSymbolListOpen,
  setIsSymbolListOpen
}: {
  selectedSymbol: string;
  setSelectedSymbol: (s: string) => void;
  symbols: any[];
  symbolSearch: string;
  setSymbolSearch: (s: string) => void;
  isSymbolListOpen: boolean;
  setIsSymbolListOpen: (b: boolean) => void;
}) => {
  const filteredSymbols = symbols.filter(s => {
    const search = symbolSearch.toLowerCase();
    return (
      s.symbol.toLowerCase().includes(search) ||
      (s.baseAsset && s.baseAsset.toLowerCase().includes(search)) ||
      (s.quoteAsset && s.quoteAsset.toLowerCase().includes(search))
    );
  });

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Search symbol..."
          value={isSymbolListOpen ? symbolSearch : selectedSymbol}
          onFocus={() => setIsSymbolListOpen(true)}
          onChange={(e) => {
            setSymbolSearch(e.target.value);
            setIsSymbolListOpen(true);
          }}
          className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-white/20 pointer-events-none">
          <Search className="w-3.5 h-3.5" />
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSymbolListOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {isSymbolListOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-[240px] flex flex-col"
          >
            <div className="overflow-y-auto custom-scrollbar">
              {filteredSymbols.length > 0 ? (
                filteredSymbols.map((s) => (
                  <button
                    key={s.symbol}
                    onClick={() => {
                      setSelectedSymbol(s.symbol);
                      setSymbolSearch('');
                      setIsSymbolListOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition-colors flex items-center justify-between ${selectedSymbol === s.symbol ? 'bg-sky-500/10 text-sky-400' : 'text-white/60'}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold">{s.symbol}</span>
                      <span className="text-[10px] opacity-40 uppercase tracking-tighter">
                        {s.baseAsset} / {s.quoteAsset}
                      </span>
                    </div>
                    {s.price && <span className="text-[10px] opacity-40 font-mono">${Number(s.price).toLocaleString()}</span>}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-white/20 text-center italic">No symbols found</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isSymbolListOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsSymbolListOpen(false);
            setSymbolSearch('');
          }}
        />
      )}
    </div>
  );
};

const Accordion = ({ title, icon: Icon, children, isOpen, onToggle, tooltip }: { 
  title: string; 
  icon: any; 
  children: React.ReactNode; 
  isOpen: boolean; 
  onToggle: () => void;
  tooltip?: string;
}) => {
  return (
    <div className="border border-white/5 rounded-xl overflow-hidden bg-white/5">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 transition-colors ${isOpen ? 'bg-white/5' : 'hover:bg-white/5'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg transition-all duration-300 ${isOpen ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20' : 'bg-white/5 text-white/40'}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold uppercase tracking-wider ${isOpen ? 'text-white' : 'text-white/60'}`}>
                {title}
              </span>
              {tooltip && (
                <Tooltip text={tooltip}>
                  <Info className="w-3 h-3 text-white/20" />
                </Tooltip>
              )}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/20 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="p-4 pt-2 border-t border-white/5 bg-black/20">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DEFAULT_LEVERAGE = 10;
const MIN_TRADE_USD = 5;

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('alpha_token') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [symbols, setSymbols] = useState<any[]>([]);
  const [market, setMarket] = useState('FUTURES');
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [symbolSearch, setSymbolSearch] = useState('');
  const [isSymbolListOpen, setIsSymbolListOpen] = useState(false);
  const [tpBuyPct, setTpBuyPct] = useState('1.0');
  const [tpSellPct, setTpSellPct] = useState('1.0');
  const [slBuyPct, setSlBuyPct] = useState('0.5');
  const [slSellPct, setSlSellPct] = useState('0.5');
  const [tpSlMode, setTpSlMode] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [tpBuyPrice, setTpBuyPrice] = useState('');
  const [tpSellPrice, setTpSellPrice] = useState('');
  const [slBuyPrice, setSlBuyPrice] = useState('');
  const [slSellPrice, setSlSellPrice] = useState('');
  const [autoMode, setAutoMode] = useState(false);
  const [emaShort, setEmaShort] = useState('5');
  const [emaLong, setEmaLong] = useState('13');
  const [tradeVol, setTradeVol] = useState('10');
  const [crossCond, setCrossCond] = useState<'UP' | 'DOWN'>('UP');
  const [maxDuration, setMaxDuration] = useState('1');
  const [useMaxDuration, setUseMaxDuration] = useState(true);
  const [trailingStop, setTrailingStop] = useState('5');
  const [useTrailingStop, setUseTrailingStop] = useState(true);
  const [profitFloorPct, setProfitFloorPct] = useState('0.5');
  const [useProfitFloor, setUseProfitFloor] = useState(true);
  const [useRsi, setUseRsi] = useState(false);
  const [useRsiDivergence, setUseRsiDivergence] = useState(false);
  const [rsiPeriod, setRsiPeriod] = useState('14');
  const [rsiOverbought, setRsiOverbought] = useState('70');
  const [rsiOversold, setRsiOversold] = useState('30');
  const [useMacdHistogramFilter, setUseMacdHistogramFilter] = useState(false);
  const [useVolumeSpike, setUseVolumeSpike] = useState(false);
  const [volumeSpikeThreshold, setVolumeSpikeThreshold] = useState('20'); // percentage
  const [showMacd, setShowMacd] = useState(false);
  const [macdFast, setMacdFast] = useState('12');
  const [macdSlow, setMacdSlow] = useState('26');
  const [macdSignal, setMacdSignal] = useState('9');
  const [currentMacd, setCurrentMacd] = useState({ macdLine: 0, signalLine: 0, histogram: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartInterval, setChartInterval] = useState('1m');
  const [currentPrice, setCurrentPrice] = useState<string>('0.00');
  const [prevPrice, setPrevPrice] = useState<string>('0.00');
  const [globalAutoScalp, setGlobalAutoScalp] = useState(false);
  const [scanInterval, setScanInterval] = useState('60'); // seconds
  const [minChangePct, setMinChangePct] = useState('1.5'); // min 24h change to consider
  const [maxLeverageMode, setMaxLeverageMode] = useState(false);
  const [maxUsdtMode, setMaxUsdtMode] = useState(false);
  const [scannedCoins, setScannedCoins] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [autoPilot, setAutoPilot] = useState(false);

  const toggleAutoPilot = () => {
    if (!autoPilot) {
      // Enabling Auto Pilot
      setAutoPilot(true);
      setAutoMode(true);
      setGlobalAutoScalp(true);
      setMaxLeverageMode(true);
      setMaxUsdtMode(true);
      setStrategy('SCALPING');
      setUseTrailingStop(true);
      setTrailingStop('3'); 
      setUseProfitFloor(true);
      setProfitFloorPct('0.5');
      setUseLiquidationProtection(true);
      setLiveOrders(true);
      addLog('Auto Pilot Mode Activated: Full market scanning and auto-trading enabled.', 'success');
      addAlert('Auto Pilot Mode Activated', 'success');
    } else {
      setAutoPilot(false);
      setAutoMode(false);
      setGlobalAutoScalp(false);
      addLog('Auto Pilot Mode Deactivated.', 'info');
    }
  };

  const [openSection, setOpenSection] = useState<'BASIC' | 'RISK' | 'INDICATORS' | 'PRESETS' | 'BACKTEST' | 'SETTINGS' | 'SCANNER' | null>('BASIC');
  const [expandedSections, setExpandedSections] = useState<string[]>(['BASIC']);
  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };
  const [backtestResults, setBacktestResults] = useState<{ trades: any[]; stats: any } | null>(null);
  const [backtestLoading, setBacktestLoading] = useState(false);
  const [backtestDays, setBacktestDays] = useState('7');
  const [orderBook, setOrderBook] = useState<{ bids: [string, string][], asks: [string, string][] }>({ bids: [], asks: [] });
  const [status, setStatus] = useState({ msg: 'Ready', ok: true });
  const [loading, setLoading] = useState(false);
  const [liveOrders, setLiveOrders] = useState(false);
  const [tradeLimits, setTradeLimits] = useState({ min: 5, max: 10 });
  const [botLogs, setBotLogs] = useState<{ time: number; msg: string; type: 'info' | 'success' | 'error' }[]>([]);
  const [strategy, setStrategy] = useState<'EMA_CROSS' | 'RSI_REVERSION' | 'SCALPING' | 'GRID_BOT' | 'DCA_BOT'>('EMA_CROSS');
  const [useLiquidationProtection, setUseLiquidationProtection] = useState(true);
  const [liquidationThreshold, setLiquidationThreshold] = useState('5');
  const [useMarketSentiment, setUseMarketSentiment] = useState(true);
  const [scalpingMode, setScalpingMode] = useState(false);
  const [botStats, setBotStats] = useState({ trades: 0, wins: 0, losses: 0, totalPnl: 0 });

  const [tradeHistory, setTradeHistory] = useState<any[]>([]);

  // Persistent Bot Stats from Trade History
  useEffect(() => {
    if (tradeHistory.length > 0) {
      const stats = tradeHistory.reduce((acc, trade) => {
        const pnl = Number(trade.realizedPnL || trade.pnl || 0);
        return {
          trades: acc.trades + 1,
          wins: pnl > 0 ? acc.wins + 1 : acc.wins,
          losses: pnl <= 0 ? acc.losses + 1 : acc.losses,
          totalPnl: acc.totalPnl + pnl
        };
      }, { trades: 0, wins: 0, losses: 0, totalPnl: 0 });
      setBotStats(stats);
    } else {
      setBotStats({ trades: 0, wins: 0, losses: 0, totalPnl: 0 });
    }
  }, [tradeHistory]);

  const [alerts, setAlerts] = useState<{ id: string; msg: string; type: 'success' | 'error' | 'info'; time: number }[]>([]);
  const [useAlertSound, setUseAlertSound] = useState(true);

  // View State
  const [activeView, setActiveView] = useState<'DASHBOARD' | 'HISTORY'>('DASHBOARD');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('');
  const [historySort, setHistorySort] = useState({ field: 'time', dir: 'desc' });
  const [historyPage, setHistoryPage] = useState(1);
  const historyPerPage = 15;

  // Position Size Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcBalance, setCalcBalance] = useState('1000');
  const [calcRiskPct, setCalcRiskPct] = useState('1');
  const [calcRiskFixed, setCalcRiskFixed] = useState('10');

  const walletSummary = useMemo(() => {
    const enabledAccs = accounts.filter(a => a.enabled);
    let totalFuturesBalance = 0;
    let totalSpotBalance = 0;
    let totalUnrealizedPnL = 0;
    
    enabledAccs.forEach(acc => {
      if (acc.futures) {
        totalFuturesBalance += acc.futures.walletBalance;
        totalUnrealizedPnL += acc.futures.unrealizedProfit;
      }
      if (acc.spot) {
        totalSpotBalance += acc.spot.dollarTotal;
      }
    });
    
    return {
      total: totalFuturesBalance + totalSpotBalance,
      futures: totalFuturesBalance,
      spot: totalSpotBalance,
      pnl: totalUnrealizedPnL,
      accountCount: enabledAccs.length
    };
  }, [accounts]);
  const [calcRiskMode, setCalcRiskMode] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [calcStopLoss, setCalcStopLoss] = useState('');
  const [calcEntryPrice, setCalcEntryPrice] = useState('');

  const playAlertSound = (type: 'success' | 'error' | 'info') => {
    if (!useAlertSound) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      if (type === 'success') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
      } else if (type === 'error') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(110, audioCtx.currentTime + 0.5);
      } else {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
      }

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio alert failed:', e);
    }
  };

  const addAlert = (msg: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substring(7);
    setAlerts(prev => [{ id, msg, type, time: Date.now() }, ...prev].slice(0, 5));
    playAlertSound(type);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  const calculatePositionSize = () => {
    const balance = Number(calcBalance);
    const entry = Number(calcEntryPrice) || Number(currentPrice);
    const sl = Number(calcStopLoss);
    
    if (!balance || !entry || !sl || entry === sl) return 0;

    const riskAmount = calcRiskMode === 'PERCENTAGE' 
      ? (balance * Number(calcRiskPct)) / 100 
      : Number(calcRiskFixed);
    
    const priceDiff = Math.abs(entry - sl);
    return riskAmount / priceDiff;
  };

  const recordTrade = async (trade: any) => {
    try {
      await api('/api/user/trades/record', { method: 'POST', body: { trade } });
      fetchTradeHistory();
    } catch (err) {
      console.error('Failed to record trade:', err);
    }
  };

  const closePositionInternal = async (accountId: string, symbol: string, reason: string, p?: any) => {
    try {
      const acc = accountsRef.current.find(a => a.id === accountId);
      const pos = p || acc?.futures?.positions?.find((px: any) => px.symbol === symbol);
      
      if (pos) {
        const trade = {
          accountId,
          accountLabel: acc?.label,
          symbol,
          side: pos.amount > 0 ? 'BUY' : 'SELL',
          entryPrice: pos.entryPrice,
          exitPrice: Number(currentPrice),
          quantity: Math.abs(pos.amount),
          realizedPnL: pos.unrealizedProfit,
          reason,
          duration: posStartTimeRef.current[`${accountId}_${symbol}`] ? Date.now() - posStartTimeRef.current[`${accountId}_${symbol}`] : 0,
          time: Date.now()
        };
        await recordTrade(trade);
      }

      await api('/api/futures/close', { method: 'POST', body: { accountId, symbol } });
      return true;
    } catch (err: any) {
      console.error('Failed to close position internal:', err);
      const isPermissionError = err.message.toLowerCase().includes('permission') || err.message.includes('-2015');
      
      if (isPermissionError) {
        setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, permissionError: true } : a));
        addLog(`CRITICAL: Permission denied for ${symbol}. Bot suspended for this account to avoid spam. Check Binance API settings.`, 'error');
      } else {
        addLog(`Close Failed: ${err.message}`, 'error');
      }
      return false;
    }
  };

  const fetchTradeHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api('/api/user/trades');
      setTradeHistory(data);
    } catch (err: any) {
      setStatus({ msg: err.message, ok: false });
    } finally {
      setHistoryLoading(false);
    }
  };
  const [tradeConfirm, setTradeConfirm] = useState<{ 
    side: 'BUY' | 'SELL', 
    symbol: string, 
    volume: string, 
    quantity: string, 
    tp: string, 
    sl: string,
    leverage: string,
    mode: 'PERCENTAGE' | 'FIXED'
  } | null>(null);
  const [closeConfirm, setCloseConfirm] = useState<{
    accountId: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    amount: number;
    pnl: number;
    pnlPct: number;
    reason: string;
  } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const accountsRef = React.useRef<Account[]>(accounts);
  useEffect(() => { accountsRef.current = accounts; }, [accounts]);

  // Bot tracking
  const peakProfitRef = React.useRef<Record<string, number>>({});
  const posStartTimeRef = React.useRef<Record<string, number>>({});
  const lastDcaTimeRef = React.useRef<Record<string, number>>({});
  const lastGridPriceRef = React.useRef<Record<string, number>>({});

  // New bot parameters
  const [dcaInterval, setDcaInterval] = useState('60');
  const [gridStepPct, setGridStepPct] = useState('1.0');

  // AI Autopilot
  const [autopilot, setAutopilot] = useState(false);

  // Account form
  const [newAccLabel, setNewAccLabel] = useState('');
  const [newAccGroup, setNewAccGroup] = useState('');
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
  }, [market, selectedSymbol, chartInterval]);

  useEffect(() => {
    const interval = setInterval(fetchPrice, 1000);
    const obInterval = setInterval(fetchOrderBook, 2000);
    return () => {
      clearInterval(interval);
      clearInterval(obInterval);
    };
  }, [selectedSymbol, market]);

  const fetchOrderBook = async () => {
    if (!selectedSymbol) return;
    try {
      const path = market === 'FUTURES' ? `/api/futures/depth?symbol=${selectedSymbol}&limit=10` : `/api/spot/depth?symbol=${selectedSymbol}&limit=10`;
      const data = await api(path, { auth: false });
      if (data.bids && data.asks) {
        setOrderBook({ bids: data.bids, asks: data.asks });
      }
    } catch (err) {
      console.error('Order book fetch error:', err);
    }
  };

  const fetchPrice = async () => {
    if (!selectedSymbol) return;
    try {
      const endpoint = market === 'FUTURES' ? '/api/futures/price' : '/api/spot/price';
      const data = await api(`${endpoint}?symbol=${encodeURIComponent(selectedSymbol)}`, { auth: false });
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
      const endpoint = market === 'FUTURES' ? '/api/futures/klines' : '/api/spot/klines';
<<<<<<< HEAD
      const data = await api(`${endpoint}?symbol=${encodeURIComponent(selectedSymbol)}&interval=${chartInterval}&limit=100`, { auth: false });
      
=======
      const data = await api(`${endpoint}?symbol=${encodeURIComponent(selectedSymbol)}&interval=1m&limit=100`, { auth: false });

>>>>>>> f6b4c9e (Auto-sync)
      if (!Array.isArray(data)) {
        console.error('Klines data is not an array:', data);
        throw new Error(`Invalid klines data format: expected array, got ${typeof data}`);
      }

      if (data.length > 0 && !Array.isArray(data[0])) {
        console.error('Klines data elements are not arrays:', data[0]);
        throw new Error('Invalid klines data format: elements are not arrays');
      }

      const formatted = data.map((k: any) => ({
        time: k[0],
        open: Number(k[1]),
        high: Number(k[2]),
        low: Number(k[3]),
        close: Number(k[4]),
        volume: Number(k[5])
      }));
      setChartData(formatted);

      // Update current indicators for UI
      if (showMacd || useMacdHistogramFilter) {
        const closes = data.map((k: any) => Number(k[4]));
        setCurrentMacd(calculateMACD(closes));
      }
    } catch (err: any) {
      console.error('Chart load failed:', err);
      setStatus({ msg: `Chart Error: ${err.message}`, ok: false });
    }
  };

  useEffect(() => {
    let timer: any;
    if (token) {
      timer = setInterval(autoTick, 10000); // Every 10s
      autoTick();
    }
    return () => clearInterval(timer);
<<<<<<< HEAD
  }, [token, autoMode, selectedSymbol, emaShort, emaLong, tradeVol, crossCond, tpBuyPct, tpSellPct, slBuyPct, slSellPct, useRsi, rsiPeriod, rsiOverbought, rsiOversold, useRsiDivergence, useMacdHistogramFilter, macdFast, macdSlow, macdSignal, tpSlMode, tpBuyPrice, tpSellPrice, slBuyPrice, slSellPrice, useProfitFloor, useTrailingStop, maxDuration]);

  useEffect(() => {
    let interval: any;
    if (token && (autoMode || globalAutoScalp || autoPilot)) {
      runMarketScanner();
      const speed = autoPilot ? 30 : parseInt(scanInterval);
      interval = setInterval(runMarketScanner, speed * 1000);
    }
    return () => clearInterval(interval);
  }, [token, autoMode, globalAutoScalp, autoPilot, scanInterval]);

  const calculateMarketSentiment = (closes: number[]) => {
    const rsi = calculateRSI(closes, 14);
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const currentPrice = closes[closes.length - 1];

    let score = 0;
    if (currentPrice > ema20) score++;
    if (ema20 > ema50) score++;
    if (rsi > 50) score++;

    if (score >= 2) return 'BULLISH';
    if (score <= 1) return 'BEARISH';
    return 'NEUTRAL';
  };
=======
  }, [autoMode, token, selectedSymbol, emaShort, emaLong, tradeVol, crossCond, tpPct, slPct, useRsi, rsiPeriod, rsiOverbought, rsiOversold, useRsiDivergence, useMacd, macdFast, macdSlow, macdSignal]);
>>>>>>> f6b4c9e (Auto-sync)

  const calculateEMA = (data: number[], period: number) => {
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return ema;
  };

  const getSymbolFilters = (symbol: string) => {
    const s = symbols.find(x => x.symbol === symbol);
    if (!s || !s.filters) return null;
    const lot = s.filters.find((f: any) => f.filterType === "LOT_SIZE");
    return {
      stepSize: lot ? Number(lot.stepSize) : null,
      minQty: lot ? Number(lot.minQty) : null
    };
  };

  const floorToStep = (qty: number, stepSize: number) => {
    if (!stepSize || stepSize <= 0) return qty;
    const inv = 1 / stepSize;
    return Math.floor(qty * inv) / inv;
  };

  const decimalsFromStep = (stepSize: number) => {
    const s = String(stepSize);
    if (!s.includes(".")) return 0;
    return s.split(".")[1].replace(/0+$/, "").length;
  };

  const calculateQuantity = (symbol: string, notional: number, price: number) => {
    const filters = getSymbolFilters(symbol);
    let qty = notional / price;
    if (filters) {
      if (filters.stepSize) qty = floorToStep(qty, filters.stepSize);
      if (filters.minQty && qty < filters.minQty) qty = filters.minQty;
      return qty.toFixed(decimalsFromStep(filters.stepSize || 0.00001));
    }
    return qty.toFixed(5);
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
<<<<<<< HEAD
      const enabledAccounts = accountsRef.current.filter(a => a.enabled);
      if (enabledAccounts.length === 0) {
        // If no accounts enabled, we don't need to run the bot logic
        return;
      }
=======
      const effTpPct = autopilot ? 1.5 : Number(tpPct);
      const effSlPct = autopilot ? 0.75 : Number(slPct);
      const effMaxDuration = autopilot ? 30 : Number(maxDuration);
      const effTrailingStop = autopilot ? 10 : Number(trailingStop);
      const effStrategy = autopilot ? 'EMA_CROSS' : strategy;
      const effTradeVol = autopilot ? Math.max(10, tradeLimits.min) : Number(tradeVol);
      const effUseRsi = autopilot ? true : useRsi;
      const effUseMacd = autopilot ? false : useMacd;
      const effUseRsiDivergence = autopilot ? false : useRsiDivergence;
>>>>>>> f6b4c9e (Auto-sync)

      // 1. Manage existing positions (Trailing Stop & Max Duration)
      const currentPosKeys = new Set<string>();
      const symbolsWithPositions = new Set<string>();
<<<<<<< HEAD
      
      for (const acc of accountsRef.current) {
        if (!acc.enabled || acc.permissionError || !acc.futures?.positions) continue;
        
=======

      for (const acc of accounts) {
        if (!acc.enabled || !acc.futures?.positions) continue;

>>>>>>> f6b4c9e (Auto-sync)
        for (const p of acc.futures.positions) {
          const key = `${acc.id}_${p.symbol}`;
          currentPosKeys.add(key);
          symbolsWithPositions.add(p.symbol);

          // Track peak profit (USDT)
          const currentProfit = p.unrealizedProfit;
          const peak = peakProfitRef.current[key] || 0;

          // Only track peak if profit is positive and greater than previous peak
          if (currentProfit > peak && currentProfit > 0) {
            peakProfitRef.current[key] = currentProfit;
          }

<<<<<<< HEAD
          // Trailing Stop Logic: Trigger if profit drops by X% from its peak
          const tStop = (useTrailingStop || autoPilot) ? (autoPilot ? 2 : Number(trailingStop)) : 0;
=======
          // Trailing Stop Logic
          const tStop = Number(trailingStop);
>>>>>>> f6b4c9e (Auto-sync)
          if (peak > 0 && tStop > 0) {
            const initialValue = Math.abs(p.amount) * p.entryPrice;
            const dropAmount = initialValue * (tStop / 100);
            const threshold = peak - dropAmount;

            if (currentProfit < threshold) {
              const msg = `Trailing stop triggered for ${p.symbol} on ${acc.label} (Peak: $${peak.toFixed(2)}, Current: $${currentProfit.toFixed(2)}, Drop: ${tStop}% of pos)`;
              setStatus({ msg: `Auto: ${msg}`, ok: true });
              addLog(msg, 'success');
              addAlert(msg, 'success');
              await closePositionInternal(acc.id, p.symbol, 'Trailing Stop', p);
              delete peakProfitRef.current[key];
              delete posStartTimeRef.current[key];
              continue;
            }
          }

          // Profit Floor Logic: Trigger if profit drops below X% of initial trade value
          // This acts as a "Minimum Profit Lock" or "Breakeven Plus"
          const pFloor = (useProfitFloor || autoPilot) ? (autoPilot ? 0.3 : Number(profitFloorPct)) : 0;
          const initialValue = Math.abs(p.amount) * p.entryPrice;
          const floorThresholdUSDT = initialValue * (pFloor / 100);

          if (pFloor > 0 && peak > floorThresholdUSDT && currentProfit < floorThresholdUSDT) {
            const msg = `Profit floor triggered for ${p.symbol} on ${acc.label} (Floor: ${pFloor}%, Current: ${p.pnlPct.toFixed(2)}%)`;
            setStatus({ msg: `Auto: ${msg}`, ok: true });
            addLog(msg, 'success');
            addAlert(msg, 'success');
            await closePositionInternal(acc.id, p.symbol, 'Profit Floor', p);
            delete peakProfitRef.current[key];
            delete posStartTimeRef.current[key];
            continue;
          }

          // Liquidation Protection
          if (useLiquidationProtection && p.liquidationPrice > 0) {
            const liqPrice = p.liquidationPrice;
            const markPrice = p.markPrice;
            const threshold = Number(liquidationThreshold) / 100;
            
            let dist = 0;
            if (p.amount > 0) { // Long
              dist = (markPrice - liqPrice) / markPrice;
            } else { // Short
              dist = (liqPrice - markPrice) / markPrice;
            }

            if (dist <= threshold) {
              const msg = `Liquidation Protection triggered for ${p.symbol} on ${acc.label} (Dist: ${(dist * 100).toFixed(2)}%)`;
              setStatus({ msg: `Auto: ${msg}`, ok: true });
              addLog(msg, 'error');
              addAlert(msg, 'error');
              await closePositionInternal(acc.id, p.symbol, 'Liquidation Protection', p);
              delete peakProfitRef.current[key];
              delete posStartTimeRef.current[key];
              continue;
            }
          }

          // Manual TP/SL Fallback Monitoring
<<<<<<< HEAD
          let tpTriggered = false;
          let slTriggered = false;
          let triggerMsg = '';
=======
          const tp = Number(tpPct);
          const sl = Number(slPct);
          const pnl = p.pnlPct; // Percentage PnL
>>>>>>> f6b4c9e (Auto-sync)

          if (tpSlMode === 'PERCENTAGE') {
            const tp = p.amount > 0 ? Number(tpBuyPct) : Number(tpSellPct);
            const sl = p.amount > 0 ? Number(slBuyPct) : Number(slSellPct);
            const pnl = p.pnlPct;

            if (tp > 0 && pnl >= tp) {
              tpTriggered = true;
              triggerMsg = `Take Profit hit (${pnl.toFixed(2)}%)`;
            } else if (sl > 0 && pnl <= -sl) {
              slTriggered = true;
              triggerMsg = `Stop Loss hit (${pnl.toFixed(2)}%)`;
            }
          } else {
            const tpPrice = p.amount > 0 ? Number(tpBuyPrice) : Number(tpSellPrice);
            const slPrice = p.amount > 0 ? Number(slBuyPrice) : Number(slSellPrice);
            const price = p.markPrice;

            if (p.amount > 0) { // Long
              if (tpPrice > 0 && price >= tpPrice) {
                tpTriggered = true;
                triggerMsg = `Take Profit hit at $${price}`;
              } else if (slPrice > 0 && price <= slPrice) {
                slTriggered = true;
                triggerMsg = `Stop Loss hit at $${price}`;
              }
            } else { // Short
              if (tpPrice > 0 && price <= tpPrice) {
                tpTriggered = true;
                triggerMsg = `Take Profit hit at $${price}`;
              } else if (slPrice > 0 && price >= slPrice) {
                slTriggered = true;
                triggerMsg = `Stop Loss hit at $${price}`;
              }
            }
          }

          if (tpTriggered) {
            const msg = `${triggerMsg} for ${p.symbol} on ${acc.label}`;
            setStatus({ msg: `Auto: ${msg}`, ok: true });
            addLog(msg, 'success');
            addAlert(msg, 'success');
            await closePositionInternal(acc.id, p.symbol, 'Take Profit', p);
            delete peakProfitRef.current[key];
            delete posStartTimeRef.current[key];
            continue;
          }

          if (slTriggered) {
            const msg = `${triggerMsg} for ${p.symbol} on ${acc.label}`;
            setStatus({ msg: `Auto: ${msg}`, ok: true });
            addLog(msg, 'error');
            addAlert(msg, 'error');
            await closePositionInternal(acc.id, p.symbol, 'Stop Loss', p);
            delete peakProfitRef.current[key];
            delete posStartTimeRef.current[key];
            continue;
          }

          // Max Duration Logic
          if (!posStartTimeRef.current[key]) {
            // Try to find start time from trades
            try {
              const trades = await api(`/api/futures/trades?accountId=${encodeURIComponent(acc.id)}&symbol=${encodeURIComponent(p.symbol)}`);
              if (trades.length > 0) {
                // Use the most recent trade time
                posStartTimeRef.current[key] = trades[trades.length - 1].time;
              } else {
                posStartTimeRef.current[key] = Date.now();
              }
            } catch {
              posStartTimeRef.current[key] = Date.now();
            }
          }

          const startTime = posStartTimeRef.current[key];
<<<<<<< HEAD
          const maxMin = Number(maxDuration);
          if (useMaxDuration && startTime && maxMin > 0) {
=======
          const maxMin = effMaxDuration;
          if (startTime && maxMin > 0) {
>>>>>>> f6b4c9e (Auto-sync)
            const elapsedMin = (Date.now() - startTime) / 60000;
            if (elapsedMin > maxMin) {
              const msg = `Max duration reached for ${p.symbol} on ${acc.label}`;
              setStatus({ msg: `Auto: ${msg}`, ok: true });
              addLog(msg, 'info');
              await closePositionInternal(acc.id, p.symbol, 'Max Duration', p);
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

<<<<<<< HEAD
      // 2. Detect new signals (Only if Auto Scalper is ON)
      if (!autoMode) {
        return;
      }

      // Skip if we already have a position for this symbol
      if (symbolsWithPositions.has(selectedSymbol)) {
=======
      // 2. Detect new signals
      // Skip if we already have a position for this symbol (unless DCA_BOT is averaging)
      if (symbolsWithPositions.has(selectedSymbol) && effStrategy !== 'DCA_BOT') {
        return;
      }

      // Stop entering new trades if internal wallet has zero or negative balance
      if (wallet.balance <= 0) {
        setStatus({ msg: 'Auto: Bot paused. Internal Wallet balance is low.', ok: false });
>>>>>>> f6b4c9e (Auto-sync)
        return;
      }

      const klines = await api(`/api/futures/klines?symbol=${encodeURIComponent(selectedSymbol)}&interval=1m&limit=250`, { auth: false });
      const closes = klines.map((k: any) => Number(k[4]));
<<<<<<< HEAD
      const volumes = klines.map((k: any) => Number(k[5]));
      
      // Update current indicators for UI
      if (showMacd || useMacdHistogramFilter) {
=======

      // Update current indicators for UI
      if (effUseMacd) {
>>>>>>> f6b4c9e (Auto-sync)
        setCurrentMacd(calculateMACD(closes));
      }

      let signal = false;
      let side: 'BUY' | 'SELL' = 'BUY';

<<<<<<< HEAD
      // Common Indicators
      const avgVol = volumes.slice(-20).reduce((a: number, b: number) => a + b, 0) / 20;
      const currentVol = volumes[volumes.length - 1];
      const volSpike = useVolumeSpike ? (currentVol > avgVol * (1 + Number(volumeSpikeThreshold) / 100)) : true;

      if (strategy === 'EMA_CROSS') {
=======
      if (effStrategy === 'EMA_CROSS') {
>>>>>>> f6b4c9e (Auto-sync)
        const shortP = Number(emaShort);
        const longP = Number(emaLong);

        const eShort = calculateEMA(closes, shortP);
        const eLong = calculateEMA(closes, longP);

        const prevCloses = closes.slice(0, -1);
        const prevShort = calculateEMA(prevCloses, shortP);
        const prevLong = calculateEMA(prevCloses, longP);

        if (crossCond === 'UP') {
          if (prevShort <= prevLong && eShort > eLong && volSpike) signal = true;
          side = 'BUY';
        } else {
          if (prevShort >= prevLong && eShort < eLong && volSpike) signal = true;
          side = 'SELL';
        }
      } else if (effStrategy === 'RSI_REVERSION') {
        const rsiVal = calculateRSI(closes, Number(rsiPeriod));
        if (rsiVal < Number(rsiOversold) && volSpike) {
          signal = true;
          side = 'BUY';
        } else if (rsiVal > Number(rsiOverbought) && volSpike) {
          signal = true;
          side = 'SELL';
        }
<<<<<<< HEAD
      } else if (strategy === 'SCALPING') {
        // Scalping: EMA 5/13 cross + RSI confirmation on 1m + EMA 200 Trend Filter + Volume Spike
        const e5 = calculateEMA(closes, 5);
        const e13 = calculateEMA(closes, 13);
        const e200 = calculateEMA(closes, 200);
        const rsi = calculateRSI(closes, 14);
        
        const prevCloses = closes.slice(0, -1);
        const pE5 = calculateEMA(prevCloses, 5);
        const pE13 = calculateEMA(prevCloses, 13);

        if (pE5 <= pE13 && e5 > e13 && rsi < 60 && closes[closes.length - 1] > e200 && volSpike) {
          signal = true;
          side = 'BUY';
        } else if (pE5 >= pE13 && e5 < e13 && rsi > 40 && closes[closes.length - 1] < e200 && volSpike) {
          signal = true;
          side = 'SELL';
        }
      }

      // Market Sentiment Filter
      if (signal && useMarketSentiment) {
        const sentiment = calculateMarketSentiment(closes);
        if (side === 'BUY' && sentiment === 'BEARISH') signal = false;
        if (side === 'SELL' && sentiment === 'BULLISH') signal = false;
=======
      } else if (effStrategy === 'GRID_BOT') {
        const lastPrice = lastGridPriceRef.current[selectedSymbol];
        const currentPriceVal = closes[closes.length - 1];
        if (!lastPrice) {
          lastGridPriceRef.current[selectedSymbol] = currentPriceVal;
          // Trigger first entry
          signal = true;
          side = crossCond === 'UP' ? 'BUY' : 'SELL';
        } else {
          const pctChange = ((currentPriceVal - lastPrice) / lastPrice) * 100;
          if (pctChange <= -Number(gridStepPct)) {
            signal = true;
            side = 'BUY';
            lastGridPriceRef.current[selectedSymbol] = currentPriceVal;
          } else if (pctChange >= Number(gridStepPct)) {
            signal = true;
            side = 'SELL';
            lastGridPriceRef.current[selectedSymbol] = currentPriceVal;
          }
        }
      } else if (effStrategy === 'DCA_BOT') {
        const lastTime = lastDcaTimeRef.current[selectedSymbol] || 0;
        const now = Date.now();
        const intervalMs = Number(dcaInterval) * 60 * 1000;
        if (now - lastTime >= intervalMs) {
          signal = true;
          side = crossCond === 'UP' ? 'BUY' : 'SELL';
          lastDcaTimeRef.current[selectedSymbol] = now;
        }
>>>>>>> f6b4c9e (Auto-sync)
      }

      // RSI Confirmation (only for EMA_CROSS)
      if (signal && effStrategy === 'EMA_CROSS' && effUseRsi) {
        const rsiVal = calculateRSI(closes, Number(rsiPeriod));
        if (side === 'BUY' && rsiVal > Number(rsiOverbought)) signal = false; // Overbought, don't buy
        if (side === 'SELL' && rsiVal < Number(rsiOversold)) signal = false; // Oversold, don't sell
      }

      // RSI Divergence Confirmation
      if (signal && effUseRsiDivergence) {
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
<<<<<<< HEAD
      if (signal && useMacdHistogramFilter) {
=======
      if (signal && effUseMacd) {
>>>>>>> f6b4c9e (Auto-sync)
        const { histogram } = calculateMACD(closes);
        if (side === 'BUY' && histogram <= 0) signal = false; // Histogram must be positive for BUY
        if (side === 'SELL' && histogram >= 0) signal = false; // Histogram must be negative for SELL
      }

      // If we have a position, check for reverse signal to exit
      if (autoMode && symbolsWithPositions.has(selectedSymbol)) {
        let existingSide: 'BUY' | 'SELL' | null = null;
        for (const acc of accountsRef.current) {
          const p = acc.futures?.positions?.find(pos => pos.symbol === selectedSymbol);
          if (p && Number(p.quantity) !== 0) {
            existingSide = p.side;
            break;
          }
        }

        if (existingSide && signal && side !== existingSide) {
          const msg = `Reverse signal detected for ${selectedSymbol}. Closing ${existingSide} position.`;
          setStatus({ msg: `Auto: ${msg}`, ok: true });
          addLog(msg, 'info');
          addAlert(msg, 'info');
          
          for (const acc of accountsRef.current) {
            if (!acc.enabled) continue;
            const p = acc.futures?.positions?.find(pos => pos.symbol === selectedSymbol);
            if (p && Number(p.quantity) !== 0) {
              await closePositionInternal(acc.id, p.symbol, 'Bot Signal', p);
              const key = `${acc.id}-${p.symbol}`;
              delete peakProfitRef.current[key];
              delete posStartTimeRef.current[key];
            }
          }
        }
        return;
      }

      if (signal) {
        const msg = `${side} signal detected on ${selectedSymbol}`;
        setStatus({ msg: `Auto: ${msg}`, ok: true });
        addLog(msg, 'success');
        
        const latestPrice = closes[closes.length - 1];
        const qty = calculateQuantity(selectedSymbol, Number(tradeVol), latestPrice);
        
        const tpVal = tpSlMode === 'PERCENTAGE' ? (side === 'BUY' ? tpBuyPct : tpSellPct) : (side === 'BUY' ? tpBuyPrice : tpSellPrice);
        const slVal = tpSlMode === 'PERCENTAGE' ? (side === 'BUY' ? slBuyPct : slSellPct) : (side === 'BUY' ? slBuyPrice : slSellPrice);
        
        const validation = validateTpSl(side, tpSlMode, tpVal, slVal, latestPrice);
        if (!validation.ok) {
          addLog(`Auto: Trade skipped - ${validation.msg}`, 'error');
          return;
        }

        const body: any = {
          symbol: selectedSymbol,
          side,
          quantity: qty,
          tpSlMode
        };

        if (tpSlMode === 'PERCENTAGE') {
          body.tpPct = Number(tpVal);
          body.slPct = Number(slVal);
        } else {
          if (tpVal) body.tpPrice = Number(tpVal);
          if (slVal) body.slPrice = Number(slVal);
        }

        const tradeRes = await api('/api/futures/trade', {
          method: 'POST',
<<<<<<< HEAD
          body
=======
          body: {
            symbol: selectedSymbol,
            side,
            notional: Number(tradeVol),
            tpPct: Number(tpPct),
            slPct: Number(slPct)
          }
>>>>>>> f6b4c9e (Auto-sync)
        });

        if (tradeRes.results) {
          tradeRes.results.forEach((r: any) => {
            if (!r.ok && r.isPermissionError) {
              setAccounts(prev => prev.map(a => a.id === r.id ? { ...a, permissionError: true } : a));
              addLog(`Account ${r.id} suspended from auto-trading due to API permission error.`, 'error');
            }
          });
        }
      }
    } catch (err: any) {
      console.error('AutoTick error:', err);
      addLog(`Error: ${err.message}`, 'error');
    }
  };

  const runMarketScanner = async () => {
    if (isScanning) return;
    setIsScanning(true);
    try {
      const res = await api('/api/futures/ticker24h');
      if (Array.isArray(res)) {
        const minChange = parseFloat(minChangePct);
        const filtered = res
          .filter((t: any) => t.symbol.endsWith('USDT'))
          .map((t: any) => ({
            symbol: t.symbol,
            priceChangePercent: parseFloat(t.priceChangePercent),
            lastPrice: parseFloat(t.lastPrice),
            volume: parseFloat(t.quoteVolume),
            highPrice: parseFloat(t.highPrice),
            lowPrice: parseFloat(t.lowPrice)
          }))
          .filter((t: any) => Math.abs(t.priceChangePercent) >= minChange)
          .sort((a: any, b: any) => b.volume - a.volume);
        
        setScannedCoins(filtered.slice(0, 20));
        
        if (globalAutoScalp || autoPilot) {
          // Pick top trending coins to trade if not already in position
          const topTrending = filtered.slice(0, autoPilot ? 8 : 5);
          for (const coin of topTrending) {
            const side = coin.priceChangePercent > 0 ? 'BUY' : 'SELL';
            // Check if we already have a position in this coin
            const hasPos = accounts.some(a => a.futures?.positions?.some(p => p.symbol === coin.symbol));
            if (!hasPos) {
              await executeGlobalTrade(coin.symbol, side);
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Market Scanner Error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const executeGlobalTrade = async (symbol: string, side: 'BUY' | 'SELL') => {
    try {
      // 1. Get Max Leverage for this symbol
      let leverage = DEFAULT_LEVERAGE;
      if (maxLeverageMode) {
        try {
          const brackets = await api(`/api/futures/leverage-brackets?symbol=${symbol}`);
          if (Array.isArray(brackets) && brackets.length > 0) {
            leverage = brackets[0].brackets[0].initialLeverage;
          }
        } catch (e) {
          console.warn(`Could not fetch max leverage for ${symbol}, using default ${DEFAULT_LEVERAGE}`);
        }
      }

      // 2. Calculate Max USDT
      let tradeAmount = Number(tradeVol);
      if (maxUsdtMode || autoPilot) {
        const totalAvailable = walletSummary.futures;
        const slots = autoPilot ? 8 : 5;
        tradeAmount = (totalAvailable * 0.8) / slots;
        if (tradeAmount < MIN_TRADE_USD) tradeAmount = MIN_TRADE_USD;
        if (tradeAmount > 100) tradeAmount = 100; 
      }

      const msg = `${autoPilot ? 'AUTO PILOT' : 'Global Auto Scalp'}: Opening ${side} on ${symbol} with ${leverage}x leverage ($${tradeAmount.toFixed(2)})`;
      addLog(msg, 'info');
      
      const body: any = {
        symbol,
        side,
        notional: tradeAmount,
        tpPct: autoPilot ? 1.5 : Number(tpBuyPct), 
        slPct: autoPilot ? 1.0 : Number(slBuyPct),
        tpSlMode: 'PERCENTAGE'
      };

      await api('/api/futures/trade', {
        method: 'POST',
        body
      });
      
      addAlert(`Opened ${side} trade on ${symbol}`, 'success');
    } catch (err: any) {
      console.error(`Global Trade Failed for ${symbol}:`, err.message);
      if (err.message === 'no_enabled_accounts') {
        setStatus({ msg: 'Trade failed: No accounts are enabled for trading.', ok: false });
        addLog(`Global Trade Failed: Please enable at least one account in the dashboard.`, 'error');
        addAlert('No enabled accounts for global trade', 'error');
      } else {
        addLog(`Global Trade Failed for ${symbol}: ${err.message}`, 'error');
      }
    }
  };

  const runBacktest = async () => {
    setBacktestLoading(true);
    setBacktestResults(null);
    try {
      const limit = Number(backtestDays) * 24 * 60; // 1m candles
<<<<<<< HEAD
      const klines = await api(`/api/futures/klines?symbol=${encodeURIComponent(selectedSymbol)}&interval=1m&limit=${Math.min(limit, 1500)}`, { auth: false });
      
=======
      const klines = await api(`/api/futures/klines?symbol=${selectedSymbol}&interval=1m&limit=${Math.min(limit, 1500)}`, { auth: false });

>>>>>>> f6b4c9e (Auto-sync)
      const closes = klines.map((k: any) => Number(k[4]));
      const volumes = klines.map((k: any) => Number(k[5]));
      const times = klines.map((k: any) => Number(k[0]));

      const trades: any[] = [];
      let currentPos: { side: 'BUY' | 'SELL'; entryPrice: number; entryTime: number; peakProfit: number } | null = null;
      let totalPnl = 0;
      let wins = 0;
      let losses = 0;

      const shortP = Number(emaShort);
      const longP = Number(emaLong);
      const pFloor = useProfitFloor ? Number(profitFloorPct) : 0;
      const tStop = useTrailingStop ? Number(trailingStop) : 0;
      const maxMin = Number(maxDuration);

      // Start from index 200 to have enough data for indicators (including EMA 200)
      for (let i = 200; i < closes.length; i++) {
        const subCloses = closes.slice(0, i + 1);
        const subVolumes = volumes.slice(0, i + 1);
        const currentPrice = closes[i];
        const currentTime = times[i];

        if (currentPos) {
          // Manage position
          const pnlPct = currentPos.side === 'BUY'
            ? ((currentPrice - currentPos.entryPrice) / currentPos.entryPrice) * 100
            : ((currentPos.entryPrice - currentPrice) / currentPos.entryPrice) * 100;

          const currentProfit = (pnlPct / 100) * Number(tradeVol);
          if (currentProfit > currentPos.peakProfit && currentProfit > 0) {
            currentPos.peakProfit = currentProfit;
          }

          let closeReason = '';

          // TP/SL
<<<<<<< HEAD
          if (tpSlMode === 'PERCENTAGE') {
            const sl = currentPos.side === 'BUY' ? Number(slBuyPct) : Number(slSellPct);
            const tp = currentPos.side === 'BUY' ? Number(tpBuyPct) : Number(tpSellPct);
            if (tp > 0 && pnlPct >= tp) closeReason = 'Take Profit';
            else if (sl > 0 && pnlPct <= -sl) closeReason = 'Stop Loss';
          } else {
            const tpPrice = currentPos.side === 'BUY' ? Number(tpBuyPrice) : Number(tpSellPrice);
            const slPrice = currentPos.side === 'BUY' ? Number(slBuyPrice) : Number(slSellPrice);
            
            if (currentPos.side === 'BUY') {
              if (tpPrice > 0 && currentPrice >= tpPrice) closeReason = 'Take Profit';
              else if (slPrice > 0 && currentPrice <= slPrice) closeReason = 'Stop Loss';
            } else {
              if (tpPrice > 0 && currentPrice <= tpPrice) closeReason = 'Take Profit';
              else if (slPrice > 0 && currentPrice >= slPrice) closeReason = 'Stop Loss';
            }
          }
          
=======
          const sl = currentPos.side === 'BUY' ? slBuy : slSell;
          const tp = currentPos.side === 'BUY' ? tpBuy : tpSell;
          if (tp > 0 && pnlPct >= tp) closeReason = 'Take Profit';
          else if (sl > 0 && pnlPct <= -sl) closeReason = 'Stop Loss';

>>>>>>> f6b4c9e (Auto-sync)
          // Trailing Stop
          if (!closeReason && currentPos.peakProfit > 0 && tStop > 0) {
            const initialValue = Number(tradeVol);
            const threshold = currentPos.peakProfit - (initialValue * (tStop / 100));
            if (currentProfit < threshold) closeReason = 'Trailing Stop';
          }

          // Profit Floor
          if (!closeReason && pFloor > 0) {
            const floorThreshold = Number(tradeVol) * (pFloor / 100);
            if (currentPos.peakProfit > floorThreshold && currentProfit < floorThreshold) {
              closeReason = 'Profit Floor';
            }
          }

          // Max Duration
          if (!closeReason && useMaxDuration && maxMin > 0) {
            const elapsed = (currentTime - currentPos.entryTime) / 60000;
            if (elapsed > maxMin) closeReason = 'Max Duration';
          }

          if (closeReason) {
            trades.push({
              ...currentPos,
              exitPrice: currentPrice,
              exitTime: currentTime,
              pnl: currentProfit,
              pnlPct,
              reason: closeReason
            });
            totalPnl += currentProfit;
            if (currentProfit > 0) wins++;
            else losses++;
            currentPos = null;
          }
        } else {
          // Entry logic
          let signal = false;
          let side: 'BUY' | 'SELL' = 'BUY';

          const avgVol = subVolumes.slice(-20).reduce((a: number, b: number) => a + b, 0) / 20;
          const currentVol = subVolumes[subVolumes.length - 1];
          const volSpike = currentVol > avgVol * 1.2;

          if (strategy === 'EMA_CROSS') {
            const eShort = calculateEMA(subCloses, shortP);
            const eLong = calculateEMA(subCloses, longP);
            const prevCloses = subCloses.slice(0, -1);
            const prevShort = calculateEMA(prevCloses, shortP);
            const prevLong = calculateEMA(prevCloses, longP);

            if (crossCond === 'UP') {
              if (prevShort <= prevLong && eShort > eLong && volSpike) signal = true;
              side = 'BUY';
            } else {
              if (prevShort >= prevLong && eShort < eLong && volSpike) signal = true;
              side = 'SELL';
            }
          } else if (strategy === 'RSI_REVERSION') {
            const rsiVal = calculateRSI(subCloses, Number(rsiPeriod));
            if (rsiVal < Number(rsiOversold) && volSpike) {
              signal = true;
              side = 'BUY';
            } else if (rsiVal > Number(rsiOverbought) && volSpike) {
              signal = true;
              side = 'SELL';
            }
          } else if (strategy === 'SCALPING') {
            const e5 = calculateEMA(subCloses, 5);
            const e13 = calculateEMA(subCloses, 13);
            const e200 = calculateEMA(subCloses, 200);
            const rsi = calculateRSI(subCloses, 14);
            
            const prevCloses = subCloses.slice(0, -1);
            const pE5 = calculateEMA(prevCloses, 5);
            const pE13 = calculateEMA(prevCloses, 13);

            if (pE5 <= pE13 && e5 > e13 && rsi < 60 && currentPrice > e200 && volSpike) {
              signal = true;
              side = 'BUY';
            } else if (pE5 >= pE13 && e5 < e13 && rsi > 40 && currentPrice < e200 && volSpike) {
              signal = true;
              side = 'SELL';
            }
          }

          // MACD Confirmation (Histogram check)
          if (signal && useMacdHistogramFilter) {
            const { histogram } = calculateMACD(subCloses);
            if (side === 'BUY' && histogram <= 0) signal = false;
            if (side === 'SELL' && histogram >= 0) signal = false;
          }

          if (signal) {
            currentPos = {
              side,
              entryPrice: currentPrice,
              entryTime: currentTime,
              peakProfit: 0
            };
          }
        }
      }

      setBacktestResults({
        trades,
        stats: {
          totalTrades: trades.length,
          wins,
          losses,
          winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
          totalPnl,
          avgPnl: trades.length > 0 ? totalPnl / trades.length : 0
        }
      });
    } catch (err: any) {
      setStatus({ msg: `Backtest Error: ${err.message}`, ok: false });
    } finally {
      setBacktestLoading(false);
    }
  };

  const validateTpSl = (side: 'BUY' | 'SELL', mode: 'PERCENTAGE' | 'FIXED', tp: string, sl: string, price: number): { ok: boolean; msg: string } => {
    if (mode === 'PERCENTAGE') {
      const slVal = Number(sl);
      const tpVal = Number(tp);
      if (slVal > 15) return { ok: false, msg: 'Stop Loss cannot exceed 15% (Risk Threshold)' };
      if (slVal <= 0 && sl !== '') return { ok: false, msg: 'Stop Loss must be positive' };
      if (tpVal <= 0 && tp !== '') return { ok: false, msg: 'Take Profit must be positive' };
      return { ok: true, msg: '' };
    } else {
      const tpPrice = Number(tp);
      const slPrice = Number(sl);
      if (side === 'BUY') {
        if (tpPrice > 0 && tpPrice <= price) return { ok: false, msg: 'Take Profit must be above current price for BUY' };
        if (slPrice > 0 && slPrice >= price) return { ok: false, msg: 'Stop Loss must be below current price for BUY' };
        if (slPrice > 0) {
          const slPct = ((price - slPrice) / price) * 100;
          if (slPct > 15) return { ok: false, msg: 'Stop Loss exceeds 15% risk threshold' };
        }
      } else {
        if (tpPrice > 0 && tpPrice >= price) return { ok: false, msg: 'Take Profit must be below current price for SELL' };
        if (slPrice > 0 && slPrice <= price) return { ok: false, msg: 'Stop Loss must be above current price for SELL' };
        if (slPrice > 0) {
          const slPct = ((slPrice - price) / price) * 100;
          if (slPct > 15) return { ok: false, msg: 'Stop Loss exceeds 15% risk threshold' };
        }
      }
      return { ok: true, msg: '' };
    }
  };

  const executeTrade = async (side: 'BUY' | 'SELL', confirmed = false) => {
    const sl = side === 'BUY' ? slBuyPct : slSellPct;
    const tp = side === 'BUY' ? tpBuyPct : tpSellPct;
    const slPrice = side === 'BUY' ? slBuyPrice : slSellPrice;
    const tpPrice = side === 'BUY' ? tpBuyPrice : tpSellPrice;

    const validation = validateTpSl(
      side, 
      tpSlMode, 
      tpSlMode === 'PERCENTAGE' ? tp : tpPrice, 
      tpSlMode === 'PERCENTAGE' ? sl : slPrice, 
      Number(currentPrice)
    );

    if (!validation.ok) {
      setStatus({ msg: validation.msg, ok: false });
      return;
    }

    if (!confirmed) {
      const enabledCount = accounts.filter(a => a.enabled).length;
      if (enabledCount === 0) {
        setStatus({ msg: 'No enabled accounts to execute trade', ok: false });
        return;
      }
      const qty = calculateQuantity(selectedSymbol, Number(tradeVol), Number(currentPrice));
      setTradeConfirm({ 
        side, 
        symbol: selectedSymbol, 
        volume: tradeVol, 
        quantity: qty, 
        tp: tpSlMode === 'PERCENTAGE' ? tp : tpPrice, 
        sl: tpSlMode === 'PERCENTAGE' ? sl : slPrice,
        leverage: String(DEFAULT_LEVERAGE),
        mode: tpSlMode
      });
      return;
    }

    if (loading) return;
    setLoading(true);
    try {
      const body: any = {
        symbol: tradeConfirm?.symbol || selectedSymbol,
        side,
        quantity: tradeConfirm?.quantity,
        leverage: Number(tradeConfirm?.leverage || DEFAULT_LEVERAGE),
        tpSlMode: tradeConfirm?.mode || tpSlMode
      };

      if (body.tpSlMode === 'PERCENTAGE') {
        body.tpPct = Number(tradeConfirm?.tp);
        body.slPct = Number(tradeConfirm?.sl);
      } else {
        if (tradeConfirm?.tp) body.tpPrice = Number(tradeConfirm?.tp);
        if (tradeConfirm?.sl) body.slPrice = Number(tradeConfirm?.sl);
      }

      const res = await api('/api/futures/trade', {
        method: 'POST',
        body
      });
      if (res.msg) {
        setStatus({ msg: res.msg, ok: true });
        addLog(res.msg, 'info');
      } else {
        setStatus({ msg: `${side} order placed`, ok: true });
        addLog(`${side} order placed on ${tradeConfirm?.symbol || selectedSymbol}`, 'success');
      }
      refreshAll();
      setTradeConfirm(null);
    } catch (err: any) {
      if (err.message === 'no_enabled_accounts') {
        setStatus({ msg: 'Trade failed: No accounts are enabled for trading.', ok: false });
        addLog(`Manual Trade Failed: Please enable at least one account in the dashboard.`, 'error');
      } else {
        setStatus({ msg: err.message, ok: false });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleLiveOrders = async () => {
    try {
      setLoading(true);
      const res = await api('/api/settings/live-orders', {
        method: 'POST',
        body: { enabled: !liveOrders }
      });
      if (res.ok) {
        setLiveOrders(res.liveOrders);
        setStatus({ msg: `Live trading ${res.liveOrders ? 'enabled' : 'disabled'}`, ok: true });
      }
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

  const formatDuration = (ms: number) => {
    if (!ms) return '0s';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  };

  const api = async (path: string, options: any = {}) => {
    const { method = 'GET', body, auth = true } = options;
    const headers: any = { 'Content-Type': 'application/json' };
    if (auth && token) headers['Authorization'] = `Bearer ${token}`;

    const url = path;
    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
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
          console.warn(`Non-JSON response from ${path}:`, text.substring(0, 500));
          data = { message: text || 'Non-JSON response' };
        }

        if (!res.ok) {
          let errMsg = data.message || data.error || `API Error: ${res.status}`;
          
          // Enhanced guidance for common Binance errors
          if (errMsg.includes('Invalid API-key') || errMsg.includes('permissions for action')) {
            errMsg = "Binance Permission Error: Please ensure your API Key has 'Enable Futures' and 'Enable Spot & Margin Trading' checkmarks enabled in your Binance API settings.";
          } else if (errMsg.includes('IP') && errMsg.includes('permissions')) {
            errMsg = "Binance IP Error: Please set your Binance API Key to 'Unrestricted' IP access, as AI Studio's server IPs change frequently.";
          }
          
          throw new Error(errMsg);
        }
        return data;
      } catch (err: any) {
        attempt++;
        const isNetworkError = err.name === 'TypeError' || err.message.includes('Failed to fetch') || err.message.includes('NetworkError');

        if (attempt > maxRetries || !isNetworkError) {
          console.error('API Fetch Error Details:', {
            path,
            url,
            name: err.name,
            message: err.message,
            attempt
          });
          if (isNetworkError) {
            console.error('Network error or server unreachable:', path);
          }
          throw err;
        }
        // Wait before retry
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
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
      fetchTradeHistory();
      setLastUpdated(Date.now());
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

  const loadWallet = async () => {
    try {
      const data = await api('/api/wallet');
      if (data.ok) {
        setWallet({ balance: data.balance, transactions: data.transactions, depositAddress: data.depositAddress });
      }
    } catch (err: any) {
      console.error("Wallet load error:", err);
    }
  };

  const handleDeposit = async () => {
    if (!depositTxid.trim()) {
      setStatus({ msg: 'Please paste a Transaction Hash (TxID) first.', ok: false });
      return;
    }
    setLoading(true);
    setStatus({ msg: 'Verifying with TronScan...', ok: true });
    try {
      const data = await api('/api/wallet/deposit', { method: 'POST', body: { txid: depositTxid.trim() } });
      if (data.ok) {
        setStatus({ msg: `Successfully deposited ${data.amount.toFixed(2)} USDT!`, ok: true });
        setDepositTxid('');
        loadWallet();
      }
    } catch (err: any) {
      setStatus({ msg: err.message, ok: false });
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/accounts', {
        method: 'POST',
        body: { label: newAccLabel, group: newAccGroup, apiKey: newAccKey, apiSecret: newAccSecret }
      });
      setNewAccLabel('');
      setNewAccGroup('');
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
      const acc = accounts.find(a => a.id === id);
      if (!acc) return;
      
      const newEnabled = !acc.enabled;
      await api(`/api/accounts/${id}/toggle`, { method: 'POST' });
      
      // If enabling, clear previous permission error state
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, enabled: newEnabled, permissionError: false } : a));
      refreshAll();
    } catch (err: any) {
      setStatus({ msg: err.message, ok: false });
    }
  };

  const checkAccountPermissions = async (accountId: string) => {
    try {
      addLog(`Diagnosing API permissions for account...`, 'info');
      const res = await api('/api/futures/check-permissions', { method: 'POST', body: { accountId } });
      
      setAccounts(prev => prev.map(a => {
        if (a.id === accountId) {
          return {
            ...a,
            restrictions: res.ok ? res.restrictions : a.restrictions,
            permissionError: !res.ok && res.isPermissionError
          };
        }
        return a;
      }));

      if (res.ok) {
        if (res.canTrade) {
          addLog(`API Permissions OK. Futures trading is enabled.`, 'success');
        } else {
          addLog(`API Key has READ access but TRADING is disabled on Binance.`, 'error');
        }
      } else {
        addLog(`Permission Check Failed: ${res.error}`, 'error');
      }
    } catch (err: any) {
      addLog(`Diagnostic failed: ${err.message}`, 'error');
    }
  };

  const toggleGroup = async (groupName: string, enabled: boolean) => {
    const groupAccounts = accounts.filter(acc => (acc.group || 'Ungrouped') === groupName);
    try {
      await Promise.all(groupAccounts.map(acc =>
        api(`/api/accounts/${acc.id}/toggle`, {
          method: 'POST',
          body: { enabled } // Assuming the backend supports setting the state, otherwise we just toggle
        })
      ));
      refreshAll();
      setStatus({ msg: `Group ${groupName} ${enabled ? 'enabled' : 'disabled'}`, ok: true });
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

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    try {
      await api(`/api/accounts/${editingAccount.id}`, {
        method: 'PATCH',
        body: { label: editAccLabel, group: editAccGroup }
      });
      refreshAll();
      setEditingAccount(null);
      (document.getElementById('edit-account-modal') as HTMLDialogElement)?.close();
      setStatus({ msg: 'Account updated', ok: true });
    } catch (err: any) {
      setStatus({ msg: err.message, ok: false });
    }
  };

  const closePosition = async (accountId: string, symbol: string, reason: string = 'Manual Close') => {
    const acc = accounts.find(a => a.id === accountId);
    const pos = acc?.futures?.positions?.find(p => p.symbol === symbol);
    if (!pos) return;

    setCloseConfirm({
      accountId,
      symbol,
      side: pos.amount > 0 ? 'BUY' : 'SELL',
      amount: Math.abs(pos.amount),
      pnl: pos.unrealizedProfit,
      pnlPct: pos.pnlPct,
      reason
    });
  };

  const confirmClosePosition = async () => {
    if (!closeConfirm) return;
    const { accountId, symbol, reason } = closeConfirm;
    
    setLoading(true);
    try {
      const acc = accounts.find(a => a.id === accountId);
      const pos = acc?.futures?.positions?.find(p => p.symbol === symbol);
      
      if (pos) {
        const trade = {
          accountId,
          accountLabel: acc?.label,
          symbol,
          side: pos.amount > 0 ? 'BUY' : 'SELL',
          entryPrice: pos.entryPrice,
          exitPrice: Number(currentPrice),
          quantity: Math.abs(pos.amount),
          realizedPnL: pos.unrealizedProfit,
          reason,
          time: Date.now()
        };
        await recordTrade(trade);
      }

      await api('/api/futures/close', { method: 'POST', body: { accountId, symbol } });
      setStatus({ msg: `Closed ${symbol} position`, ok: true });
      refreshAll();
      setCloseConfirm(null);
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
<<<<<<< HEAD
            <button 
              onClick={toggleAutoPilot}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                autoPilot 
                  ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20' 
                  : 'bg-white/5 text-white/40 hover:bg-white/10'
              }`}
            >
              <Zap className={`w-4 h-4 ${autoPilot ? 'fill-current' : ''}`} />
              {autoPilot ? 'AUTO PILOT ON' : 'START AUTO PILOT'}
            </button>
            <button 
              onClick={toggleLiveOrders}
              disabled={loading}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                liveOrders 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${liveOrders ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {liveOrders ? 'Live Trading Enabled' : 'Simulation Mode'}
              </span>
            </button>
            <button 
=======
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
>>>>>>> f6b4c9e (Auto-sync)
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

<<<<<<< HEAD
        {/* Navigation */}
        <nav className="flex items-center gap-4 border-b border-white/5 pb-4">
          <button 
            onClick={() => setActiveView('DASHBOARD')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeView === 'DASHBOARD' ? 'bg-sky-500 text-black' : 'text-white/40 hover:text-white/60'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => {
              setActiveView('HISTORY');
              fetchTradeHistory();
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeView === 'HISTORY' ? 'bg-sky-500 text-black' : 'text-white/40 hover:text-white/60'}`}
          >
            Trade History
          </button>
        </nav>

        {/* Main Wallet Summary */}
        {activeView === 'DASHBOARD' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="bg-gradient-to-br from-sky-500/10 to-transparent border border-sky-500/20 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet className="w-16 h-16" />
              </div>
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2 text-sky-400">
                  <Wallet className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Main Wallet Balance</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-mono font-bold tracking-tight">
                    {walletSummary.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                  <span className="text-sm text-white/40 font-bold">USDT</span>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center gap-1 text-[10px] text-white/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Direct Binance Integration
                  </div>
                  <div className="text-[10px] text-white/40">
                    {walletSummary.accountCount} Active Accounts
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2">
              <div className="flex items-center gap-2 text-white/40">
                <TrendingUp className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Total Unrealized PnL</span>
              </div>
              <div className="flex items-baseline gap-2">
                <h2 className={`text-3xl font-mono font-bold tracking-tight ${walletSummary.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {walletSummary.pnl >= 0 ? '+' : ''}{walletSummary.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <span className="text-sm text-white/40 font-bold">USDT</span>
              </div>
              <p className="text-[10px] text-white/30">Combined profit/loss across all futures positions</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Asset Allocation</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs font-mono font-bold text-sky-400">${walletSummary.futures.toFixed(2)}</p>
                      <p className="text-[8px] text-white/20 uppercase">Futures</p>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div>
                      <p className="text-xs font-mono font-bold text-amber-400">${walletSummary.spot.toFixed(2)}</p>
                      <p className="text-[8px] text-white/20 uppercase">Spot</p>
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full border-4 border-white/5 flex items-center justify-center relative">
                  <div className="absolute inset-0 rounded-full border-4 border-sky-500/30 border-t-sky-500" style={{ transform: `rotate(${(walletSummary.futures / (walletSummary.total || 1)) * 360}deg)` }} />
                  <BarChart2 className="w-5 h-5 text-white/20" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'DASHBOARD' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Accounts & Balances */}
          <div className="lg:col-span-8 space-y-6">
            {/* Balances Grid */}
            <div className="space-y-8">
              {(Object.entries(
                accounts.reduce((groups: Record<string, Account[]>, acc) => {
                  const group = acc.group || 'Ungrouped';
                  if (!groups[group]) groups[group] = [];
                  groups[group].push(acc);
                  return groups;
                }, {})
              ) as [string, Account[]][]).map(([groupName, groupAccs]) => (
                <div key={groupName} className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-sky-400" />
                      <h2 className="text-sm font-bold uppercase tracking-widest text-white/60">{groupName}</h2>
                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/40">{groupAccs.length}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => toggleGroup(groupName, true)}
                        className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Enable All
                      </button>
                      <button 
                        onClick={() => toggleGroup(groupName, false)}
                        className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider flex items-center gap-1"
                      >
                        <Square className="w-3 h-3" />
                        Disable All
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupAccs.map((acc) => (
                <motion.div 
                  layout
                  key={acc.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${acc.permissionError ? 'bg-red-500 animate-pulse' : (acc.enabled ? 'bg-emerald-500' : 'bg-white/20')}`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm">{acc.label}</h3>
                          {acc.permissionError && (
                            <span className="text-[8px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold animate-bounce uppercase">Permission Error</span>
                          )}
                        </div>
                        <p className="text-[8px] text-white/30 uppercase tracking-wider font-mono">
                          Updated {new Date(lastUpdated).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => checkAccountPermissions(acc.id)}
                        className="p-1.5 text-white/20 hover:text-sky-400 transition-colors"
                        title="Run Diagnostics"
                      >
                        <ShieldAlert className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toggleAccount(acc.id)}
                        className={`text-xs px-2 py-1 rounded-md transition-colors ${acc.permissionError ? 'bg-red-500/20 text-red-400' : (acc.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/40')}`}
                      >
                        {acc.permissionError ? 'Action Required' : (acc.enabled ? 'Enabled' : 'Disabled')}
                      </button>
                      <button 
                        onClick={() => {
                          setEditingAccount(acc);
                          setEditAccLabel(acc.label);
                          setEditAccGroup(acc.group || '');
                          (document.getElementById('edit-account-modal') as HTMLDialogElement)?.showModal();
                        }}
                        className="p-1.5 text-white/20 hover:text-sky-400 transition-colors"
                        title="Edit Account"
                      >
                        <Settings className="w-4 h-4" />
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

                  {/* API Permissions Diagnostic */}
                  {acc.restrictions && (
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Key className="w-3 h-3 text-white/40" />
                          <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">API Permissions</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/5">
                          <div className={`w-1.5 h-1.5 rounded-full ${acc.restrictions.ipRestrict ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <span className={`text-[8px] font-mono uppercase ${acc.restrictions.ipRestrict ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {acc.restrictions.ipRestrict ? 'IP Restricted' : 'Unrestricted IP'}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Tooltip text={acc.restrictions.enableFutures ? 'Futures trading is ENABLED' : 'Futures trading is DISABLED'}>
                          <div className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${acc.restrictions.enableFutures ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-red-500/5 border-red-500/10 text-red-500/40'}`}>
                            <TrendingUp className={`w-3 h-3 mb-1 ${acc.restrictions.enableFutures ? 'opacity-100' : 'opacity-20'}`} />
                            <span className="text-[7px] font-bold uppercase tracking-tighter">Futures</span>
                          </div>
                        </Tooltip>
                        <Tooltip text={acc.restrictions.enableSpotAndMarginTrading ? 'Spot trading is ENABLED' : 'Spot trading is DISABLED'}>
                          <div className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${acc.restrictions.enableSpotAndMarginTrading ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400' : 'bg-red-500/5 border-red-500/10 text-red-500/40'}`}>
                            <Zap className={`w-3 h-3 mb-1 ${acc.restrictions.enableSpotAndMarginTrading ? 'opacity-100' : 'opacity-20'}`} />
                            <span className="text-[7px] font-bold uppercase tracking-tighter">Spot</span>
                          </div>
                        </Tooltip>
                        <Tooltip text={acc.restrictions.enableWithdrawals ? 'CRITICAL: Withdrawals are ENABLED. This is not recommended for trading bots.' : 'Withdrawals are DISABLED (Recommended)'}>
                          <div className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${acc.restrictions.enableWithdrawals ? 'bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400/40'}`}>
                            <Lock className={`w-3 h-3 mb-1 ${acc.restrictions.enableWithdrawals ? 'text-red-500' : 'text-emerald-500/40'}`} />
                            <span className="text-[7px] font-bold uppercase tracking-tighter">Withdraw</span>
                          </div>
                        </Tooltip>
                      </div>
                      {!acc.restrictions.enableFutures && (
                        <div className="flex items-start gap-1.5 p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[8px] text-amber-400 leading-tight">
                            "Enable Futures" is OFF in Binance API settings. Scalping will fail.
                          </p>
                        </div>
                      )}
                      {acc.restrictions.ipRestrict && (
                        <div className="flex items-start gap-1.5 p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[8px] text-amber-400 leading-tight">
                            IP Restriction is ON. AI Studio server IPs vary; consider switching to "Unrestricted" access if orders fail.
                          </p>
                        </div>
                      )}
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
                                    <div className="flex items-center gap-1.5">
                                      <span className="flex items-center gap-1">
                                        <span className="w-1 h-1 rounded-full bg-sky-500 animate-pulse" />
                                        <span className="text-[8px] text-sky-500/50 uppercase font-bold tracking-tighter">Live PnL</span>
                                      </span>
                                      {posStartTimeRef.current[`${acc.id}_${p.symbol}`] && (
                                        <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                          <Clock className="w-2.5 h-2.5 text-white/20" />
                                          <span className="text-[8px] font-mono text-white/40">
                                            {formatDuration(Date.now() - posStartTimeRef.current[`${acc.id}_${p.symbol}`])}
                                          </span>
                                          {useMaxDuration && Number(maxDuration) > 0 && (
                                            <span className={`text-[8px] font-bold ml-1 ${
                                              (Date.now() - posStartTimeRef.current[`${acc.id}_${p.symbol}`]) / 60000 > Number(maxDuration) * 0.8 
                                                ? 'text-amber-400' 
                                                : 'text-white/20'
                                            }`}>
                                              / {maxDuration}m
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {peakProfitRef.current[`${acc.id}_${p.symbol}`] > 0 && (
                                        <div className="flex flex-col items-end">
                                          <span className="text-[8px] font-mono text-white/30">
                                            Peak: ${peakProfitRef.current[`${acc.id}_${p.symbol}`].toFixed(2)}
                                          </span>
                                          {useTrailingStop && (
                                            <span className={`text-[7px] font-bold uppercase tracking-tighter ${
                                              ((peakProfitRef.current[`${acc.id}_${p.symbol}`] - p.unrealizedProfit) / peakProfitRef.current[`${acc.id}_${p.symbol}`] * 100) > Number(trailingStop) * 0.8 
                                                ? 'text-amber-400' 
                                                : 'text-white/20'
                                            }`}>
                                              Drop: {((peakProfitRef.current[`${acc.id}_${p.symbol}`] - p.unrealizedProfit) / peakProfitRef.current[`${acc.id}_${p.symbol}`] * 100).toFixed(1)}%
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      <span className={`text-[10px] font-mono font-medium ${p.pnlPct >= 0 ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
                                        {p.pnlPct >= 0 ? '+' : ''}{p.pnlPct.toFixed(2)}%
                                      </span>
                                    </div>
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
                  </div>
                </div>
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
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-[500px] flex flex-col overflow-hidden">
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
                  </h3>
                  <div className="flex items-center gap-1 ml-4">
                    {['1m', '5m', '15m', '1h', '4h', '1d'].map((interval) => (
                      <button
                        key={interval}
                        onClick={() => setChartInterval(interval)}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded transition-all ${chartInterval === interval ? 'bg-sky-500 text-black' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
                      >
                        {interval}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] mono text-white/40">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
                  </span>
                </div>
              </div>
              <div className="flex-1 w-full relative">
                {chartData.length > 0 ? (
                  <CandlestickChart 
                    data={chartData} 
                    emaShort={Number(emaShort)}
                    emaLong={Number(emaLong)}
                    onEmaShortChange={setEmaShort}
                    onEmaLongChange={setEmaLong}
                    showMacd={showMacd} 
                    macdFast={Number(macdFast)}
                    macdSlow={Number(macdSlow)}
                    macdSignal={Number(macdSignal)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/20">
                    <RefreshCw className="w-8 h-8 mb-2 animate-spin" />
                    <p className="text-xs">Loading chart data...</p>
=======
        {/* Tab Navigation */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'DASHBOARD' ? 'bg-sky-500 text-black' : 'text-white/40 hover:text-white/80'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('WALLET')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'WALLET' ? 'bg-sky-500 text-black' : 'text-white/40 hover:text-white/80'}`}
          >
            Internal Wallet
          </button>
        </div>

        {activeTab === 'WALLET' ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 lg:p-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold mb-2">Internal Prepaid Wallet</h2>
                <p className="text-white/50 max-w-lg text-sm">
                  The bot will automatically deduct the 30% performance fee directly from this balance instead of touching your Binance account.
                  Keep a positive balance to allow the bot to continue trading.
                </p>
              </div>
              <div className="text-right bg-black/40 p-6 rounded-2xl border border-white/5 min-w-[200px]">
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Available Balance</p>
                <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                  ${wallet.balance.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <h3 className="font-bold border-l-2 border-sky-500 pl-3">Add Funds</h3>
                <div className="bg-black/40 p-6 rounded-xl border border-white/5 space-y-4">
                  <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl relative">
                    <p className="text-xs text-sky-400 uppercase tracking-wider mb-2 font-bold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> Deposit USDT (TRC20 Network Only)
                    </p>
                    <p className="text-[10px] text-white/50 mb-2">Send USDT (Tron/TRC20) to this address. Ensure you only send TRC20, other networks will be lost.</p>
                    <div className="flex bg-black/60 rounded-lg border border-white/10 p-2 items-center justify-between">
                      <span className="font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap opacity-80 select-all pr-4">{wallet.depositAddress || "Loading..."}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(wallet.depositAddress).then(() => alert('Address copied!'))}
                        className="shrink-0 text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded"
                      >
                        COPY
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <label className="block text-xs font-medium text-white/40 uppercase tracking-wider ml-1">Paste Transaction Hash (TxID)</label>
                    <input
                      type="text"
                      value={depositTxid}
                      onChange={(e) => setDepositTxid(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50 transition-colors font-mono text-sm"
                      placeholder="e.g. 5d5a7114b7e..."
                    />
                  </div>

                  <button
                    onClick={handleDeposit}
                    disabled={loading || !depositTxid}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    {loading ? 'Verifying with Blockchain...' : 'Verify & Claim Deposit'}
                  </button>
                </div>

                {wallet.balance <= 0 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <strong>Wallet Empty!</strong>
                      <p className="mt-1 opacity-80">The trading bot has been paused. Please top up your internal wallet to resume automated trading.</p>
                    </div>
>>>>>>> f6b4c9e (Auto-sync)
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <h3 className="font-bold border-l-2 border-amber-500 pl-3">Transaction History</h3>
                <div className="bg-black/40 rounded-xl border border-white/5 overflow-hidden">
                  {wallet.transactions.length === 0 ? (
                    <div className="p-8 text-center text-white/20 text-sm">No transactions yet.</div>
                  ) : (
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-white/5">
                      {[...wallet.transactions].reverse().map(tx => (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                          <div className="space-y-1">
                            <p className="font-medium text-sm text-white/80">{tx.desc}</p>
                            <p className="text-[10px] text-white/40">{new Date(tx.time).toLocaleString()}</p>
                          </div>
                          <div className={`font-bold font-mono ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
<<<<<<< HEAD

          {/* Right Column: Controls */}
          <div className="lg:col-span-4 space-y-6">
            {/* Trading Controls */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-sky-500" />
                  Terminal
                </h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowCalculator(!showCalculator)}
                    className={`p-1.5 rounded-lg border transition-all ${showCalculator ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'}`}
                    title="Position Size Calculator"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </button>
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
              </div>

              <AnimatePresence>
                {showCalculator && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-sky-500/5 border border-sky-500/20 rounded-2xl p-4 space-y-4 mb-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-bold text-sky-400 uppercase tracking-widest">Position Size Calculator</h3>
                        <div className="flex bg-black/40 p-0.5 rounded-md border border-white/5">
                          <button
                            onClick={() => setCalcRiskMode('PERCENTAGE')}
                            className={`px-2 py-0.5 text-[8px] font-bold rounded transition-all ${calcRiskMode === 'PERCENTAGE' ? 'bg-sky-500 text-black' : 'text-white/40'}`}
                          >
                            %
                          </button>
                          <button
                            onClick={() => setCalcRiskMode('FIXED')}
                            className={`px-2 py-0.5 text-[8px] font-bold rounded transition-all ${calcRiskMode === 'FIXED' ? 'bg-sky-500 text-black' : 'text-white/40'}`}
                          >
                            $
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[8px] font-medium text-white/30 uppercase mb-1 ml-1">Account Balance</label>
                          <input 
                            type="number" 
                            value={calcBalance}
                            onChange={(e) => setCalcBalance(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none focus:border-sky-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-medium text-white/30 uppercase mb-1 ml-1">
                            {calcRiskMode === 'PERCENTAGE' ? 'Risk Percentage (%)' : 'Risk Amount ($)'}
                          </label>
                          <input 
                            type="number" 
                            value={calcRiskMode === 'PERCENTAGE' ? calcRiskPct : calcRiskFixed}
                            onChange={(e) => calcRiskMode === 'PERCENTAGE' ? setCalcRiskPct(e.target.value) : setCalcRiskFixed(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none focus:border-sky-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-medium text-white/30 uppercase mb-1 ml-1">Entry Price (Optional)</label>
                          <input 
                            type="number" 
                            value={calcEntryPrice}
                            onChange={(e) => setCalcEntryPrice(e.target.value)}
                            placeholder={currentPrice}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none focus:border-sky-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-medium text-white/30 uppercase mb-1 ml-1">Stop Loss Price</label>
                          <input 
                            type="number" 
                            value={calcStopLoss}
                            onChange={(e) => setCalcStopLoss(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none focus:border-sky-500/50"
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-sky-500/10 flex items-center justify-between">
                        <span className="text-[10px] font-medium text-white/40">Recommended Quantity:</span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-sky-400">{calculatePositionSize().toFixed(4)}</span>
                          <span className="text-[8px] text-white/20 ml-1">{selectedSymbol.replace('USDT', '')}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          const qty = calculatePositionSize();
                          if (qty > 0) {
                            const entry = Number(calcEntryPrice) || Number(currentPrice);
                            setTradeVol((qty * entry).toFixed(2));
                            setShowCalculator(false);
                          }
                        }}
                        className="w-full bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-400 text-[9px] font-bold py-1.5 rounded-lg transition-all"
                      >
                        Apply to Trade Volume
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

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
=======
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Accounts & Balances */}
            <div className="lg:col-span-8 space-y-6">
              {/* Balances Grid */}
              <div className="space-y-8">
                {(Object.entries(
                  accounts.reduce((groups: Record<string, Account[]>, acc) => {
                    const group = acc.group || 'Ungrouped';
                    if (!groups[group]) groups[group] = [];
                    groups[group].push(acc);
                    return groups;
                  }, {})
                ) as [string, Account[]][]).map(([groupName, groupAccs]) => (
                  <div key={groupName} className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-sky-400" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white/60">{groupName}</h2>
                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/40">{groupAccs.length}</span>
>>>>>>> f6b4c9e (Auto-sync)
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleGroup(groupName, true)}
                          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          Enable All
                        </button>
                        <button
                          onClick={() => toggleGroup(groupName, false)}
                          className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors uppercase tracking-wider flex items-center gap-1"
                        >
                          <Square className="w-3 h-3" />
                          Disable All
                        </button>
                      </div>
                    </div>

<<<<<<< HEAD
                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider ml-1">
                          TP/SL Mode
                        </label>
                        <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                          <button
                            onClick={() => setTpSlMode('PERCENTAGE')}
                            className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${tpSlMode === 'PERCENTAGE' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-white/40 hover:text-white/60'}`}
                          >
                            % Pct
                          </button>
                          <button
                            onClick={() => setTpSlMode('FIXED')}
                            className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${tpSlMode === 'FIXED' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-white/40 hover:text-white/60'}`}
                          >
                            $ Fixed
                          </button>
                        </div>
                      </div>

                      {tpSlMode === 'PERCENTAGE' ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                              TP on Buy (%)
                              <Tooltip text="Target profit percentage for Long (Buy) positions.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                            <input 
                              type="number" 
                              value={tpBuyPct}
                              onChange={(e) => setTpBuyPct(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                              TP on Sell (%)
                              <Tooltip text="Target profit percentage for Short (Sell) positions.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                            <input 
                              type="number" 
                              value={tpSellPct}
                              onChange={(e) => setTpSellPct(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                              SL on Buy (%)
                              <Tooltip text="Stop loss percentage for Long (Buy) positions.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                            <input 
                              type="number" 
                              value={slBuyPct}
                              onChange={(e) => setSlBuyPct(e.target.value)}
                              className={`w-full bg-black/40 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors ${Number(slBuyPct) > 15 ? 'border-red-500/50 text-red-400' : 'border-white/10'}`}
                            />
                            {Number(slBuyPct) > 15 && <p className="text-[8px] text-red-400 mt-1 ml-1">Exceeds 15% risk threshold</p>}
                          </div>
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                              SL on Sell (%)
                              <Tooltip text="Stop loss percentage for Short (Sell) positions.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                            <input 
                              type="number" 
                              value={slSellPct}
                              onChange={(e) => setSlSellPct(e.target.value)}
                              className={`w-full bg-black/40 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors ${Number(slSellPct) > 15 ? 'border-red-500/50 text-red-400' : 'border-white/10'}`}
                            />
                            {Number(slSellPct) > 15 && <p className="text-[8px] text-red-400 mt-1 ml-1">Exceeds 15% risk threshold</p>}
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                              TP on Buy (Price)
                              <Tooltip text="Target profit absolute price for Long (Buy) positions.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                            <input 
                              type="number" 
                              value={tpBuyPrice}
                              onChange={(e) => setTpBuyPrice(e.target.value)}
                              placeholder={currentPrice}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                              TP on Sell (Price)
                              <Tooltip text="Target profit absolute price for Short (Sell) positions.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                            <input 
                              type="number" 
                              value={tpSellPrice}
                              onChange={(e) => setTpSellPrice(e.target.value)}
                              placeholder={currentPrice}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                              SL on Buy (Price)
                              <Tooltip text="Stop loss absolute price for Long (Buy) positions.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                            <input 
                              type="number" 
                              value={slBuyPrice}
                              onChange={(e) => setSlBuyPrice(e.target.value)}
                              placeholder={currentPrice}
                              className={`w-full bg-black/40 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors ${slBuyPrice && Number(slBuyPrice) > 0 && ((Number(currentPrice) - Number(slBuyPrice)) / Number(currentPrice)) * 100 > 15 ? 'border-red-500/50 text-red-400' : 'border-white/10'}`}
                            />
                            {slBuyPrice && Number(slBuyPrice) > 0 && ((Number(currentPrice) - Number(slBuyPrice)) / Number(currentPrice)) * 100 > 15 && (
                              <p className="text-[8px] text-red-400 mt-1 ml-1">Exceeds 15% risk threshold</p>
                            )}
                          </div>
                          <div>
                            <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                              SL on Sell (Price)
                              <Tooltip text="Stop loss absolute price for Short (Sell) positions.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                            <input 
                              type="number" 
                              value={slSellPrice}
                              onChange={(e) => setSlSellPrice(e.target.value)}
                              placeholder={currentPrice}
                              className={`w-full bg-black/40 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors ${slSellPrice && Number(slSellPrice) > 0 && ((Number(slSellPrice) - Number(currentPrice)) / Number(currentPrice)) * 100 > 15 ? 'border-red-500/50 text-red-400' : 'border-white/10'}`}
                            />
                            {slSellPrice && Number(slSellPrice) > 0 && ((Number(slSellPrice) - Number(currentPrice)) / Number(currentPrice)) * 100 > 15 && (
                              <p className="text-[8px] text-red-400 mt-1 ml-1">Exceeds 15% risk threshold</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
=======
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {groupAccs.map((acc) => (
                        <motion.div
                          layout
                          key={acc.id}
                          className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${acc.enabled ? 'bg-emerald-500' : 'bg-white/20'}`} />
                              <div>
                                <h3 className="font-bold text-sm">{acc.label}</h3>
                                <p className="text-[8px] text-white/30 uppercase tracking-wider font-mono">
                                  Updated {new Date(lastUpdated).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </p>
                              </div>
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
>>>>>>> f6b4c9e (Auto-sync)

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
                                          <div className="flex items-center gap-1.5">
                                            <span className="flex items-center gap-1">
                                              <span className="w-1 h-1 rounded-full bg-sky-500 animate-pulse" />
                                              <span className="text-[8px] text-sky-500/50 uppercase font-bold tracking-tighter">Live PnL</span>
                                            </span>
                                            {peakProfitRef.current[`${acc.id}_${p.symbol}`] > 0 && (
                                              <span className="text-[8px] font-mono text-white/30">
                                                Peak: ${peakProfitRef.current[`${acc.id}_${p.symbol}`].toFixed(2)}
                                              </span>
                                            )}
                                            <span className={`text-[10px] font-mono font-medium ${p.pnlPct >= 0 ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
                                              {p.pnlPct >= 0 ? '+' : ''}{p.pnlPct.toFixed(2)}%
                                            </span>
                                          </div>
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
                    </div>
                  </div>
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
<<<<<<< HEAD
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
                        <option value="SCALPING">Scalping (Fast EMA/RSI)</option>
                      </select>
                    </div>
=======
                    <TrendingUp className="w-5 h-5 text-sky-400" />
                    <h3 className="font-bold">
                      {selectedSymbol}
                      <span className={`ml-2 font-mono text-sm transition-colors duration-300 ${Number(currentPrice) > Number(prevPrice) ? 'text-emerald-400' :
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
                    <CandlestickChart
                      data={chartData}
                      showMacd={useMacd}
                      macdFast={Number(macdFast)}
                      macdSlow={Number(macdSlow)}
                      macdSignal={Number(macdSignal)}
                    />
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
>>>>>>> f6b4c9e (Auto-sync)
                  </div>
                </div>

<<<<<<< HEAD
                {autoMode && accounts.filter(a => a.enabled).length === 0 && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-2 text-amber-400 text-[10px] leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Bot is running but no accounts are enabled. Please enable at least one account in the dashboard to execute trades.</span>
                  </div>
                )}

                <div className="space-y-3">
                    {/* Settings Section */}
                    <AccordionSection
                      id="SETTINGS"
                      title="Bot Settings"
                      icon={Settings}
                      expanded={openSection === 'SETTINGS'}
                      onToggle={() => setOpenSection(openSection === 'SETTINGS' ? null : 'SETTINGS')}
                      tooltip="Live trading mode and general bot behavior."
                    >
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-white/80">Live Trading Mode</h4>
                            <p className="text-[10px] text-white/40">Enable to execute real orders on Binance.</p>
                          </div>
                          <button 
                            onClick={toggleLiveOrders}
                            disabled={loading}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${liveOrders ? 'bg-emerald-500' : 'bg-white/10'}`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${liveOrders ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                        </div>
                        
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[9px] text-amber-400 leading-relaxed">
                            <span className="font-bold">Warning:</span> Enabling live trading will execute real orders with your connected accounts. Ensure your strategy and risk parameters are correct.
                          </p>
                        </div>
                      </div>
                    </AccordionSection>
                    {/* Scanner Section */}
                    <AccordionSection
                      id="SCANNER"
                      title="Market Scanner"
                      icon={Globe}
                      expanded={openSection === 'SCANNER'}
                      onToggle={() => setOpenSection(openSection === 'SCANNER' ? null : 'SCANNER')}
                      tooltip="Scan for trending symbols and global auto-scalp options."
                    >
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-sky-400" />
                            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Global Auto Scalp</span>
                          </div>
                          <button 
                            onClick={() => setGlobalAutoScalp(!globalAutoScalp)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${globalAutoScalp ? 'bg-sky-500' : 'bg-white/10'}`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${globalAutoScalp ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[8px] text-white/30 uppercase mb-1 ml-1">Scan Interval (s)</label>
                            <input 
                              type="number" 
                              value={scanInterval}
                              onChange={(e) => setScanInterval(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none focus:border-sky-500/50"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-white/30 uppercase mb-1 ml-1">Min 24h Change (%)</label>
                            <input 
                              type="number" 
                              step="0.1"
                              value={minChangePct}
                              onChange={(e) => setMinChangePct(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] focus:outline-none focus:border-sky-500/50"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={maxLeverageMode} 
                              onChange={e => setMaxLeverageMode(e.target.checked)} 
                              className="rounded border-white/10 bg-black/40 text-sky-500" 
                            />
                            <span className="text-[10px] font-bold text-white/60">Maximum Leverage Mode</span>
                            <Tooltip text="Automatically use the maximum allowed leverage for each symbol.">
                              <Zap className="w-3 h-3 text-amber-400" />
                            </Tooltip>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={maxUsdtMode} 
                              onChange={e => setMaxUsdtMode(e.target.checked)} 
                              className="rounded border-white/10 bg-black/40 text-sky-500" 
                            />
                            <span className="text-[10px] font-bold text-white/60">Maximum USDT Mode</span>
                            <Tooltip text="Use a larger portion of available balance for trades.">
                              <DollarSign className="w-3 h-3 text-emerald-400" />
                            </Tooltip>
                          </label>
                        </div>

                        <button 
                          onClick={runMarketScanner}
                          disabled={isScanning}
                          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 font-bold py-2 rounded-lg text-[10px] transition-all flex items-center justify-center gap-2"
                        >
                          {isScanning ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                          Manual Market Scan
                        </button>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <div className="bg-white/5 px-3 py-2 border-b border-white/10 flex items-center justify-between">
                          <span className="text-[9px] font-bold text-white/60 uppercase">Profitable Coins (24h Change)</span>
                          <span className="text-[9px] text-white/40">{scannedCoins.length} found</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                          {scannedCoins.length > 0 ? (
                            <div className="divide-y divide-white/5">
                              {scannedCoins.map((coin, idx) => (
                                <div key={idx} className="p-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold">{coin.symbol}</span>
                                    <span className={`text-[9px] font-mono ${coin.priceChangePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                      {coin.priceChangePercent >= 0 ? '+' : ''}{coin.priceChangePercent.toFixed(2)}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <div className="text-right">
                                      <p className="text-[9px] font-mono text-white/80">${coin.lastPrice.toFixed(coin.lastPrice < 1 ? 4 : 2)}</p>
                                      <p className="text-[7px] text-white/20 uppercase">Vol: ${(coin.volume / 1000000).toFixed(1)}M</p>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        setSelectedSymbol(coin.symbol);
                                        setMarket('FUTURES');
                                      }}
                                      className="p-1.5 bg-sky-500/10 text-sky-400 rounded-md hover:bg-sky-500/20 transition-all"
                                    >
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center text-white/20">
                              <Search className="w-8 h-8 mx-auto mb-2 opacity-20" />
                              <p className="text-[10px]">No coins found. Try scanning.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionSection>
                    {/* Backtest Section */}
                    <AccordionSection
                      id="BACKTEST"
                      title="Backtest Simulation"
                      icon={History}
                      expanded={openSection === 'BACKTEST'}
                      onToggle={() => setOpenSection(openSection === 'BACKTEST' ? null : 'BACKTEST')}
                      tooltip="Test your strategy against historical data."
                    >
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Backtest Period (Days)</label>
                          <select 
                            value={backtestDays}
                            onChange={(e) => setBacktestDays(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-sky-500/50"
                          >
                            <option value="1">1 Day</option>
                            <option value="3">3 Days</option>
                            <option value="7">7 Days</option>
                          </select>
                        </div>
                        
                        <button 
                          onClick={runBacktest}
                          disabled={backtestLoading}
                          className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black font-bold py-2 rounded-lg text-[10px] transition-all flex items-center justify-center gap-2"
                        >
                          {backtestLoading ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Running Simulation...
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3" />
                              Start Backtest
                            </>
                          )}
                        </button>
                      </div>

                      {backtestResults && (
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                              <p className="text-[9px] text-white/40 uppercase mb-1">Win Rate</p>
                              <p className={`text-sm font-bold ${backtestResults.stats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {backtestResults.stats.winRate.toFixed(1)}%
                              </p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                              <p className="text-[9px] text-white/40 uppercase mb-1">Total PnL</p>
                              <p className={`text-sm font-bold ${backtestResults.stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                ${backtestResults.stats.totalPnl.toFixed(2)}
                              </p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                              <p className="text-[9px] text-white/40 uppercase mb-1">Total Trades</p>
                              <p className="text-sm font-bold text-white/80">{backtestResults.stats.totalTrades}</p>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                              <p className="text-[9px] text-white/40 uppercase mb-1">Avg Trade</p>
                              <p className={`text-sm font-bold ${backtestResults.stats.avgPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                ${backtestResults.stats.avgPnl.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                            <div className="bg-white/5 px-3 py-2 border-b border-white/10 flex items-center justify-between">
                              <span className="text-[9px] font-bold text-white/60 uppercase">Recent Backtest Trades</span>
                              <span className="text-[9px] text-white/40">{backtestResults.trades.length} trades</span>
                            </div>
                            <div className="max-h-48 overflow-y-auto custom-scrollbar">
                              {backtestResults.trades.length > 0 ? (
                                <table className="w-full text-[9px]">
                                  <thead className="bg-black/20 text-white/40 sticky top-0">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-medium">Time</th>
                                      <th className="px-3 py-2 text-left font-medium">Side</th>
                                      <th className="px-3 py-2 text-right font-medium">Entry</th>
                                      <th className="px-3 py-2 text-right font-medium">Exit</th>
                                      <th className="px-3 py-2 text-right font-medium">PnL ($)</th>
                                      <th className="px-3 py-2 text-right font-medium">PnL (%)</th>
                                      <th className="px-3 py-2 text-center font-medium">Duration</th>
                                      <th className="px-3 py-2 text-right font-medium">Reason</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5">
                                    {backtestResults.trades.slice().reverse().map((t, i) => {
                                      const durationMs = t.exitTime - t.entryTime;
                                      const totalMin = Math.round(durationMs / 60000);
                                      const h = Math.floor(totalMin / 60);
                                      const m = totalMin % 60;
                                      const durationStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
                                      const entryTimeStr = new Date(t.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                      
                                      return (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                          <td className="px-3 py-2 text-white/40 whitespace-nowrap">
                                            {entryTimeStr}
                                          </td>
                                          <td className={`px-3 py-2 font-bold ${t.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {t.side}
                                          </td>
                                          <td className="px-3 py-2 font-mono text-white/60 text-right">
                                            {t.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>
                                          <td className="px-3 py-2 font-mono text-white/60 text-right">
                                            {t.exitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </td>
                                          <td className={`px-3 py-2 font-mono text-right ${t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}
                                          </td>
                                          <td className={`px-3 py-2 font-mono text-right ${t.pnlPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {t.pnlPct >= 0 ? '+' : ''}{t.pnlPct.toFixed(2)}%
                                          </td>
                                          <td className="px-3 py-2 text-white/40 text-center whitespace-nowrap">
                                            {durationStr}
                                          </td>
                                          <td className="px-3 py-2 text-white/40 text-right italic">{t.reason}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              ) : (
                                <div className="p-8 text-center text-white/20 text-[10px]">No trades executed in this period</div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </AccordionSection>

                    {/* Presets Section */}
                    <AccordionSection
                      id="PRESETS"
                      title="Strategy Presets"
                      icon={Zap}
                      expanded={openSection === 'PRESETS'}
                      onToggle={() => setOpenSection(openSection === 'PRESETS' ? null : 'PRESETS')}
                      tooltip="Quickly load optimized strategy configurations."
                    >
                      <div className="grid grid-cols-1 gap-2">
                        {PRESETS_DATA.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() => {
                              if (preset.params.emaShort) setEmaShort(preset.params.emaShort);
                              if (preset.params.emaLong) setEmaLong(preset.params.emaLong);
                              if (preset.params.tpSlMode) setTpSlMode(preset.params.tpSlMode);
                              if (preset.params.tpBuyPct) setTpBuyPct(preset.params.tpBuyPct);
                              if (preset.params.tpSellPct) setTpSellPct(preset.params.tpSellPct);
                              if (preset.params.slBuyPct) setSlBuyPct(preset.params.slBuyPct);
                              if (preset.params.slSellPct) setSlSellPct(preset.params.slSellPct);
                              if (preset.params.maxDuration) {
                                setMaxDuration(preset.params.maxDuration);
                                setUseMaxDuration(Number(preset.params.maxDuration) > 0);
                              }
                              if (preset.params.trailingStop) {
                                setTrailingStop(preset.params.trailingStop);
                                setUseTrailingStop(Number(preset.params.trailingStop) > 0);
                              }
                              if (preset.params.profitFloorPct) {
                                setProfitFloorPct(preset.params.profitFloorPct);
                               // @ts-ignore
                                setUseProfitFloor(preset.params.useProfitFloor ?? true);
                              }
                              if (preset.params.strategy) setStrategy(preset.params.strategy);
                              if (preset.params.rsiPeriod) setRsiPeriod(preset.params.rsiPeriod);
                              if (preset.params.rsiOversold) setRsiOversold(preset.params.rsiOversold);
                              if (preset.params.rsiOverbought) setRsiOverbought(preset.params.rsiOverbought);
                              // @ts-ignore
                              if (preset.params.useVolumeSpike !== undefined) setUseVolumeSpike(preset.params.useVolumeSpike);
                              // @ts-ignore
                              if (preset.params.volumeSpikeThreshold) setVolumeSpikeThreshold(preset.params.volumeSpikeThreshold);
                              setStatus({ msg: `${preset.name} preset applied`, ok: true });
                            }}
                            className="group flex flex-col items-start p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-left"
                          >
                            <span className="text-[11px] font-bold text-sky-400 group-hover:text-sky-300 transition-colors uppercase tracking-wider">
                              {preset.name}
                            </span>
                            <span className="text-[9px] text-white/40 mt-1 leading-relaxed">
                              {preset.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </AccordionSection>

                    <AccordionSection
                      id="BASIC"
                      title="Basic Strategy"
                      icon={Bot}
                      expanded={openSection === 'BASIC'}
                      onToggle={() => setOpenSection(openSection === 'BASIC' ? null : 'BASIC')}
                      tooltip="Core EMA and TP/SL configuration"
                    >
                      <div className="space-y-3">
                        {/* Entry Parameters Block */}
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-3">
                          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest border-b border-white/5 pb-2 ml-1">Entry Strategy</p>
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
                              Signal Condition
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
                        </div>

                        {/* Exit Parameters Block */}
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2 ml-1">
                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Exit Strategy</p>
                            <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                                <button
                                  onClick={() => setTpSlMode('PERCENTAGE')}
                                  className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${tpSlMode === 'PERCENTAGE' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-white/40 hover:text-white/60'}`}
                                >
                                  % Pct
                                </button>
                                <button
                                  onClick={() => setTpSlMode('FIXED')}
                                  className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${tpSlMode === 'FIXED' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'text-white/40 hover:text-white/60'}`}
                                >
                                  $ Fixed
                                </button>
                            </div>
                          </div>

                          {tpSlMode === 'PERCENTAGE' ? (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                  TP (BUY %)
                                </label>
                                <input 
                                  type="number" 
                                  value={tpBuyPct}
                                  onChange={(e) => setTpBuyPct(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                  TP (SELL %)
                                </label>
                                <input 
                                  type="number" 
                                  value={tpSellPct}
                                  onChange={(e) => setTpSellPct(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                  SL (BUY %)
                                </label>
                                <input 
                                  type="number" 
                                  value={slBuyPct}
                                  onChange={(e) => setSlBuyPct(e.target.value)}
                                  className={`w-full bg-black/40 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors ${Number(slBuyPct) > 15 ? 'border-red-500/50 text-red-400' : 'border-white/10'}`}
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                  SL (SELL %)
                                </label>
                                <input 
                                  type="number" 
                                  value={slSellPct}
                                  onChange={(e) => setSlSellPct(e.target.value)}
                                  className={`w-full bg-black/40 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors ${Number(slSellPct) > 15 ? 'border-red-500/50 text-red-400' : 'border-white/10'}`}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                  TP (BUY Price)
                                </label>
                                <input 
                                  type="number" 
                                  placeholder={currentPrice}
                                  value={tpBuyPrice}
                                  onChange={(e) => setTpBuyPrice(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                  TP (SELL Price)
                                </label>
                                <input 
                                  type="number" 
                                  placeholder={currentPrice}
                                  value={tpSellPrice}
                                  onChange={(e) => setTpSellPrice(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors"
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                  SL (BUY Price)
                                </label>
                                <input 
                                  type="number" 
                                  placeholder={currentPrice}
                                  value={slBuyPrice}
                                  onChange={(e) => setSlBuyPrice(e.target.value)}
                                  className={`w-full bg-black/40 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors ${slBuyPrice && Number(slBuyPrice) > 0 && ((Number(currentPrice) - Number(slBuyPrice)) / Number(currentPrice)) * 100 > 15 ? 'border-red-500/50 text-red-400' : 'border-white/10'}`}
                                />
                              </div>
                              <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                  SL (SELL Price)
                                </label>
                                <input 
                                  type="number" 
                                  placeholder={currentPrice}
                                  value={slSellPrice}
                                  onChange={(e) => setSlSellPrice(e.target.value)}
                                  className={`w-full bg-black/40 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors ${slSellPrice && Number(slSellPrice) > 0 && ((Number(slSellPrice) - Number(currentPrice)) / Number(currentPrice)) * 100 > 15 ? 'border-red-500/50 text-red-400' : 'border-white/10'}`}
                                />
                              </div>
                            </div>
                          )}

                          {/* Profit Floor Toggle in Exit Strategy */}
                          <div className="pt-2 border-t border-white/5">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={useProfitFloor} 
                                onChange={e => setUseProfitFloor(e.target.checked)} 
                                className="rounded border-white/10 bg-black/40 text-sky-500" 
                              />
                              <span className="text-[10px] font-bold text-white/60 uppercase">Enable Profit Floor</span>
                              <Tooltip text="Once profit exceeds the floor threshold, the position will close if profit drops below this level. Seals the minimum gain.">
                                <ShieldCheck className="w-3 h-3 text-sky-400/50" />
                              </Tooltip>
                            </label>
                            {useProfitFloor && (
                              <div className="mt-2 pl-6">
                                <label className="text-[8px] text-white/30 uppercase block mb-1">Floor Lock (%)</label>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  value={profitFloorPct}
                                  onChange={(e) => setProfitFloorPct(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-sky-500/50"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Analysis Summaries */}
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center justify-between mb-2">
                             <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest border-b border-white/5 pb-1 ml-1">Trade Health</p>
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white/5 p-3 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Risk/Reward Profile</span>
                                <Activity className="w-3 h-3 text-sky-400/50" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-[8px] text-white/30 uppercase">Long (Buy)</p>
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden flex">
                                      {tpSlMode === 'PERCENTAGE' ? (
                                        <>
                                          <div className="h-full bg-emerald-500/50" style={{ width: `${(Number(tpBuyPct) / (Number(tpBuyPct) + Number(slBuyPct))) * 100}%` }} />
                                          <div className="h-full bg-rose-500/50" style={{ width: `${(Number(slBuyPct) / (Number(tpBuyPct) + Number(slBuyPct))) * 100}%` }} />
                                        </>
                                      ) : (
                                        <>
                                          <div className="h-full bg-emerald-500/50" style={{ width: '50%' }} />
                                          <div className="h-full bg-rose-500/50" style={{ width: '50%' }} />
                                        </>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-white/80 whitespace-nowrap">
                                      {tpSlMode === 'PERCENTAGE' 
                                        ? (Number(slBuyPct) > 0 ? (Number(tpBuyPct) / Number(slBuyPct)).toFixed(2) : '∞')
                                        : (slBuyPrice && tpBuyPrice && Number(slBuyPrice) !== Number(currentPrice) 
                                            ? (Math.abs(Number(tpBuyPrice) - Number(currentPrice)) / Math.abs(Number(currentPrice) - Number(slBuyPrice))).toFixed(2) 
                                            : '0.00')} R
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[8px] text-white/30 uppercase">Short (Sell)</p>
                                  <div className="flex items-center gap-2">
                                    <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden flex">
                                      {tpSlMode === 'PERCENTAGE' ? (
                                        <>
                                          <div className="h-full bg-emerald-500/50" style={{ width: `${(Number(tpSellPct) / (Number(tpSellPct) + Number(slSellPct))) * 100}%` }} />
                                          <div className="h-full bg-rose-500/50" style={{ width: `${(Number(slSellPct) / (Number(tpSellPct) + Number(slSellPct))) * 100}%` }} />
                                        </>
                                      ) : (
                                        <>
                                          <div className="h-full bg-emerald-500/50" style={{ width: '50%' }} />
                                          <div className="h-full bg-rose-500/50" style={{ width: '50%' }} />
                                        </>
                                      )}
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-white/80 whitespace-nowrap">
                                      {tpSlMode === 'PERCENTAGE' 
                                        ? (Number(slSellPct) > 0 ? (Number(tpSellPct) / Number(slSellPct)).toFixed(2) : '∞')
                                        : (slSellPrice && tpSellPrice && Number(slSellPrice) !== Number(currentPrice) 
                                            ? (Math.abs(Number(currentPrice) - Number(tpSellPrice)) / Math.abs(Number(slSellPrice) - Number(currentPrice))).toFixed(2) 
                                            : '0.00')} R
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={useMaxDuration} 
                                onChange={e => setUseMaxDuration(e.target.checked)} 
                                className="rounded border-white/10 bg-black/40 text-sky-500" 
                              />
                              <span className="text-[10px] font-bold text-white/60">Max Position Duration</span>
                              <Tooltip text="Automatically close positions after a specified time limit.">
                                <Clock className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                          </div>
                          {useMaxDuration && (
                            <div className="pl-6">
                              <label className="flex items-center gap-1.5 text-[8px] text-white/30 uppercase mb-1">
                                Duration (minutes)
                                <Tooltip text="The maximum time a position can remain open.">
                                  <Info className="w-2.5 h-2.5" />
                                </Tooltip>
                              </label>
                              <input 
                                type="number" 
                                value={maxDuration}
                                onChange={(e) => setMaxDuration(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-sky-500/50 transition-colors"
                              />
                            </div>
                          )}
                        </div>

                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={useMarketSentiment} 
                                onChange={e => setUseMarketSentiment(e.target.checked)} 
                                className="rounded border-white/10 bg-black/40 text-sky-500" 
                              />
                              <span className="text-[10px] font-bold text-white/60">Market Sentiment Filter</span>
                              <Tooltip text="Only enter trades that align with the overall market trend (Bullish/Bearish).">
                                <TrendingUp className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                          </div>
                        </div>
                      </div>
                    </AccordionSection>

                    <AccordionSection
                      id="RISK"
                      title="Risk Management"
                      icon={ShieldCheck}
                      expanded={openSection === 'RISK'}
                      onToggle={() => setOpenSection(openSection === 'RISK' ? null : 'RISK')}
                      tooltip="Trailing stop, Liquidation & Profit floor"
                    >
                      <div className="space-y-3">
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={useLiquidationProtection} 
                                onChange={e => setUseLiquidationProtection(e.target.checked)} 
                                className="rounded border-white/10 bg-black/40 text-sky-500" 
                              />
                              <span className="text-[10px] font-bold text-white/60">Liquidation Protection</span>
                              <Tooltip text="Automatically close positions if they get too close to the liquidation price.">
                                <ShieldAlert className="w-3 h-3 text-white/20 hover:text-red-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                          </div>
                          {useLiquidationProtection && (
                            <div className="pl-6">
                              <label className="flex items-center gap-1.5 text-[8px] text-white/30 uppercase mb-1">
                                Distance Threshold (%)
                                <Tooltip text="Trigger protection when mark price is within X% of liquidation price.">
                                  <Info className="w-2.5 h-2.5" />
                                </Tooltip>
                              </label>
                              <input 
                                type="number" 
                                value={liquidationThreshold}
                                onChange={(e) => setLiquidationThreshold(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-sky-500/50 transition-colors"
                              />
                            </div>
                          )}
                        </div>

                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={useAlertSound} 
                                onChange={e => setUseAlertSound(e.target.checked)} 
                                className="rounded border-white/10 bg-black/40 text-sky-500" 
                              />
                              <span className="text-[10px] font-bold text-white/60">Audible Alerts</span>
                              <Tooltip text="Play a sound when a trade is closed by TP, SL, or Trailing Stop.">
                                {useAlertSound ? <Bell className="w-3 h-3 text-sky-400" /> : <BellOff className="w-3 h-3 text-white/20" />}
                              </Tooltip>
                            </label>
                          </div>
                        </div>

                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={useTrailingStop} 
                                onChange={e => setUseTrailingStop(e.target.checked)} 
                                className="rounded border-white/10 bg-black/40 text-sky-500" 
                              />
                              <span className="text-[10px] font-bold text-white/60">Trailing Stop Loss</span>
                              <Tooltip text="Automatically close positions when profit drops by a certain percentage of the position size from its peak profit.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                          </div>
                          {useTrailingStop && (
                            <div className="mt-2 pl-6">
                              <label className="flex items-center gap-1.5 text-[8px] text-white/30 uppercase mb-1">
                                Trailing Stop Percentage (%)
                              </label>
                              <input 
                                type="number" 
                                step="0.1"
                                value={trailingStop}
                                onChange={(e) => setTrailingStop(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionSection>

                    <AccordionSection
                      id="INDICATORS"
                      title="Confirmation Indicators"
                      icon={TrendingUp}
                      expanded={openSection === 'INDICATORS'}
                      onToggle={() => setOpenSection(openSection === 'INDICATORS' ? null : 'INDICATORS')}
                      tooltip="RSI, Volume and MACD filters"
                    >
                      <div className="space-y-3">
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
=======
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
                          <SymbolSelector
                            selectedSymbol={selectedSymbol}
                            setSelectedSymbol={setSelectedSymbol}
                            symbols={symbols}
                            symbolSearch={symbolSearch}
                            setSymbolSearch={setSymbolSearch}
                            isSymbolListOpen={isSymbolListOpen}
                            setIsSymbolListOpen={setIsSymbolListOpen}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                            TP on Buy (%)
                            <Tooltip text="Target profit percentage for Long (Buy) positions.">
                              <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                            </Tooltip>
                          </label>
                          <input
                            type="number"
                            value={tpBuyPct}
                            onChange={(e) => setTpBuyPct(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                            TP on Sell (%)
                            <Tooltip text="Target profit percentage for Short (Sell) positions.">
                              <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                            </Tooltip>
                          </label>
                          <input
                            type="number"
                            value={tpSellPct}
                            onChange={(e) => setTpSellPct(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                            SL on Buy (%)
                            <Tooltip text="Stop loss percentage for Long (Buy) positions.">
                              <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                            </Tooltip>
                          </label>
                          <input
                            type="number"
                            value={slBuyPct}
                            onChange={(e) => setSlBuyPct(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                            SL on Sell (%)
                            <Tooltip text="Stop loss percentage for Short (Sell) positions.">
                              <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                            </Tooltip>
                          </label>
                          <input
                            type="number"
                            value={slSellPct}
                            onChange={(e) => setSlSellPct(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {market === 'SPOT' && (
                    <div className="mb-4">
                      <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">Symbol</label>
                      <SymbolSelector
                        selectedSymbol={selectedSymbol}
                        setSelectedSymbol={setSelectedSymbol}
                        symbols={symbols}
                        symbolSearch={symbolSearch}
                        setSymbolSearch={setSymbolSearch}
                        isSymbolListOpen={isSymbolListOpen}
                        setIsSymbolListOpen={setIsSymbolListOpen}
                      />
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
                          <option value="GRID_BOT">Grid Bot (Simulated)</option>
                          <option value="DCA_BOT">DCA Accumulator</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex bg-sky-500/10 rounded-xl border border-sky-500/20 p-1 mb-4 hidden sm:flex">
                      <button
                        onClick={() => setAutopilot(!autopilot)}
                        className={`flex-1 flex justify-center items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${autopilot ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20' : 'text-sky-400 hover:bg-sky-500/10'}`}
                      >
                        <Bot className="w-4 h-4" />
                        AI AUTOPILOT: {autopilot ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <button
                      onClick={() => setAutoMode(!autoMode)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${autoMode ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-sky-500 text-black shadow-lg shadow-sky-500/20'}`}
                    >
                      {autoMode ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                      {autoMode ? 'STOP' : 'START'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {!autopilot ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        {/* Section Tabs */}
                        <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                          {(['BASIC', 'RISK', 'INDICATORS', 'PRESETS', 'BACKTEST'] as const).map((s) => (
                            <Tooltip key={s} text={
                              s === 'BASIC' ? 'Core strategy parameters like EMA periods and entry conditions.' :
                                s === 'RISK' ? 'Risk management settings including max duration and trailing stop.' :
                                  s === 'INDICATORS' ? 'Advanced technical filters like RSI and MACD confirmation.' :
                                    s === 'PRESETS' ? 'Quickly apply pre-configured strategy templates.' :
                                      'Test your current strategy against historical data.'
                            }>
                              <button
                                onClick={() => setOpenSection(s)}
                                className={`w-full py-1.5 text-[9px] font-bold rounded-lg transition-all ${openSection === s
                                    ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20'
                                    : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                                  }`}
                              >
                                {s}
                              </button>
                            </Tooltip>
                          ))}
                        </div>

                        <AnimatePresence mode="wait">
                          {openSection === 'BACKTEST' && (
                            <motion.div
                              key="backtest"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="space-y-4"
                            >
                              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Backtest Period (Days)</label>
                                  <select
                                    value={backtestDays}
                                    onChange={(e) => setBacktestDays(e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] focus:outline-none focus:border-sky-500/50"
                                  >
                                    <option value="1">1 Day</option>
                                    <option value="3">3 Days</option>
                                    <option value="7">7 Days</option>
                                  </select>
                                </div>

                                <button
                                  onClick={runBacktest}
                                  disabled={backtestLoading}
                                  className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black font-bold py-2 rounded-lg text-[10px] transition-all flex items-center justify-center gap-2"
                                >
                                  {backtestLoading ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      Running Simulation...
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3 h-3" />
                                      Start Backtest
                                    </>
                                  )}
                                </button>
>>>>>>> f6b4c9e (Auto-sync)
                              </div>

                              {backtestResults && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                      <p className="text-[9px] text-white/40 uppercase mb-1">Win Rate</p>
                                      <p className={`text-sm font-bold ${backtestResults.stats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {backtestResults.stats.winRate.toFixed(1)}%
                                      </p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                      <p className="text-[9px] text-white/40 uppercase mb-1">Total PnL</p>
                                      <p className={`text-sm font-bold ${backtestResults.stats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        ${backtestResults.stats.totalPnl.toFixed(2)}
                                      </p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                      <p className="text-[9px] text-white/40 uppercase mb-1">Total Trades</p>
                                      <p className="text-sm font-bold text-white/80">{backtestResults.stats.totalTrades}</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                                      <p className="text-[9px] text-white/40 uppercase mb-1">Avg Trade</p>
                                      <p className={`text-sm font-bold ${backtestResults.stats.avgPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        ${backtestResults.stats.avgPnl.toFixed(2)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                                    <div className="bg-white/5 px-3 py-2 border-b border-white/10 flex items-center justify-between">
                                      <span className="text-[9px] font-bold text-white/60 uppercase">Recent Backtest Trades</span>
                                      <span className="text-[9px] text-white/40">{backtestResults.trades.length} trades</span>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                      {backtestResults.trades.length > 0 ? (
                                        <table className="w-full text-[9px]">
                                          <thead className="bg-black/20 text-white/40 sticky top-0">
                                            <tr>
                                              <th className="px-3 py-2 text-left font-medium">Side</th>
                                              <th className="px-3 py-2 text-left font-medium">PnL</th>
                                              <th className="px-3 py-2 text-left font-medium">Reason</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-white/5">
                                            {backtestResults.trades.slice().reverse().map((t, i) => (
                                              <tr key={i} className="hover:bg-white/5 transition-colors">
                                                <td className={`px-3 py-2 font-bold ${t.side === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                  {t.side}
                                                </td>
                                                <td className={`px-3 py-2 font-mono ${t.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                  {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}
                                                </td>
                                                <td className="px-3 py-2 text-white/40">{t.reason}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      ) : (
                                        <div className="p-8 text-center text-white/20 text-[10px]">No trades executed in this period</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}

<<<<<<< HEAD
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
                              <input type="checkbox" checked={useVolumeSpike} onChange={e => setUseVolumeSpike(e.target.checked)} className="rounded border-white/10 bg-black/40 text-sky-500" />
                              <span className="text-[10px] font-bold text-white/60">Volume Spike Detection</span>
                              <Tooltip text="Only enter trades if current volume is significantly higher than average.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                          </div>
                          {useVolumeSpike && (
                            <div className="pl-6">
                              <label className="flex items-center gap-1 text-[8px] text-white/30 uppercase mb-1">
                                Threshold (%)
                                <Tooltip text="Percentage above average volume required for a signal.">
                                  <Info className="w-2.5 h-2.5" />
                                </Tooltip>
                              </label>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="range" 
                                  min="5" 
                                  max="200" 
                                  step="5"
                                  value={volumeSpikeThreshold} 
                                  onChange={e => setVolumeSpikeThreshold(e.target.value)} 
                                  className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-sky-500" 
                                />
                                <span className="text-[10px] font-mono text-sky-400 w-8 text-right">{volumeSpikeThreshold}%</span>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={showMacd} onChange={e => setShowMacd(e.target.checked)} className="rounded border-white/10 bg-black/40 text-sky-500" />
                              <span className="text-[10px] font-bold text-white/60">Show MACD Chart</span>
                              <Tooltip text="Display the MACD indicator pane below the main chart.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                          </div>

                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={useMacdHistogramFilter} onChange={e => setUseMacdHistogramFilter(e.target.checked)} className="rounded border-white/10 bg-black/40 text-sky-500" />
                              <span className="text-[10px] font-bold text-white/60">MACD Histogram Filter</span>
                              <Tooltip text="Momentum Confirmation: BUY only if Histogram > 0, SELL only if Histogram < 0.">
                                <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                              </Tooltip>
                            </label>
                          </div>
                          {(showMacd || useMacdHistogramFilter) && (
                            <div className="pl-6 space-y-3">
                              <div className="bg-sky-500/5 border border-sky-500/10 rounded-lg p-2 mb-2">
                                <p className="text-[9px] text-sky-400/80 leading-relaxed">
                                  <span className="font-bold">Signal Rule:</span> BUY requires positive histogram (bullish momentum). SELL requires negative histogram (bearish momentum).
                                </p>
=======
                          {openSection === 'PRESETS' && (
                            <motion.div
                              key="presets"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="space-y-3"
                            >
                              <div className="grid grid-cols-1 gap-2">
                                {PRESETS_DATA.map((preset) => (
                                  <button
                                    key={preset.name}
                                    onClick={() => {
                                      if (preset.params.emaShort) setEmaShort(preset.params.emaShort);
                                      if (preset.params.emaLong) setEmaLong(preset.params.emaLong);
                                      if (preset.params.tpBuyPct) setTpBuyPct(preset.params.tpBuyPct);
                                      if (preset.params.tpSellPct) setTpSellPct(preset.params.tpSellPct);
                                      if (preset.params.slPct) {
                                        setSlPct(preset.params.slPct);
                                        setSlBuyPct(preset.params.slPct);
                                        setSlSellPct(preset.params.slPct);
                                      }
                                      if (preset.params.maxDuration) setMaxDuration(preset.params.maxDuration);
                                      if (preset.params.trailingStop) setTrailingStop(preset.params.trailingStop);
                                      if (preset.params.profitFloor) setProfitFloorPct(preset.params.profitFloor);
                                      if (preset.params.strategy) setStrategy(preset.params.strategy);
                                      if (preset.params.rsiPeriod) setRsiPeriod(preset.params.rsiPeriod);
                                      if (preset.params.rsiOversold) setRsiOversold(preset.params.rsiOversold);
                                      if (preset.params.rsiOverbought) setRsiOverbought(preset.params.rsiOverbought);
                                      setStatus({ msg: `${preset.name} preset applied`, ok: true });
                                    }}
                                    className="group flex flex-col items-start p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-left"
                                  >
                                    <span className="text-[11px] font-bold text-sky-400 group-hover:text-sky-300 transition-colors uppercase tracking-wider">
                                      {preset.name}
                                    </span>
                                    <span className="text-[9px] text-white/40 mt-1 leading-relaxed">
                                      {preset.desc}
                                    </span>
                                  </button>
                                ))}
>>>>>>> f6b4c9e (Auto-sync)
                              </div>
                            </motion.div>
                          )}
<<<<<<< HEAD
                        </div>
                      </div>
                    </AccordionSection>
                </div>


                <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center justify-between text-[10px] mono text-white/60">
                    <span>Status:</span>
                    <span className={autoMode ? 'text-sky-400 animate-pulse' : ''}>{autoMode ? 'RUNNING' : 'IDLE'}</span>
                  </div>
                  <div className="mt-1 text-[10px] mono text-white/30 truncate">
                    {autoMode ? `Monitoring ${selectedSymbol} (${strategy})...` : 'Waiting for activation...'}
=======

                          {openSection === 'BASIC' && (
                            <motion.div
                              key="basic"
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="space-y-3"
                            >
                              {(strategy === 'EMA_CROSS' || strategy === 'RSI_REVERSION') ? (
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
                              ) : strategy === 'GRID_BOT' ? (
                                <div>
                                  <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                    Grid Step %
                                    <Tooltip text="Percentage distance between grids. Triggers a buy/sell when price moves this much from last grid.">
                                      <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                                    </Tooltip>
                                  </label>
                                  <input
                                    type="number"
                                    value={gridStepPct}
                                    onChange={(e) => setGridStepPct(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors"
                                  />
                                </div>
                              ) : strategy === 'DCA_BOT' ? (
                                <div>
                                  <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                    Buy Interval (minutes)
                                    <Tooltip text="How often to automatically accumulate the trade volume dollar amount.">
                                      <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                                    </Tooltip>
                                  </label>
                                  <input
                                    type="number"
                                    value={dcaInterval}
                                    onChange={(e) => setDcaInterval(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors"
                                  />
                                </div>
                              ) : null}
                              <div>
                                <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                  Direction / Condition
                                  <Tooltip text="For signals, whether to buy or sell. For DCA, whether to accumulate Longs or Shorts.">
                                    <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                                  </Tooltip>
                                </label>
                                <select
                                  value={crossCond}
                                  onChange={(e) => setCrossCond(e.target.value as any)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors appearance-none"
                                >
                                  <option value="UP">{strategy === 'DCA_BOT' || strategy === 'GRID_BOT' ? 'Bullish Bias (BUY/LONG)' : 'Short crosses Long UP (BUY)'}</option>
                                  <option value="DOWN">{strategy === 'DCA_BOT' || strategy === 'GRID_BOT' ? 'Bearish Bias (SELL/SHORT)' : 'Short crosses Long DOWN (SELL)'}</option>
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
                                    <Tooltip text="Defines the maximum time (in minutes) a position can remain open before being automatically closed.">
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
                                    Trailing Stop Loss (%)
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
                                <div>
                                  <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                    Profit Floor (%)
                                    <Tooltip text="Closes the position if unrealized profit drops below this percentage of the initial trade value. Only activates once profit has exceeded this threshold.">
                                      <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                                    </Tooltip>
                                  </label>
                                  <input
                                    type="number"
                                    value={profitFloorPct}
                                    onChange={(e) => setProfitFloorPct(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                    TP on Buy (%)
                                    <Tooltip text="Target profit percentage for Long (Buy) positions.">
                                      <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                                    </Tooltip>
                                  </label>
                                  <input
                                    type="number"
                                    value={tpBuyPct}
                                    onChange={(e) => setTpBuyPct(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors"
                                  />
                                </div>
                                <div>
                                  <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                    TP on Sell (%)
                                    <Tooltip text="Target profit percentage for Short (Sell) positions.">
                                      <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                                    </Tooltip>
                                  </label>
                                  <input
                                    type="number"
                                    value={tpSellPct}
                                    onChange={(e) => setTpSellPct(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors"
                                  />
                                </div>
                                <div>
                                  <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                    SL on Buy (%)
                                    <Tooltip text="Stop loss percentage for Long (Buy) positions.">
                                      <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                                    </Tooltip>
                                  </label>
                                  <input
                                    type="number"
                                    value={slBuyPct}
                                    onChange={(e) => setSlBuyPct(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500/50 transition-colors"
                                  />
                                </div>
                                <div>
                                  <label className="flex items-center gap-1.5 text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">
                                    SL on Sell (%)
                                    <Tooltip text="Stop loss percentage for Short (Sell) positions.">
                                      <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                                    </Tooltip>
                                  </label>
                                  <input
                                    type="number"
                                    value={slSellPct}
                                    onChange={(e) => setSlSellPct(e.target.value)}
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
                                    <Tooltip text="Momentum Confirmation: BUY only if Histogram > 0, SELL only if Histogram < 0.">
                                      <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                                    </Tooltip>
                                  </label>
                                </div>
                                {useMacd && (
                                  <div className="pl-6 space-y-3">
                                    <div className="bg-sky-500/5 border border-sky-500/10 rounded-lg p-2 mb-2">
                                      <p className="text-[9px] text-sky-400/80 leading-relaxed">
                                        <span className="font-bold">Signal Rule:</span> BUY requires positive histogram (bullish momentum). SELL requires negative histogram (bearish momentum).
                                      </p>
                                    </div>
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
                                        <p className="text-[7px] text-white/30 uppercase">Histogram</p>
                                        <p className={`text-[9px] font-mono font-bold ${currentMacd.histogram > 0 ? 'text-emerald-400' : currentMacd.histogram < 0 ? 'text-rose-400' : 'text-white/40'}`}>
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
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-4 bg-sky-500/5 rounded-xl border border-sky-500/20 text-center space-y-2"
                      >
                        <Bot className="w-8 h-8 text-sky-400 mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-bold text-sky-400 uppercase tracking-widest">Autopilot Active</p>
                        <p className="text-[10px] text-white/40">AI is dynamically managing limits, risk duration, trade volume, and strategies.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

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

                {/* Bot Performance Statistics */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                  <h2 className="font-bold flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-sky-500" />
                    Bot Performance
                    <Tooltip text="Overall performance metrics for the current session. Resets on page refresh.">
                      <Info className="w-3 h-3 text-white/20 hover:text-sky-400 transition-colors cursor-help" />
                    </Tooltip>
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium mb-1">Total Trades</p>
                      <p className="text-lg font-mono font-bold">{botStats.trades}</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium mb-1">Win Rate</p>
                      <p className="text-lg font-mono font-bold">
                        {botStats.trades > 0 ? ((botStats.wins / botStats.trades) * 100).toFixed(1) : '0.0'}%
                      </p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium mb-1">Wins / Losses</p>
                      <p className="text-lg font-mono font-bold">
                        <span className="text-emerald-400">{botStats.wins}</span>
                        <span className="text-white/20 mx-1">/</span>
                        <span className="text-red-400">{botStats.losses}</span>
                      </p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium mb-1">Total PnL</p>
                      <p className={`text-lg font-mono font-bold ${botStats.totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {botStats.totalPnl >= 0 ? '+' : ''}{botStats.totalPnl.toFixed(2)}
                        <span className="text-[10px] ml-1 text-white/40">USDT</span>
                      </p>
                    </div>
>>>>>>> f6b4c9e (Auto-sync)
                  </div>
                </div>
              </div>

              {/* Order Book */}
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[400px]">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-xs font-bold flex items-center gap-2 uppercase tracking-wider text-white/60">
                    <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
                    Order Book
                  </h3>
                  <span className="text-[10px] font-mono text-white/40">{selectedSymbol}</span>
                </div>

                <div className="flex-1 grid grid-rows-2 overflow-hidden">
                  {/* Asks (Sells) - Red */}
                  <div className="flex flex-col-reverse overflow-hidden border-b border-white/5">
                    {orderBook.asks.map(([price, qty], i) => {
                      const maxQty = Math.max(...orderBook.asks.map(a => Number(a[1])), ...orderBook.bids.map(b => Number(b[1])));
                      const width = (Number(qty) / maxQty) * 100;
                      return (
                        <div key={`ask-${i}`} className="relative flex items-center justify-between px-4 py-1 text-[10px] group hover:bg-white/5 transition-colors">
                          <div className="absolute right-0 top-0 bottom-0 bg-red-500/10 transition-all duration-500" style={{ width: `${width}%` }} />
                          <span className="relative font-mono text-red-400">{Number(price).toFixed(2)}</span>
                          <span className="relative font-mono text-white/60">{Number(qty).toFixed(4)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bids (Buys) - Green */}
                  <div className="flex flex-col overflow-hidden">
                    {orderBook.bids.map(([price, qty], i) => {
                      const maxQty = Math.max(...orderBook.asks.map(a => Number(a[1])), ...orderBook.bids.map(b => Number(b[1])));
                      const width = (Number(qty) / maxQty) * 100;
                      return (
                        <div key={`bid-${i}`} className="relative flex items-center justify-between px-4 py-1 text-[10px] group hover:bg-white/5 transition-colors">
                          <div className="absolute right-0 top-0 bottom-0 bg-emerald-500/10 transition-all duration-500" style={{ width: `${width}%` }} />
                          <span className="relative font-mono text-emerald-400">{Number(price).toFixed(2)}</span>
                          <span className="relative font-mono text-white/60">{Number(qty).toFixed(4)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-black/20 border-t border-white/10 flex items-center justify-between text-[10px]">
                  <span className="text-white/40">Spread</span>
                  <span className="font-mono text-white/80">
                    {orderBook.asks.length > 0 && orderBook.bids.length > 0
                      ? (Number(orderBook.asks[0][0]) - Number(orderBook.bids[0][0])).toFixed(2)
                      : '0.00'}
                  </span>
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-lg transition-all text-[10px] font-bold text-white/40 hover:text-red-400 group"
                  >
                    <Trash2 className="w-3 h-3 text-white/20 group-hover:text-red-400 transition-colors" />
                    Clear Logs
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
                        <span className={`font-medium ${log.type === 'success' ? 'text-emerald-400' :
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
<<<<<<< HEAD
        </div>
      ) : (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center border border-sky-500/20">
                    <History className="w-5 h-5 text-sky-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Trade History</h2>
                    <p className="text-xs text-white/40">View all executed trades across all accounts</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input 
                      type="text" 
                      placeholder="Filter by symbol or account..."
                      value={historyFilter}
                      onChange={(e) => {
                        setHistoryFilter(e.target.value);
                        setHistoryPage(1);
                      }}
                      className="bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-sky-500/50 w-64"
                    />
                  </div>
                  <button 
                    onClick={fetchTradeHistory}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="pb-4 px-4 text-[10px] uppercase tracking-wider text-white/40 font-bold">
                        <button 
                          onClick={() => setHistorySort({ field: 'time', dir: historySort.field === 'time' && historySort.dir === 'desc' ? 'asc' : 'desc' })}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          Time <ArrowUpDown className={`w-3 h-3 ${historySort.field === 'time' ? 'text-sky-500' : ''}`} />
                        </button>
                      </th>
                      <th className="pb-4 px-4 text-[10px] uppercase tracking-wider text-white/40 font-bold">
                        <button 
                          onClick={() => setHistorySort({ field: 'accountLabel', dir: historySort.field === 'accountLabel' && historySort.dir === 'asc' ? 'desc' : 'asc' })}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          Account <ArrowUpDown className={`w-3 h-3 ${historySort.field === 'accountLabel' ? 'text-sky-500' : ''}`} />
                        </button>
                      </th>
                      <th className="pb-4 px-4 text-[10px] uppercase tracking-wider text-white/40 font-bold">
                        <button 
                          onClick={() => setHistorySort({ field: 'symbol', dir: historySort.field === 'symbol' && historySort.dir === 'asc' ? 'desc' : 'asc' })}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          Symbol <ArrowUpDown className={`w-3 h-3 ${historySort.field === 'symbol' ? 'text-sky-500' : ''}`} />
                        </button>
                      </th>
                      <th className="pb-4 px-4 text-[10px] uppercase tracking-wider text-white/40 font-bold">
                        <button 
                          onClick={() => setHistorySort({ field: 'side', dir: historySort.field === 'side' && historySort.dir === 'asc' ? 'desc' : 'asc' })}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          Side <ArrowUpDown className={`w-3 h-3 ${historySort.field === 'side' ? 'text-sky-500' : ''}`} />
                        </button>
                      </th>
                      <th className="pb-4 px-4 text-[10px] uppercase tracking-wider text-white/40 font-bold">
                        <button 
                          onClick={() => setHistorySort({ field: 'entryPrice', dir: historySort.field === 'entryPrice' && historySort.dir === 'asc' ? 'desc' : 'asc' })}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          Entry Price <ArrowUpDown className={`w-3 h-3 ${historySort.field === 'entryPrice' ? 'text-sky-500' : ''}`} />
                        </button>
                      </th>
                      <th className="pb-4 px-4 text-[10px] uppercase tracking-wider text-white/40 font-bold">
                        <button 
                          onClick={() => setHistorySort({ field: 'exitPrice', dir: historySort.field === 'exitPrice' && historySort.dir === 'asc' ? 'desc' : 'asc' })}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          Exit Price <ArrowUpDown className={`w-3 h-3 ${historySort.field === 'exitPrice' ? 'text-sky-500' : ''}`} />
                        </button>
                      </th>
                      <th className="pb-4 px-4 text-[10px] uppercase tracking-wider text-white/40 font-bold">
                        <button 
                          onClick={() => setHistorySort({ field: 'quantity', dir: historySort.field === 'quantity' && historySort.dir === 'asc' ? 'desc' : 'asc' })}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          Quantity <ArrowUpDown className={`w-3 h-3 ${historySort.field === 'quantity' ? 'text-sky-500' : ''}`} />
                        </button>
                      </th>
                      <th className="pb-4 px-4 text-[10px] uppercase tracking-wider text-white/40 font-bold">
                        <button 
                          onClick={() => setHistorySort({ field: 'realizedPnL', dir: historySort.field === 'realizedPnL' && historySort.dir === 'desc' ? 'asc' : 'desc' })}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          PnL <ArrowUpDown className={`w-3 h-3 ${historySort.field === 'realizedPnL' ? 'text-sky-500' : ''}`} />
                        </button>
                      </th>
                      <th className="pb-4 px-4 text-[10px] uppercase tracking-wider text-white/40 font-bold">
                        <button 
                          onClick={() => setHistorySort({ field: 'duration', dir: historySort.field === 'duration' && historySort.dir === 'asc' ? 'desc' : 'asc' })}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          Duration <ArrowUpDown className={`w-3 h-3 ${historySort.field === 'duration' ? 'text-sky-500' : ''}`} />
                        </button>
                      </th>
                      <th className="pb-4 px-4 text-[10px] uppercase tracking-wider text-white/40 font-bold">
                        <button 
                          onClick={() => setHistorySort({ field: 'reason', dir: historySort.field === 'reason' && historySort.dir === 'asc' ? 'desc' : 'asc' })}
                          className="flex items-center gap-1 hover:text-white transition-colors"
                        >
                          Reason <ArrowUpDown className={`w-3 h-3 ${historySort.field === 'reason' ? 'text-sky-500' : ''}`} />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {historyLoading ? (
                      <tr>
                        <td colSpan={10} className="py-20 text-center">
                          <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-4" />
                          <p className="text-sm text-white/40">Loading trade history...</p>
                        </td>
                      </tr>
                    ) : tradeHistory.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-20 text-center">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <History className="w-6 h-6 text-white/20" />
                          </div>
                          <p className="text-sm text-white/40">No trade history found</p>
                        </td>
                      </tr>
                    ) : (
                      tradeHistory
                        .filter(t => 
                          t.symbol.toLowerCase().includes(historyFilter.toLowerCase()) || 
                          t.accountLabel?.toLowerCase().includes(historyFilter.toLowerCase())
                        )
                        .sort((a, b) => {
                          const aVal = a[historySort.field];
                          const bVal = b[historySort.field];
                          
                          if (typeof aVal === 'number' && typeof bVal === 'number') {
                            return historySort.dir === 'asc' ? aVal - bVal : bVal - aVal;
                          }
                          
                          const aStr = String(aVal).toLowerCase();
                          const bStr = String(bVal).toLowerCase();
                          
                          if (historySort.dir === 'asc') return aStr > bStr ? 1 : -1;
                          return aStr < bStr ? 1 : -1;
                        })
                        .slice((historyPage - 1) * historyPerPage, historyPage * historyPerPage)
                        .map((t) => (
                          <tr key={t.id} className="group hover:bg-white/5 transition-colors">
                            <td className="py-4 px-4 text-[10px] font-mono text-white/60">
                              {new Date(t.time).toLocaleDateString()} {new Date(t.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-4 px-4 text-[10px] font-bold text-white/80">{t.accountLabel}</td>
                            <td className="py-4 px-4 text-[10px] font-bold text-sky-400">{t.symbol}</td>
                            <td className="py-4 px-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                {t.side}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-[10px] font-mono text-white/60">${Number(t.entryPrice).toFixed(2)}</td>
                            <td className="py-4 px-4 text-[10px] font-mono text-white/60">${Number(t.exitPrice).toFixed(2)}</td>
                            <td className="py-4 px-4 text-[10px] font-mono text-white/60">{Number(t.quantity).toFixed(4)}</td>
                            <td className={`py-4 px-4 text-[10px] font-mono font-bold ${t.realizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {t.realizedPnL >= 0 ? '+' : ''}{Number(t.realizedPnL).toFixed(2)}
                            </td>
                            <td className="py-4 px-4 text-[10px] font-mono text-white/40">{formatDuration(t.duration)}</td>
                            <td className="py-4 px-4">
                              <span className="text-[10px] font-medium text-white/40 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                                {t.reason}
                              </span>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {!historyLoading && tradeHistory.length > historyPerPage && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                  <p className="text-[10px] text-white/40">
                    Showing {(historyPage - 1) * historyPerPage + 1} to {Math.min(historyPage * historyPerPage, tradeHistory.length)} of {tradeHistory.length} trades
                  </p>
                  <div className="flex items-center gap-2">
                    <button 
                      disabled={historyPage === 1}
                      onClick={() => setHistoryPage(prev => prev - 1)}
                      className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      disabled={historyPage * historyPerPage >= tradeHistory.length}
                      onClick={() => setHistoryPage(prev => prev + 1)}
                      className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
=======
        )}
      </div>
>>>>>>> f6b4c9e (Auto-sync)

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
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">Group (Optional)</label>
              <input
                type="text"
                value={newAccGroup}
                onChange={(e) => setNewAccGroup(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50 transition-colors"
                placeholder="e.g. Primary Group"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">API Key</label>
<<<<<<< HEAD
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                  <Key className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={newAccKey}
                  onChange={(e) => setNewAccKey(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-sky-500/50 transition-colors"
                  placeholder="Enter Binance API Key"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">API Secret</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20">
                  <Lock className="w-4 h-4" />
                </div>
                <input 
                  type="password" 
                  value={newAccSecret}
                  onChange={(e) => setNewAccSecret(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:border-sky-500/50 transition-colors"
                  placeholder="Enter Binance API Secret"
                  required
                />
              </div>
=======
              <input
                type="text"
                value={newAccKey}
                onChange={(e) => setNewAccKey(e.target.value)}
                autoComplete="off"
                data-lpignore="true"
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
                autoComplete="new-password"
                data-lpignore="true"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50 transition-colors"
                placeholder="Enter Binance API Secret"
                required
              />
>>>>>>> f6b4c9e (Auto-sync)
            </div>

            {/* API Checklist */}
            <div className="bg-sky-500/5 border border-sky-500/10 rounded-xl p-4 space-y-2">
              <h3 className="text-[10px] font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" />
                Binance Setup Checklist
              </h3>
              <div className="space-y-1.5">
                {[
                  "Enable Reading",
                  "Enable Spot & Margin Trading",
                  "Enable Futures",
                  "Access Restriction: Unrestricted (Recommended)"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[9px] text-white/50">
                    <div className="w-1 h-1 rounded-full bg-sky-500/40" />
                    {item}
                  </div>
                ))}
              </div>
              <p className="text-[8px] text-white/20 mt-2 italic">
                * Error -2015 usually means "Enable Futures" is missing.
              </p>
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

      {/* Edit Account Modal */}
      <dialog id="edit-account-modal" className="bg-transparent backdrop:bg-black/80 p-0">
        <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 m-4">
          <h2 className="text-xl font-bold mb-6">Edit Binance Account</h2>
          <form onSubmit={handleUpdateAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">Label</label>
              <input
                type="text"
                value={editAccLabel}
                onChange={(e) => setEditAccLabel(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50 transition-colors"
                placeholder="e.g. Main Account"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">Group (Optional)</label>
              <input
                type="text"
                value={editAccGroup}
                onChange={(e) => setEditAccGroup(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-sky-500/50 transition-colors"
                placeholder="e.g. Primary Group"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingAccount(null);
                  (document.getElementById('edit-account-modal') as HTMLDialogElement)?.close();
                }}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-sky-500 hover:bg-sky-400 text-black font-bold py-3 rounded-xl transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* Trade Confirmation Modal */}
      {tradeConfirm && (
<<<<<<< HEAD
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setTradeConfirm(null)}
        >
          <motion.div 
=======
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
>>>>>>> f6b4c9e (Auto-sync)
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tradeConfirm.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Confirm Trade</h2>
                <p className="text-xs text-white/40 uppercase tracking-widest">Manual Execution</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Symbol</p>
                  <p className="font-bold text-sm">{tradeConfirm.symbol}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Side</p>
                  <p className={`font-bold text-sm ${tradeConfirm.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {tradeConfirm.side === 'BUY' ? 'BUY / LONG' : 'SELL / SHORT'}
                  </p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Entry Price</p>
                  <p className="font-bold text-sm text-sky-400">${Number(currentPrice).toFixed(2)}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Volume</p>
                  <p className="font-bold text-sm">${tradeConfirm.volume} USDT</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Quantity</p>
                  <p className="font-bold text-sm">
                    {tradeConfirm.quantity} <span className="text-[10px] text-white/20">{tradeConfirm.symbol.replace('USDT', '')}</span>
                  </p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Take Profit</p>
                  <p className="font-bold text-sm text-emerald-400">
                    {tradeConfirm.tp ? `${tradeConfirm.tp}${tradeConfirm.mode === 'PERCENTAGE' ? '%' : ''}` : 'None'}
                  </p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase mb-1">Stop Loss</p>
                  <p className="font-bold text-sm text-red-400">
                    {tradeConfirm.sl ? `${tradeConfirm.sl}${tradeConfirm.mode === 'PERCENTAGE' ? '%' : ''}` : 'None'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Leverage</label>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-[8px] text-white/20 uppercase font-bold">Est. Margin</p>
                      <p className="text-xs font-bold text-emerald-500/80">
                        ${(Number(tradeConfirm.volume) / Number(tradeConfirm.leverage || 1)).toFixed(2)} USDT
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded px-2 py-1">
                      <input 
                        type="number"
                        min="1"
                        max="125"
                        value={tradeConfirm.leverage}
                        onChange={(e) => setTradeConfirm({ ...tradeConfirm, leverage: e.target.value })}
                        className="w-10 bg-transparent text-xs text-sky-400 font-bold focus:outline-none"
                      />
                      <span className="text-[10px] font-bold text-sky-400/60 uppercase">x</span>
                    </div>
                  </div>
                </div>
                <input 
                  type="range"
                  min="1"
                  max="125"
                  step="1"
                  value={tradeConfirm.leverage}
                  onChange={(e) => setTradeConfirm({ ...tradeConfirm, leverage: e.target.value })}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
                <div className="flex justify-between text-[8px] text-white/20 font-bold uppercase">
                  <span>1x</span>
                  <span>25x</span>
                  <span>50x</span>
                  <span>75x</span>
                  <span>100x</span>
                  <span>125x</span>
                </div>
              </div>

              <div className="p-4 bg-sky-500/5 border border-sky-500/10 rounded-xl">
                <p className="text-[10px] text-sky-400/60 leading-relaxed">
                  This order will be executed across all enabled accounts. Please ensure you have sufficient balance and correct leverage settings.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setTradeConfirm(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => executeTrade(tradeConfirm.side, true)}
                disabled={loading}
                className={`flex-1 font-bold py-3 rounded-xl transition-all shadow-lg ${tradeConfirm.side === 'BUY'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                    : 'bg-red-500 hover:bg-red-400 text-black shadow-red-500/20'
                  }`}
              >
                {loading ? 'Executing...' : 'Confirm Order'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Close Position Confirmation Modal */}
      {closeConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setCloseConfirm(null)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-500/20 text-red-500">
                <Square className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Close Position</h2>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Confirm Exit</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-[10px] text-white/40 uppercase mb-1">Symbol</p>
                    <p className="font-bold text-lg">{closeConfirm.symbol}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/40 uppercase mb-1">Side</p>
                    <p className={`font-bold ${closeConfirm.side === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {closeConfirm.side === 'BUY' ? 'LONG' : 'SHORT'}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-[10px] text-white/40 uppercase mb-1">Size</p>
                    <p className="font-bold text-sm">{closeConfirm.amount.toFixed(4)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/40 uppercase mb-1">Unrealized PnL</p>
                    <p className={`font-bold text-sm ${closeConfirm.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {closeConfirm.pnl >= 0 ? '+' : ''}{closeConfirm.pnl.toFixed(2)} USDT ({closeConfirm.pnlPct.toFixed(2)}%)
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
                <p className="text-[10px] text-red-400/60 leading-relaxed">
                  Closing this position will execute a market order to exit. The final realized PnL may vary slightly due to slippage.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setCloseConfirm(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmClosePosition}
                disabled={loading}
                className="flex-1 bg-red-500 hover:bg-red-400 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-500/20"
              >
                {loading ? 'Closing...' : 'Confirm Close'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Real-time Alerts Overlay */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              className={`pointer-events-auto min-w-[300px] max-w-md p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-4 ${
                alert.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : alert.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
              }`}
            >
              <div className={`p-2 rounded-xl ${
                alert.type === 'success' ? 'bg-emerald-500/20' : alert.type === 'error' ? 'bg-red-500/20' : 'bg-sky-500/20'
              }`}>
                {alert.type === 'success' ? <TrendingUp className="w-5 h-5" /> : alert.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                    {alert.type === 'success' ? 'Profit Alert' : alert.type === 'error' ? 'Risk Alert' : 'System Alert'}
                  </span>
                  <span className="text-[10px] opacity-30">
                    {new Date(alert.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs font-medium leading-relaxed">{alert.msg}</p>
              </div>
              <button 
                onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                className="p-1 hover:bg-white/5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 rotate-45 opacity-30 hover:opacity-100" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
