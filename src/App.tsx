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
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Account {
  id: string;
  label: string;
  enabled: boolean;
  futures?: {
    walletBalance: number;
    availableBalance: number;
    unrealizedProfit: number;
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
  const [tpPct, setTpPct] = useState('7');
  const [slPct, setSlPct] = useState('3');
  const [autoMode, setAutoMode] = useState(false);
  const [status, setStatus] = useState({ msg: 'Ready', ok: true });
  const [loading, setLoading] = useState(false);

  // Account form
  const [newAccLabel, setNewAccLabel] = useState('');
  const [newAccKey, setNewAccKey] = useState('');
  const [newAccSecret, setNewAccSecret] = useState('');

  useEffect(() => {
    if (token) {
      refreshAll();
    }
  }, [token]);

  useEffect(() => {
    loadSymbols();
  }, [market]);

  const api = async (path: string, options: any = {}) => {
    const { method = 'GET', body, auth = true } = options;
    const headers: any = { 'Content-Type': 'application/json' };
    if (auth && token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'API Error');
    return data;
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

  const refreshAll = async () => {
    setLoading(true);
    try {
      const data = await api('/api/user/summary');
      setAccounts(data.accounts || []);
      setUsername(data.user.username);
      setStatus({ msg: 'Data refreshed', ok: true });
    } catch (err: any) {
      setStatus({ msg: err.message, ok: false });
    } finally {
      setLoading(false);
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
              <span>{status.msg}</span>
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
                  {status.msg}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
                      {acc.errFut}
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

            {/* Market View Placeholder */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-96 flex flex-col items-center justify-center text-white/20">
              <TrendingUp className="w-12 h-12 mb-4" />
              <p className="text-sm font-medium">Market Chart & Depth View</p>
              <p className="text-xs">Select a symbol to view real-time data</p>
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

                {market === 'FUTURES' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">Take Profit %</label>
                      <input 
                        type="number" 
                        value={tpPct}
                        onChange={(e) => setTpPct(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5 ml-1">Stop Loss %</label>
                      <input 
                        type="number" 
                        value={slPct}
                        onChange={(e) => setSlPct(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500/50 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-xl transition-all active:scale-[0.98]">
                    BUY / LONG
                  </button>
                  <button className="bg-red-500 hover:bg-red-400 text-black font-bold py-3 rounded-xl transition-all active:scale-[0.98]">
                    SELL / SHORT
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold">Auto Scalper</h3>
                    <p className="text-[10px] text-white/40">EMA 9/21 Crossover Strategy</p>
                  </div>
                  <button 
                    onClick={() => setAutoMode(!autoMode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${autoMode ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20' : 'bg-white/5 text-white/40'}`}
                  >
                    {autoMode ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                    {autoMode ? 'STOP' : 'START'}
                  </button>
                </div>
                <div className="bg-black/40 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center justify-between text-[10px] mono text-white/60">
                    <span>Status:</span>
                    <span className={autoMode ? 'text-sky-400 animate-pulse' : ''}>{autoMode ? 'RUNNING' : 'IDLE'}</span>
                  </div>
                  <div className="mt-1 text-[10px] mono text-white/30 truncate">
                    {autoMode ? `Monitoring ${selectedSymbol} 1m...` : 'Waiting for activation...'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="font-bold flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-sky-500" />
                System Info
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Live Trading</span>
                  <span className="text-red-400 font-mono">DISABLED</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/40">Trade Limit</span>
                  <span className="text-white/80 font-mono">$5.00 - $10.00</span>
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
