import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import express from "express";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const TOKEN = process.env.TELEGRAM_TOKEN;
if (!TOKEN) {
  console.error("Error: TELEGRAM_TOKEN not set in environment.");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

const LOCALES_DIR = './locales';
const TRACK_FILE = './tracks.json';
const USER_LANG_FILE = './user_lang.json';

// load locales
function loadLocale(code) {
  try {
    const p = `${LOCALES_DIR}/${code}.json`;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return JSON.parse(fs.readFileSync(`${LOCALES_DIR}/en.json`, 'utf8'));
  }
}

// in-memory structures backed by files
let tracks = {};
let userLang = {};

try { tracks = JSON.parse(fs.readFileSync(TRACK_FILE)); } catch (e) { tracks = {}; }
try { userLang = JSON.parse(fs.readFileSync(USER_LANG_FILE)); } catch (e) { userLang = {}; }

function saveTracks() { fs.writeFileSync(TRACK_FILE, JSON.stringify(tracks, null, 2)); }
function saveUserLang() { fs.writeFileSync(USER_LANG_FILE, JSON.stringify(userLang, null, 2)); }

function L(chatId) {
  const code = userLang[chatId] || 'en';
  return loadLocale(code);
}

// helper to extract collection id from xrp.cafe links or IDs
function extractCollectionId(text) {
  if (!text) return null;
  const m = text.match(/xrp\.cafe\/(?:nft|collection)\/([A-Za-z0-9]+)/i);
  if (m) return m[1];
  // fallback: if it's an alphanumeric id
  const m2 = text.match(/([A-Za-z0-9]{6,})/);
  return m2 ? m2[1] : null;
}

// fetch events for collection using xrpldata API (xrp.cafe data)
async function fetchEvents(collectionId) {
  try {
    const url = `https://api.xrpldata.com/api/v1/nft/sales/${collectionId}`;
    const res = await axios.get(url, { timeout: 15000 });
    // expect array of events or adapt to response structure
    return res.data || [];
  } catch (e) {
    console.error('fetchEvents error', e.message);
    return [];
  }
}

// send notification to chat
async function sendNFTEvent(chatId, ev, locale) {
  try {
    const name = ev.name || ev.NFTName || ev.nft_name || 'Unnamed NFT';
    const image = ev.image || ev.Image || ev.NFTImage || null;
    const price = ev.price || ev.Amount || null;
    const type = (ev.type || ev.event || ev.Event || 'event').toString().toLowerCase();
    const id = ev.id || ev.NFTokenID || ev.nft_id || ev.token || 'unknown';

    const emojiMap = { sale: '💰', listing: '🏷️', offer: '🤝', mint: '✨', burn: '🔥' };
    const emoji = emojiMap[type] || '🧩';

    const captionParts = [];
    captionParts.push(`${emoji} *${type.toUpperCase()}*`);
    captionParts.push(`🎨 *${name}*`);
    if (price) captionParts.push(`💰 ${price} XRP`);
    captionParts.push(`🔗 View on XRPSCAN: https://xrpscan.com/nft/${id}`);

    const caption = captionParts.join('\n');

    if (image) {
      await bot.sendPhoto(chatId, image, { caption, parse_mode: 'Markdown' });
    } else {
      await bot.sendMessage(chatId, caption, { parse_mode: 'Markdown' });
    }
  } catch (e) {
    console.error('sendNFTEvent error', e.message);
  }
}

// polling loop
const recent = new Set();
async function pollLoop() {
  try {
    for (const [chatId, info] of Object.entries(tracks)) {
      const collection = info.collection;
      const lang = info.lang || userLang[chatId] || 'en';
      const events = await fetchEvents(collection);
      for (const ev of events) {
        // construct unique key
        const tx = ev.txHash || ev.tx_hash || ev.id || ev.NFTID || JSON.stringify(ev).slice(0,40);
        const key = `${collection}-${tx}`;
        if (recent.has(key)) continue;
        recent.add(key);
        // send
        await sendNFTEvent(chatId, ev, lang);
      }
    }
    // cap recent size
    if (recent.size > 5000) {
      const arr = Array.from(recent).slice(-2000);
      recent.clear();
      for (const a of arr) recent.add(a);
    }
  } catch (e) {
    console.error('pollLoop error', e.message);
  }
}

// schedule poll every minute
setInterval(pollLoop, 60*1000);

// --- Commands ---

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = String(msg.chat.id);
  const locale = L(chatId);
  bot.sendMessage(chatId, locale.start, { parse_mode: 'Markdown' });
});

// /help
bot.onText(/\/help/, (msg) => {
  const chatId = String(msg.chat.id);
  const locale = L(chatId);
  bot.sendMessage(chatId, locale.help, { parse_mode: 'Markdown' });
});

// /language <code>
bot.onText(/\/language\s+([a-zA-Z_-]+)/, (msg, match) => {
  const chatId = String(msg.chat.id);
  const code = match[1].toLowerCase();
  const avail = ['en','id','fr','de','es','ru','ja','zh'];
  if (!avail.includes(code)) {
    return bot.sendMessage(chatId, '❌ Unsupported language code. Supported: en,id,fr,de,es,ru,ja,zh');
  }
  userLang[chatId] = code;
  saveUserLang();
  const locale = loadLocale(code);
  bot.sendMessage(chatId, locale.langSet.replace('%s', code), { parse_mode: 'Markdown' });
});

// /track <id or link>
bot.onText(/\/track\s+(.+)/, (msg, match) => {
  const chatId = String(msg.chat.id);
  const input = match[1].trim();
  const collectionId = extractCollectionId(input);
  if (!collectionId) return bot.sendMessage(chatId, '⚠️ Invalid collection ID or link.');
  tracks[chatId] = { collection: collectionId, lang: userLang[chatId] || 'en' };
  saveTracks();
  const locale = L(chatId);
  bot.sendMessage(chatId, locale.trackStart.replace('%s', collectionId), { parse_mode: 'Markdown' });
});

// /stop
bot.onText(/\/stop/, (msg) => {
  const chatId = String(msg.chat.id);
  delete tracks[chatId];
  saveTracks();
  const locale = L(chatId);
  bot.sendMessage(chatId, locale.stop, { parse_mode: 'Markdown' });
});

// /list
bot.onText(/\/list/, (msg) => {
  const chatId = String(msg.chat.id);
  const locale = L(chatId);
  const info = tracks[chatId];
  if (!info) return bot.sendMessage(chatId, locale.noList, { parse_mode: 'Markdown' });
  const text = `${locale.list}\n• ${info.collection}`;
  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

// express health
app.get('/', (_, res) => res.send('BeardNFTBot running'));
app.listen(PORT, () => console.log('Server running on port', PORT));
