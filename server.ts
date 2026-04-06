import express from "express";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

const PORT = 3000;

// Binance bases
const FUT_BASE = process.env.BINANCE_FUTURES_BASE || "https://fapi.binance.com";
const SPOT_BASE = process.env.BINANCE_SPOT_BASE || "https://api.binance.com";

// Secrets
const MASTER_KEY = process.env.MASTER_KEY || "";
if (!MASTER_KEY) {
  console.warn("MASTER_KEY is not set in environment. Encryption will be disabled.");
}
const TOKEN_SECRET = process.env.TOKEN_SECRET || "CHANGE_ME_TOKEN_SECRET";

// Live orders switch
const ALLOW_LIVE_ORDERS =
  String(process.env.ALLOW_LIVE_ORDERS || "true").toLowerCase() === "true";

// Hard trade limits
const MIN_TRADE_USD = 5;
const MAX_TRADE_USD = 10;

// Spot dollar quotes supported
const SPOT_DOLLAR_QUOTES = new Set(["USDT", "USDC", "FDUSD", "BUSD"]);

// Futures defaults
const DEFAULT_MARGIN_TYPE = "ISOLATED";
const DEFAULT_LEVERAGE = 10;

// DB
const DB_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "db.json");
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function loadDB() {
  if (!fs.existsSync(DB_PATH)) return { users: [], accounts: [] };
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return { users: [], accounts: [] };
  }
}
function saveDB(db: any) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}
let DB = loadDB();

// ===== Encryption helpers =====
const ENC_ALGO = "aes-256-gcm";

function getEncKey() {
  const raw =
    process.env.APP_ENC_KEY ||
    process.env.ENC_KEY ||
    process.env.SECRET ||
    process.env.MASTER_KEY ||
    MASTER_KEY ||
    "";
  if (!raw) return null;
  return crypto.createHash("sha256").update(raw, "utf8").digest();
}

function enc(plainText: string) {
  const key = getEncKey();
  if (!key) return Buffer.from(String(plainText), "utf8").toString("base64");

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ENC_ALGO, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(String(plainText), "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64url");
}

function dec(token: string) {
  try {
    if (!token || typeof token !== "string") return null;

    const key = getEncKey();
    if (!key) return Buffer.from(String(token), "base64").toString("utf8");

    // Try decryption first
    try {
      const buf = Buffer.from(token, "base64url");
      if (buf.length >= 12 + 16 + 1) {
        const iv = buf.subarray(0, 12);
        const tag = buf.subarray(12, 28);
        const data = buf.subarray(28);

        const decipher = crypto.createDecipheriv(ENC_ALGO, key, iv);
        decipher.setAuthTag(tag);

        const decrypted = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
        const trimmed = decrypted.trim();
        if (trimmed.length > 0 && !/^[a-zA-Z0-9]+$/.test(trimmed)) {
          console.warn("Decrypted key contains non-alphanumeric characters. MASTER_KEY might be wrong.");
        }
        return trimmed;
      }
    } catch (e) {
      // Decryption failed, fall through to plain base64 check
    }

    // Fallback: try plain base64 if decryption fails or payload is too short
    // This handles keys stored before encryption was enabled
    try {
      const plain = Buffer.from(String(token), "base64").toString("utf8");
      return plain.trim();
    } catch {
      return null;
    }
  } catch {
    return null;
  }
}

// ===== Password hashing =====
function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return { salt, hash };
}
function verifyPassword(password: string, salt: string, hash: string) {
  const test = crypto.pbkdf2Sync(password, salt, 120000, 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(test, "hex"), Buffer.from(hash, "hex"));
}

// ===== Token =====
function b64url(str: string) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signToken(payloadObj: any, ttlSeconds = 60 * 60 * 24) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { ...payloadObj, iat: now, exp: now + ttlSeconds };

  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(payload));

  const sig = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(`${h}.${p}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${h}.${p}.${sig}`;
}

function verifyToken(token: string) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;

  const check = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(`${h}.${p}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  if (check !== sig) return null;

  let payload;
  try {
    payload = JSON.parse(
      Buffer.from(p.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")
    );
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || now > payload.exp) return null;
  return payload;
}

// ===== Middleware =====
const authMiddleware = (req: any, res: any, next: any) => {
  const hdr = req.headers.authorization || "";
  const m = hdr.match(/^Bearer (.+)$/);
  if (!m) return res.status(401).json({ error: "missing_token" });
  const payload = verifyToken(m[1]);
  if (!payload?.uid) return res.status(401).json({ error: "invalid_token" });
  req.user = payload;
  next();
};

// ===== Binance wrappers =====
function signQS(qs: string, apiSecret: string) {
  return crypto.createHmac("sha256", apiSecret).update(qs).digest("hex");
}

async function bFetch(
  base: string,
  apiKey: string,
  apiSecret: string,
  pathname: string,
  { method = "GET", query = {}, signed = false, timeout = 10000 }: any = {}
) {
  if (typeof fetch === 'undefined') {
    throw new Error("Global fetch is not defined. Ensure you are using Node.js 18+ or a polyfill.");
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const url = new URL(base + pathname);
  for (const [k, v] of Object.entries(query || {})) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, String(v));
  }

  const headers: any = {};
  if (signed) {
    url.searchParams.set("timestamp", String(Date.now()));
    url.searchParams.set("recvWindow", "60000");
    const qs = url.searchParams.toString();
    url.searchParams.set("signature", signQS(qs, apiSecret));
    headers["X-MBX-APIKEY"] = apiKey;
  }

  try {
    const res = await fetch(url.toString(), { 
      method, 
      headers,
      signal: controller.signal
    });
    const text = await res.text();
    clearTimeout(id);
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    if (!res.ok) {
      throw Object.assign(new Error(`Binance request failed: ${res.status} ${url.toString()}`), {
        status: res.status,
        statusText: res.statusText,
        binance: json,
      });
    }
    return json;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error(`Binance request timed out after ${timeout}ms: ${url.toString()}`);
    }
    throw err;
  }
}

async function pubFetch(base: string, pathname: string, query = {}, timeout = 10000) {
  if (typeof fetch === 'undefined') {
    throw new Error("Global fetch is not defined. Ensure you are using Node.js 18+ or a polyfill.");
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const url = new URL(base + pathname);
  for (const [k, v] of Object.entries(query || {})) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, String(v));
  }
  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    const text = await res.text();
    clearTimeout(id);
    let json;
    try {
      json = JSON.parse(text);
    } catch (parseErr) {
      console.error(`Failed to parse JSON from ${url.toString()}. Raw text:`, text.substring(0, 500));
      json = { raw: text };
    }
    if (!res.ok) {
      console.error(`Binance Public Error: ${res.status} ${url.toString()}`, json);
      throw Object.assign(new Error(`Public request failed: ${res.status}`), { status: res.status, binance: json });
    }
    return json;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error(`Binance public request timed out after ${timeout}ms: ${url.toString()}`);
    }
    console.error(`pubFetch network error: ${url.toString()}`, err.message);
    throw err;
  }
}

// ===== filters =====
function getFilters(exInfo: any, symbol: string) {
  const s = exInfo?.symbols?.find((x: any) => x.symbol === symbol);
  if (!s) return null;

  const lot = (s.filters || []).find((f: any) => f.filterType === "LOT_SIZE");
  const minNotional =
    (s.filters || []).find((f: any) => f.filterType === "MIN_NOTIONAL") ||
    (s.filters || []).find((f: any) => f.filterType === "NOTIONAL");

  return {
    stepSize: lot ? Number(lot.stepSize) : null,
    minQty: lot ? Number(lot.minQty) : null,
    minNotional: minNotional
      ? Number(minNotional.notional ?? minNotional.minNotional ?? 0)
      : null,
  };
}
function floorToStep(qty: number, stepSize: number) {
  if (!stepSize || stepSize <= 0) return qty;
  const inv = 1 / stepSize;
  return Math.floor(qty * inv) / inv;
}
function decimalsFromStep(stepSize: number) {
  const s = String(stepSize);
  if (!s.includes(".")) return 0;
  return s.split(".")[1].replace(/0+$/, "").length;
}

async function startServer() {
  // API routes
  app.get("/api/health", (req, res) => {
    res.json({
      ok: true,
      ts: Date.now(),
      liveOrders: ALLOW_LIVE_ORDERS,
      tradeLimits: { min: MIN_TRADE_USD, max: MAX_TRADE_USD },
      spotDollarQuotes: Array.from(SPOT_DOLLAR_QUOTES),
    });
  });

  app.post("/api/auth/register", (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username_password_required" });

    const exists = DB.users.find(
      (u: any) => u.username.toLowerCase() === String(username).toLowerCase()
    );
    if (exists) return res.status(409).json({ error: "user_exists" });

    const { salt, hash } = hashPassword(password);
    const uid = crypto.randomUUID();

    DB.users.push({ uid, username, salt, hash });
    saveDB(DB);

    res.json({ ok: true, token: signToken({ uid, username }), username });
  });

  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: "username_password_required" });

    const user = DB.users.find((u: any) => u.username.toLowerCase() === String(username).toLowerCase());
    if (!user) return res.status(401).json({ error: "bad_credentials" });

    if (!verifyPassword(password, user.salt, user.hash)) {
      return res.status(401).json({ error: "bad_credentials" });
    }

    res.json({
      ok: true,
      token: signToken({ uid: user.uid, username: user.username }),
      username: user.username,
    });
  });

  app.get("/api/accounts", authMiddleware, (req: any, res) => {
    const items = DB.accounts
      .filter((a: any) => a.uid === req.user.uid)
      .map((a: any) => ({ 
        id: a.id, 
        label: a.label, 
        group: a.group,
        enabled: a.enabled, 
        createdAt: a.createdAt 
      }));
    res.json(items);
  });

  app.post("/api/accounts", authMiddleware, (req: any, res) => {
    const { label, group, apiKey, apiSecret, enabled } = req.body || {};
    if (!apiKey || !apiSecret) return res.status(400).json({ error: "apiKey_apiSecret_required" });

    const id = crypto.randomUUID();
    DB.accounts.push({
      id,
      uid: req.user.uid,
      label: label || `Account ${id.slice(0, 6)}`,
      group: group || '',
      apiKeyEnc: enc(String(apiKey).trim()),
      apiSecretEnc: enc(String(apiSecret).trim()),
      enabled: enabled !== false,
      createdAt: Date.now(),
    });
    saveDB(DB);
    res.json({ ok: true, id });
  });

  app.post("/api/accounts/:id/toggle", authMiddleware, (req: any, res) => {
    const id = String(req.params.id);
    const { enabled } = req.body || {};
    const a = DB.accounts.find((x: any) => x.id === id && x.uid === req.user.uid);
    if (!a) return res.status(404).json({ error: "not_found" });
    
    if (typeof enabled === 'boolean') {
      a.enabled = enabled;
    } else {
      a.enabled = !a.enabled;
    }
    
    saveDB(DB);
    res.json({ ok: true, enabled: a.enabled });
  });

  app.patch("/api/accounts/:id", authMiddleware, (req: any, res) => {
    const id = String(req.params.id);
    const { label, group } = req.body || {};
    const a = DB.accounts.find((x: any) => x.id === id && x.uid === req.user.uid);
    if (!a) return res.status(404).json({ error: "not_found" });
    
    if (label !== undefined) a.label = label;
    if (group !== undefined) a.group = group;
    
    saveDB(DB);
    res.json({ ok: true });
  });

  app.delete("/api/accounts/:id", authMiddleware, (req: any, res) => {
    const id = String(req.params.id);
    DB.accounts = DB.accounts.filter((x: any) => !(x.id === id && x.uid === req.user.uid));
    saveDB(DB);
    res.json({ ok: true });
  });

  app.get("/api/spot/symbols", async (req, res) => {
    try {
      const info = await pubFetch(SPOT_BASE, "/api/v3/exchangeInfo", {});
      const symbols = (info.symbols || [])
        .filter(
          (s: any) =>
            s.status === "TRADING" &&
            s.isSpotTradingAllowed === true &&
            SPOT_DOLLAR_QUOTES.has(s.quoteAsset)
        )
        .map((s: any) => ({ symbol: s.symbol, baseAsset: s.baseAsset, quoteAsset: s.quoteAsset }));
      res.json({ ok: true, symbols });
    } catch (e: any) {
      res.status(500).json({ error: "spot_symbols_failed", details: e?.binance || e?.message || String(e) });
    }
  });

  app.get("/api/futures/symbols", async (req, res) => {
    try {
      const info = await pubFetch(FUT_BASE, "/fapi/v1/exchangeInfo", {});
      const symbols = (info.symbols || [])
        .filter((s: any) => s.status === "TRADING" && s.contractType === "PERPETUAL")
        .map((s: any) => ({ symbol: s.symbol, baseAsset: s.baseAsset, quoteAsset: s.quoteAsset }));
      res.json({ ok: true, symbols });
    } catch (e: any) {
      res.status(500).json({ error: "futures_symbols_failed", details: e?.binance || e?.message || String(e) });
    }
  });

  app.get("/api/user/summary", authMiddleware, async (req: any, res) => {
    try {
      const accounts = DB.accounts.filter((a: any) => a.uid === req.user.uid && a.enabled);
      const out = [];

      for (const a of accounts) {
        const apiKey = dec(a.apiKeyEnc);
        const apiSecret = dec(a.apiSecretEnc);
        if (!apiKey || !apiSecret) {
          out.push({
            id: a.id,
            label: a.label,
            enabled: a.enabled,
            futures: null,
            spot: null,
            errFut: "Invalid credentials",
            errSpot: "Invalid credentials",
          });
          continue;
        }

        let fut = null;
        let spot = null;
        let errFut = null;
        let errSpot = null;

        try {
          const acct = await bFetch(FUT_BASE, apiKey, apiSecret, "/fapi/v2/account", { signed: true });
          const posRisk = await bFetch(FUT_BASE, apiKey, apiSecret, "/fapi/v2/positionRisk", { signed: true });
          const openPos = (posRisk || []).filter((p: any) => Number(p.positionAmt) !== 0);

          fut = {
            walletBalance: Number(acct?.totalWalletBalance ?? 0),
            availableBalance: Number(acct?.availableBalance ?? 0),
            unrealizedProfit: Number(acct?.totalUnrealizedProfit ?? 0),
            positions: openPos.map((p: any) => ({
              symbol: p.symbol,
              amount: Number(p.positionAmt),
              entryPrice: Number(p.entryPrice),
              markPrice: Number(p.markPrice),
              unrealizedProfit: Number(p.unRealizedProfit),
              leverage: Number(p.leverage),
              marginType: p.marginType,
              liquidationPrice: Number(p.liquidationPrice),
              pnlPct: Number(p.entryPrice) > 0 ? (Number(p.unRealizedProfit) / (Math.abs(Number(p.positionAmt)) * Number(p.entryPrice) / Number(p.leverage))) * 100 : 0
            }))
          };
        } catch (e: any) {
          errFut = e?.binance ? (e.binance.msg || e.binance.message || JSON.stringify(e.binance)) : (e?.message || String(e));
        }

        try {
          const acct = await bFetch(SPOT_BASE, apiKey, apiSecret, "/api/v3/account", { signed: true });
          const balances = acct?.balances || [];
          const by: any = {};
          let total = 0;
          for (const q of SPOT_DOLLAR_QUOTES) {
            const b = balances.find((x: any) => x.asset === q);
            const free = b ? Number(b.free ?? 0) : 0;
            by[q] = free;
            total += free;
          }
          spot = { dollarTotal: total, dollarByAsset: by };
        } catch (e: any) {
          errSpot = e?.binance ? (e.binance.msg || e.binance.message || JSON.stringify(e.binance)) : (e?.message || String(e));
        }

        out.push({
          id: a.id,
          label: a.label,
          enabled: a.enabled,
          futures: fut,
          spot,
          errFut,
          errSpot,
        });
      }

      res.json({
        ok: true,
        user: { username: req.user.username },
        accounts: out,
        liveOrders: ALLOW_LIVE_ORDERS,
        tradeLimits: { min: MIN_TRADE_USD, max: MAX_TRADE_USD },
        spotDollarQuotes: Array.from(SPOT_DOLLAR_QUOTES),
      });
    } catch (err: any) {
      console.error("Error in /api/user/summary:", err);
      res.status(500).json({ error: "summary_failed", details: err.message });
    }
  });

  app.get("/api/spot/klines", async (req, res) => {
    const { symbol, interval, limit } = req.query || {};
    if (!symbol) {
      return res.status(400).json({ error: "missing_symbol" });
    }
    try {
      const data = await pubFetch(SPOT_BASE, "/api/v3/klines", { symbol, interval, limit });
      res.json(data);
    } catch (e: any) {
      console.error(`Spot Klines API failure for ${symbol}:`, e.message);
      res.status(500).json({ error: "klines_failed", message: e.message });
    }
  });

  app.get("/api/spot/price", async (req, res) => {
    const { symbol } = req.query || {};
    if (!symbol) return res.status(400).json({ error: "symbol_required" });
    
    try {
      const data = await pubFetch(SPOT_BASE, "/api/v3/ticker/price", { symbol });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: "price_failed", message: e.message });
    }
  });

  app.get("/api/futures/klines", async (req, res) => {
    const { symbol, interval, limit } = req.query || {};
    if (!symbol) {
      return res.status(400).json({ error: "missing_symbol" });
    }
    try {
      const data = await pubFetch(FUT_BASE, "/fapi/v1/klines", { symbol, interval, limit });
      res.json(data);
    } catch (e: any) {
      console.error(`Klines API failure for ${symbol}:`, e.message);
      res.status(500).json({ error: "klines_failed", message: e.message });
    }
  });

  app.get("/api/futures/price", async (req, res) => {
    const { symbol } = req.query || {};
    if (!symbol) return res.status(400).json({ error: "symbol_required" });
    
    try {
      const data = await pubFetch(FUT_BASE, "/fapi/v1/ticker/price", { symbol });
      res.json(data);
    } catch (e: any) {
      console.error(`Price API failure for ${symbol}:`, e.message);
      res.status(500).json({ error: "price_failed", message: e.message });
    }
  });

  app.get("/api/futures/depth", async (req, res) => {
    const { symbol, limit = 20 } = req.query || {};
    if (!symbol) return res.status(400).json({ error: "symbol_required" });
    try {
      const data = await pubFetch(FUT_BASE, "/fapi/v1/depth", { symbol, limit });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: "depth_failed", message: e.message });
    }
  });

  app.get("/api/spot/depth", async (req, res) => {
    const { symbol, limit = 20 } = req.query || {};
    if (!symbol) return res.status(400).json({ error: "symbol_required" });
    try {
      const data = await pubFetch(SPOT_BASE, "/api/v3/depth", { symbol, limit });
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: "depth_failed", message: e.message });
    }
  });

  app.post("/api/futures/trade", authMiddleware, async (req: any, res) => {
    const { symbol, side, notional, tpPct, slPct } = req.body || {};
    if (!symbol || !side || !notional) {
      return res.status(400).json({ error: "symbol_side_notional_required" });
    }

    const n = Number(notional);
    if (n < MIN_TRADE_USD || n > MAX_TRADE_USD) {
      return res.status(400).json({ error: `Notional must be between $${MIN_TRADE_USD} and $${MAX_TRADE_USD}` });
    }

    if (!ALLOW_LIVE_ORDERS) {
      return res.json({ ok: true, msg: "Simulation: Order would be placed if LIVE_ORDERS enabled" });
    }

    const accounts = DB.accounts.filter((a: any) => a.uid === req.user.uid && a.enabled);
    if (accounts.length === 0) return res.status(400).json({ error: "no_enabled_accounts" });

    const results = [];
    try {
      const exInfo = await pubFetch(FUT_BASE, "/fapi/v1/exchangeInfo", {});
      const filters = getFilters(exInfo, symbol);
      if (!filters) throw new Error("Symbol filters not found");

      const ticker = await pubFetch(FUT_BASE, "/fapi/v1/ticker/price", { symbol });
      const price = Number(ticker.price);

      for (const a of accounts) {
        const apiKey = dec(a.apiKeyEnc);
        const apiSecret = dec(a.apiSecretEnc);
        if (!apiKey || !apiSecret) continue;

        try {
          // 1. Set leverage and margin type (optional but good practice)
          await bFetch(FUT_BASE, apiKey, apiSecret, "/fapi/v1/leverage", {
            method: "POST",
            signed: true,
            query: { symbol, leverage: DEFAULT_LEVERAGE },
          }).catch(() => {});

          await bFetch(FUT_BASE, apiKey, apiSecret, "/fapi/v1/marginType", {
            method: "POST",
            signed: true,
            query: { symbol, marginType: DEFAULT_MARGIN_TYPE },
          }).catch(() => {});

          // 2. Calculate Qty
          let qty = notional / price;
          if (filters.stepSize) qty = floorToStep(qty, filters.stepSize);
          if (filters.minQty && qty < filters.minQty) qty = filters.minQty;

          const order = await bFetch(FUT_BASE, apiKey, apiSecret, "/fapi/v1/order", {
            method: "POST",
            signed: true,
            query: {
              symbol,
              side: side.toUpperCase(),
              type: "MARKET",
              quantity: qty.toFixed(decimalsFromStep(filters.stepSize || 0.00001)),
            },
          });

          // 3. TP/SL
          if (tpPct || slPct) {
            const sideInv = side.toUpperCase() === "BUY" ? "SELL" : "BUY";
            if (tpPct) {
              const tpPrice = side.toUpperCase() === "BUY" 
                ? price * (1 + Number(tpPct) / 100)
                : price * (1 - Number(tpPct) / 100);
              await bFetch(FUT_BASE, apiKey, apiSecret, "/fapi/v1/order", {
                method: "POST",
                signed: true,
                query: {
                  symbol,
                  side: sideInv,
                  type: "TAKE_PROFIT_MARKET",
                  stopPrice: tpPrice.toFixed(2),
                  closePosition: "true",
                },
              }).catch(() => {});
            }
            if (slPct) {
              const slPrice = side.toUpperCase() === "BUY"
                ? price * (1 - Number(slPct) / 100)
                : price * (1 + Number(slPct) / 100);
              await bFetch(FUT_BASE, apiKey, apiSecret, "/fapi/v1/order", {
                method: "POST",
                signed: true,
                query: {
                  symbol,
                  side: sideInv,
                  type: "STOP_MARKET",
                  stopPrice: slPrice.toFixed(2),
                  closePosition: "true",
                },
              }).catch(() => {});
            }
          }

          results.push({ id: a.id, ok: true, orderId: order.orderId });
        } catch (e: any) {
          results.push({ id: a.id, ok: false, error: e?.binance || e?.message || String(e) });
        }
      }
      res.json({ ok: true, results });
    } catch (e: any) {
      res.status(500).json({ error: "trade_failed", message: e.message });
    }
  });

  app.post("/api/futures/close", authMiddleware, async (req: any, res) => {
    const { accountId, symbol } = req.body || {};
    if (!accountId || !symbol) return res.status(400).json({ error: "accountId_symbol_required" });

    const a = DB.accounts.find((x: any) => x.id === accountId && x.uid === req.user.uid);
    if (!a) return res.status(404).json({ error: "account_not_found" });

    const apiKey = dec(a.apiKeyEnc);
    const apiSecret = dec(a.apiSecretEnc);
    if (!apiKey || !apiSecret) return res.status(400).json({ error: "invalid_credentials" });

    try {
      const posRisk = await bFetch(FUT_BASE, apiKey, apiSecret, "/fapi/v2/positionRisk", { signed: true, query: { symbol } });
      const pos = posRisk.find((p: any) => p.symbol === symbol && Number(p.positionAmt) !== 0);
      if (!pos) return res.json({ ok: true, msg: "No open position" });

      const side = Number(pos.positionAmt) > 0 ? "SELL" : "BUY";
      const qty = Math.abs(Number(pos.positionAmt));

      const order = await bFetch(FUT_BASE, apiKey, apiSecret, "/fapi/v1/order", {
        method: "POST",
        signed: true,
        query: {
          symbol,
          side,
          type: "MARKET",
          quantity: String(qty),
          reduceOnly: "true",
        },
      });

      // Cancel all open orders for this symbol to clean up TP/SL
      await bFetch(FUT_BASE, apiKey, apiSecret, "/fapi/v1/allOpenOrders", {
        method: "DELETE",
        signed: true,
        query: { symbol },
      }).catch(() => {});

      res.json({ ok: true, orderId: order.orderId });
    } catch (e: any) {
      res.status(500).json({ error: "close_failed", details: e?.binance || e?.message || String(e) });
    }
  });

  app.get("/api/futures/trades", authMiddleware, async (req: any, res) => {
    const { accountId, symbol } = req.query || {};
    if (!accountId || !symbol) return res.status(400).json({ error: "accountId_symbol_required" });

    const a = DB.accounts.find((x: any) => x.id === accountId && x.uid === req.user.uid);
    if (!a) return res.status(404).json({ error: "account_not_found" });

    const apiKey = dec(a.apiKeyEnc);
    const apiSecret = dec(a.apiSecretEnc);
    if (!apiKey || !apiSecret) return res.status(400).json({ error: "invalid_credentials" });

    try {
      const trades = await bFetch(FUT_BASE, apiKey, apiSecret, "/fapi/v1/userTrades", { signed: true, query: { symbol, limit: 10 } });
      res.json(trades);
    } catch (e: any) {
      res.status(500).json({ error: "fetch_trades_failed", details: e?.binance || e?.message || String(e) });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Global error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global error handler:", err);
    res.status(500).json({ error: "internal_server_error", message: err.message });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
