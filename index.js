import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import express from "express";
import dotenv from "dotenv";
import { LANGUAGES } from "./languages.js";

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const app = express();
const PORT = process.env.PORT || 3000;

const userTracking = new Map();
const userLanguage = new Map();
const recentEvents = new Set();

const L = (chatId) => LANGUAGES[userLanguage.get(chatId) || "en"];

async function fetchEvents(collectionId) {
  try {
    const res = await axios.get(`https://api.xrpldata.com/api/v1/nft/sales/${collectionId}`);
    return res.data || [];
  } catch {
    return [];
  }
}

async function sendNFTEvent(chatId, nft) {
  const { image, name, type, price, id } = nft;
  const emoji = {
    mint: "✨",
    sale: "💰",
    listing: "🏷️",
    offer: "🤝",
    burn: "🔥"
  }[type?.toLowerCase()] || "🧩";

  const caption =
    `${emoji} *${type.toUpperCase()}*\n` +
    `🎨 *${name}*\n` +
    (price ? `💰 ${price} XRP\n` : "") +
    `[🔗 View on XRPSCAN](https://xrpscan.com/nft/${id})`;

  await bot.sendPhoto(chatId, image || "https://xrp.cafe/logo.png", {
    caption,
    parse_mode: "Markdown"
  });
}

setInterval(async () => {
  for (const [chatId, collections] of userTracking.entries()) {
    for (const collectionId of collections) {
      const events = await fetchEvents(collectionId);
      for (const event of events) {
        const key = `${collectionId}-${event.id}`;
        if (!recentEvents.has(key)) {
          recentEvents.add(key);
          await sendNFTEvent(chatId, {
            image: event.image,
            name: event.name,
            type: event.type,
            price: event.price,
            id: event.id
          });
        }
      }
    }
  }
  if (recentEvents.size > 3000) {
    const items = Array.from(recentEvents).slice(-1000);
    recentEvents.clear();
    for (const i of items) recentEvents.add(i);
  }
}, 60 * 1000);

// Commands
bot.onText(/\/start/, (msg) => bot.sendMessage(msg.chat.id, L(msg.chat.id).start, { parse_mode: "Markdown" }));
bot.onText(/\/help/, (msg) => bot.sendMessage(msg.chat.id, L(msg.chat.id).help, { parse_mode: "Markdown" }));
bot.onText(/\/language (.+)/, (msg, match) => {
  const lang = match[1].toLowerCase();
  if (!LANGUAGES[lang]) return bot.sendMessage(msg.chat.id, "❌ Unsupported language code.");
  userLanguage.set(msg.chat.id, lang);
  bot.sendMessage(msg.chat.id, LANGUAGES[lang].langSet, { parse_mode: "Markdown" });
});
bot.onText(/\/track (.+)/, (msg, match) => {
  const input = match[1].trim();
  const chatId = msg.chat.id;
  const collectionId = input.includes("xrp.cafe") ? input.split("/").pop() : input;
  if (!userTracking.has(chatId)) userTracking.set(chatId, new Set());
  const collections = userTracking.get(chatId);
  if (collections.has(collectionId)) return bot.sendMessage(chatId, L(chatId).alreadyTrack(collectionId), { parse_mode: "Markdown" });
  collections.add(collectionId);
  bot.sendMessage(chatId, L(chatId).trackStart(collectionId), { parse_mode: "Markdown" });
});
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  userTracking.delete(chatId);
  bot.sendMessage(chatId, L(chatId).stop, { parse_mode: "Markdown" });
});
bot.onText(/\/list/, (msg) => {
  const chatId = msg.chat.id;
  const collections = userTracking.get(chatId);
  if (!collections || collections.size === 0) return bot.sendMessage(chatId, L(chatId).noList);
  const list = Array.from(collections).map((c) => `• ${c}`).join("\n");
  bot.sendMessage(chatId, `${L(chatId).list}\n${list}`, { parse_mode: "Markdown" });
});

app.get("/", (req, res) => res.send("🧔 BeardNFT Bot is running."));
app.listen(PORT, () => console.log(`✅ Running on port ${PORT}`));
