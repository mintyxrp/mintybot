export const LANGUAGES = {
  en: {
    start: `🧔 *Welcome to BeardNFT Bot!*
Your personal assistant for tracking XRP NFTs in real time.

This bot notifies you instantly when your NFTs on XRP.Cafe are:

💰 Sold
🏷️ Listed
🤝 Offered
✨ Minted
🔥 Burned

You can:
• Track one or multiple NFT collections
• Get notifications in groups, channels, or DMs
• Filter events by marketplace (XRP.Cafe only)
• Choose your language preference

To get started, tap “➕ Track Collection” or simply send your XRP.Cafe collection link.

Need help? Tap ℹ️ Help anytime.`,
    help: `ℹ️ *How to use BeardNFT Bot*
1️⃣ Use /track <collection_id or link>
2️⃣ Get real-time updates for sales, listings, offers, mints & burns
3️⃣ Works in DMs, groups, and channels
4️⃣ Change language with /language <code> (en, id, fr, de, ru, ja, zh, es)`,
    trackStart: (id) => `✅ Started tracking *${id}*`,
    alreadyTrack: (id) => `⚠️ Already tracking *${id}*`,
    stop: `🛑 All tracking stopped.`,
    list: `📋 Currently tracking:`,
    noList: `❌ You are not tracking any collection yet.`,
    langSet: `✅ Language set successfully.`
  },
  id: {
    start: `🧔 *Selamat datang di BeardNFT Bot!*
Asisten pribadi kamu untuk memantau NFT XRP secara langsung...`,
    help: `ℹ️ *Cara menggunakan BeardNFT Bot* ...`,
    trackStart: (id) => `✅ Mulai memantau *${id}*`,
    alreadyTrack: (id) => `⚠️ Sudah dipantau *${id}*`,
    stop: `🛑 Semua pemantauan dihentikan.`,
    list: `📋 Koleksi yang sedang dipantau:`,
    noList: `❌ Kamu belum memantau koleksi apa pun.`,
    langSet: `✅ Bahasa berhasil diubah.`
  },
  fr: {
    start: `🧔 *Bienvenue sur BeardNFT Bot!* ...`,
    help: `ℹ️ *Comment utiliser BeardNFT Bot* ...`,
    trackStart: (id) => `✅ Suivi de *${id}* démarré`,
    alreadyTrack: (id) => `⚠️ *${id}* est déjà suivi.`,
    stop: `🛑 Tous les suivis ont été arrêtés.`,
    list: `📋 Collections suivies:`,
    noList: `❌ Aucune collection suivie.`,
    langSet: `✅ Langue modifiée avec succès.`
  },
  de: {
    start: `🧔 *Willkommen beim BeardNFT Bot!* ...`,
    help: `ℹ️ *So verwendest du den BeardNFT Bot* ...`,
    trackStart: (id) => `✅ Überwachung von *${id}* gestartet`,
    alreadyTrack: (id) => `⚠️ *${id}* wird bereits überwacht.`,
    stop: `🛑 Alle Überwachungen gestoppt.`,
    list: `📋 Aktuell überwachte Sammlungen:`,
    noList: `❌ Keine Sammlungen werden derzeit überwacht.`,
    langSet: `✅ Sprache erfolgreich geändert.`
  },
  ru: {
    start: `🧔 *Добро пожаловать в BeardNFT Bot!* ...`,
    help: `ℹ️ *Как использовать BeardNFT Bot* ...`,
    trackStart: (id) => `✅ Отслеживание *${id}* начато`,
    alreadyTrack: (id) => `⚠️ *${id}* уже отслеживается.`,
    stop: `🛑 Все отслеживания остановлены.`,
    list: `📋 Отслеживаемые коллекции:`,
    noList: `❌ Нет отслеживаемых коллекций.`,
    langSet: `✅ Язык успешно изменен.`
  },
  ja: {
    start: `🧔 *BeardNFT Botへようこそ！* ...`,
    help: `ℹ️ *BeardNFT Botの使い方* ...`,
    trackStart: (id) => `✅ *${id}* の追跡を開始しました`,
    alreadyTrack: (id) => `⚠️ *${id}* はすでに追跡されています。`,
    stop: `🛑 すべての追跡を停止しました。`,
    list: `📋 現在追跡中のコレクション:`,
    noList: `❌ 追跡中のコレクションはありません。`,
    langSet: `✅ 言語が変更されました。`
  },
  zh: {
    start: `🧔 *欢迎使用BeardNFT Bot！* ...`,
    help: `ℹ️ *如何使用BeardNFT Bot* ...`,
    trackStart: (id) => `✅ 开始跟踪 *${id}*`,
    alreadyTrack: (id) => `⚠️ *${id}* 已在跟踪中。`,
    stop: `🛑 已停止所有跟踪。`,
    list: `📋 当前跟踪的收藏:`,
    noList: `❌ 没有正在跟踪的收藏。`,
    langSet: `✅ 语言设置成功。`
  },
  es: {
    start: `🧔 *¡Bienvenido a BeardNFT Bot!* ...`,
    help: `ℹ️ *Cómo usar BeardNFT Bot* ...`,
    trackStart: (id) => `✅ Comenzó el seguimiento de *${id}*`,
    alreadyTrack: (id) => `⚠️ *${id}* ya está siendo seguido.`,
    stop: `🛑 Se detuvo todo el seguimiento.`,
    list: `📋 Colecciones seguidas:`,
    noList: `❌ No estás siguiendo ninguna colección.`,
    langSet: `✅ Idioma configurado correctamente.`
  }
};
