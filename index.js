import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import fs from "fs-extra";
import path from "path";

const TOKEN = process.env.BOT_TOKEN;
const bot = new TelegramBot(TOKEN, { polling: true });

// Load locale files
const localesDir = "./locales";
const defaultLang = "en";

function t(lang, key) {
  try {
    const file = fs.readJsonSync(path.join(localesDir, `${lang}.json`));
    return file[key] || fs.readJsonSync(path.join(localesDir, `${defaultLang}.json`))[key];
  } catch {
    return fs.readJsonSync(path.join(localesDir, `${defaultLang}.json`))[key];
  }
}

let tracked = {};
const trackedFile = "./tracked.json";

if (fs.existsSync(trackedFile)) {
  tracked = fs.readJsonSync(trackedFile);
} else {
  fs.writeJsonSync(trackedFile, {});
}

function saveTracked() {
  fs.writeJsonSync(trackedFile, tracked, { spaces: 2 });
}

// Default interval 1 min
setInterval(async () => {
  for (const chatId in tracked) {
    for (const issuer of tracked[chatId].collections) {
      try {
        const { data } = await axios.get(`https://api.xrpldata.com/nfts/${issuer}/events`);
        const latest = data.slice(0, 3);
        for (const ev of latest) {
          if (!tracked[chatId].lastSeen.includes(ev.txHash)) {
            tracked[chatId].lastSeen.push(ev.txHash);
            const lang = tracked[chatId].lang || "en";

            const msg =
              `${ev.image ? `<a href="${ev.image}">&#8205;</a>` : ""}` +
              `🧔 <b>${ev.name || "NFT Event"}</b>\n` +
              `${ev.type === "sale" ? t(lang, "sold_for") + ` ${ev.price} XRP`
                : ev.type === "mint" ? t(lang, "minted")
                : ev.type === "burn" ? t(lang, "burned")
                : ev.type === "offer" ? t(lang, "offer")
                : t(lang, "listed")}\n\n` +
              `${t(lang, "view_on_xrpscan")}: https://xrpscan.com/tx/${ev.txHash}`;

            await bot.sendMessage(chatId, msg, {
              parse_mode: "HTML",
              disable_web_page_preview: false,
            });
          }
        }
      } catch (err) {
        console.error(`Error fetching for ${issuer}:`, err.message);
      }
    }
  }
  saveTracked();
}, 60000);

// Commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const lang = (tracked[chatId] && tracked[chatId].lang) || "en";

  const text = `
🧔 <b>Welcome to BeardNFT Bot!</b>

Your personal assistant for tracking <b>XRPL NFTs</b> in real time.

This bot notifies you instantly when your NFTs on <b>XRP.Cafe</b> are:
• 💰 Sold
• 🏷️ Listed
• 🤝 Offered
• ✨ Minted
• 🔥 Burned

${t(lang, "help")}
`;

  bot.sendMessage(chatId, text, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "➕ Track Collection", callback_data: "track" },
          { text: "ℹ️ Help", callback_data: "help" }
        ],
        [{ text: "🌍 Language", callback_data: "language" }]
      ],
    },
  });
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const lang = (tracked[chatId] && tracked[chatId].lang) || "en";
  bot.sendMessage(chatId, t(lang, "help"), { parse_mode: "Markdown" });
});

bot.onText(/\/stoptrack/, (msg) => {
  const chatId = msg.chat.id;
  if (tracked[chatId]) {
    delete tracked[chatId];
    saveTracked();
    bot.sendMessage(chatId, "🛑 Stopped tracking all collections.");
  } else {
    bot.sendMessage(chatId, "No collection was being tracked.");
  }
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data === "help") {
    const lang = (tracked[chatId] && tracked[chatId].lang) || "en";
    bot.sendMessage(chatId, t(lang, "help"), { parse_mode: "Markdown" });
  } else if (data === "track") {
    bot.sendMessage(chatId, "Please send your XRP.Cafe collection issuer address:");
  } else if (data === "language") {
    const langs = [
      [{ text: "🇬🇧 English", callback_data: "lang_en" }],
      [{ text: "🇮🇩 Indonesia", callback_data: "lang_id" }],
      [{ text: "🇪🇸 Spanish", callback_data: "lang_es" }],
      [{ text: "🇫🇷 French", callback_data: "lang_fr" }],
      [{ text: "🇯🇵 Japanese", callback_data: "lang_ja" }],
      [{ text: "🇷🇺 Russian", callback_data: "lang_ru" }],
      [{ text: "🇨🇳 Chinese", callback_data: "lang_zh" }]
    ];
    bot.sendMessage(chatId, "🌍 Choose language:", {
      reply_markup: { inline_keyboard: langs },
    });
  } else if (data.startsWith("lang_")) {
    const lang = data.replace("lang_", "");
    if (!tracked[chatId]) tracked[chatId] = { collections: [], lastSeen: [], lang };
    else tracked[chatId].lang = lang;
    saveTracked();
    bot.sendMessage(chatId, `✅ Language set to ${lang}.`);
  }
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (text?.startsWith("r")) { // XRP issuer starts with r
    if (!tracked[chatId]) tracked[chatId] = { collections: [], lastSeen: [], lang: "en" };
    if (!tracked[chatId].collections.includes(text)) {
      tracked[chatId].collections.push(text);
      bot.sendMessage(chatId, `✅ Tracking started for collection:\n<code>${text}</code>`, { parse_mode: "HTML" });
    } else {
      bot.sendMessage(chatId, "Already tracking this collection.");
    }
    saveTracked();
  }
});

console.log("✅ BeardNFTBot is running...");
