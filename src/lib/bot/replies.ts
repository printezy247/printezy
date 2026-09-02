// Sarah's keyword reply book — ported from the tg-ezy-chatbot repo
// (config/replies.json), with package/pricing buttons pointed at this site's
// own tier flow instead of the standalone bot's checkout.
//
// Each entry: trigger words per language + one or more reply variations
// (picked at random) + optional inline buttons.

export type Lang = "en" | "ms";

export type Btn = { text: string } & (
  | { url: string }
  | { keyword: string }
  /** Opens this site's real package picker (Free / Vantage / Pro / Premium / Elite). */
  | { tiers: true }
  /** Paid TradingView / MT5 item — Sarah arranges payment. */
  | { buy: { product: string; plan: string } }
  /** 3-day trial request for an MT5 tool — notifies Sarah. */
  | { trial: string }
  /** Hands over to the live chat with Sarah. */
  | { sarah: true }
);

export type Entry = {
  id: string;
  match?: Record<Lang, string[]>;
  replies: Record<Lang, string[]>;
  buttons?: Partial<Record<Lang, Btn[][]>>;
};

export const LANGUAGES: Lang[] = ["en", "ms"];
export const DEFAULT_LANG: Lang = "en";

const TRADINGVIEW_FREE =
  "https://www.tradingview.com/pricing/?share_your_love=printezyusd&mobileapp=true";
const VANTAGE_TELEGRAM =
  "https://t.me/vantagemarketsbot/VantageMiniAPP?startapp=d080fea26efa46a5b17bd2a3a2fe508b477e165c11d642cf2dbd63f04d6fdf2b";
const VANTAGE_PROMOS =
  "https://www.vantagemarketsea.com/ms/promotions/deposit-bonus/?affid=MjY0NjgwMDg=&invitecode=oQQlQ8yM";
const VANTAGE_APP =
  "https://h5.vantagemarketapp.com/h5/thirdparty/support/register?agentAccount=MjY0NjgwMDg=&invitecode=oQQlQ8yM";
const VANTAGE_ANDROID_APK =
  "https://vau-usa.oss-accelerate.aliyuncs.com//apk/au/Vantage.apk";

const backTo = (keyword: string, ms: string, en = "⬅ Back"): Btn[][] => [
  [{ text: en, keyword }],
  // second language handled by caller when needed
  [{ text: ms, keyword }],
];
void backTo;

/** MT5 single-tool entries all share the same plan ladder. */
function mt5Tool(
  id: string,
  match: { en: string[]; ms: string[] },
  copy: { en: string; ms: string },
  prices: { m1: number; m6: number; y1: number },
): Entry {
  const plans = (lang: Lang): Btn[][] => [
    [
      {
        text: lang === "en" ? `1 Month – $${prices.m1}` : `1 Bulan – $${prices.m1}`,
        buy: { product: id, plan: "1m" },
      },
    ],
    [
      {
        text: lang === "en" ? `6 Months – $${prices.m6}` : `6 Bulan – $${prices.m6}`,
        buy: { product: id, plan: "6m" },
      },
    ],
    [
      {
        text: lang === "en" ? `1 Year – $${prices.y1}` : `1 Tahun – $${prices.y1}`,
        buy: { product: id, plan: "1y" },
      },
    ],
    [{ text: lang === "en" ? "🎁 Try 3-Day Trial" : "🎁 Cuba Percubaan 3 Hari", trial: id }],
    [{ text: lang === "en" ? "⬅ Back" : "⬅ Kembali", keyword: "mt5_products" }],
  ];
  return {
    id,
    match,
    replies: { en: [copy.en], ms: [copy.ms] },
    buttons: { en: plans("en"), ms: plans("ms") },
  };
}

export const ENTRIES: Entry[] = [
  {
    id: "greeting",
    match: {
      en: ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"],
      ms: ["hai", "helo", "salam", "selamat pagi", "selamat petang", "selamat tengahari"],
    },
    replies: {
      en: [
        "Hi hun, it's Sarah! Always nice hearing from someone new, what can I do for you today?",
        "Hey you! Thanks for messaging, what's on your mind?",
      ],
      ms: [
        "Hai sayang, ni Sarah! Best jugak dapat message baru, ada apa saya boleh bantu?",
        "Hai! Terima kasih message, apa yang bawa awak ke sini hari ni?",
      ],
    },
    buttons: {
      en: [
        [{ text: "🛍 Products (Free & Purchase)", keyword: "products" }],
        [{ text: "❓ I Have Other Question", keyword: "faq" }],
      ],
      ms: [
        [{ text: "🛍 Produk (Percuma & Beli)", keyword: "products" }],
        [{ text: "❓ Saya Ada Soalan Lain", keyword: "faq" }],
      ],
    },
  },
  {
    id: "products",
    match: {
      en: [
        "price",
        "pricing",
        "cost",
        "how much",
        "product",
        "products",
        "indicator",
        "ezymap",
        "buy",
        "package",
        "packages",
      ],
      ms: ["harga", "berapa harga", "kos", "produk", "indicator", "beli", "pakej"],
    },
    replies: {
      en: [
        "We've got a couple of things that could suit you. Have a look and tell me what catches your eye ✨",
        "Depends what you're after, hun. Here's what we offer, take your pick below.",
      ],
      ms: [
        "Kami ada beberapa pilihan yang mungkin sesuai untuk awak. Tengok dulu, bagitahu saya mana yang menarik ✨",
        "Bergantung apa awak cari, sayang. Ni pilihan kami, pilih je di bawah.",
      ],
    },
    buttons: {
      en: [
        [{ text: "🎯 Signal Packages", tiers: true }],
        [
          { text: "📈 TradingView", keyword: "tv_products" },
          { text: "🖥 MT5 Tools", keyword: "mt5_products" },
        ],
      ],
      ms: [
        [{ text: "🎯 Pakej Signal", tiers: true }],
        [
          { text: "📈 TradingView", keyword: "tv_products" },
          { text: "🖥 Alat MT5", keyword: "mt5_products" },
        ],
      ],
    },
  },
  {
    id: "tv_products",
    match: {
      en: ["tradingview", "trading view", "tv indicator", "tv products"],
      ms: ["tradingview", "trading view"],
    },
    replies: {
      en: ["Here's what we've got for TradingView. Pick a version to see pricing."],
      ms: ["Ni yang kami ada untuk TradingView. Pilih versi untuk lihat harga."],
    },
    buttons: {
      en: [
        [
          { text: "EzyMap Lite", keyword: "tv_lite" },
          { text: "EzyMap Pro", keyword: "tv_pro" },
        ],
        [{ text: "⬅ Back", keyword: "products" }],
      ],
      ms: [
        [
          { text: "EzyMap Lite", keyword: "tv_lite" },
          { text: "EzyMap Pro", keyword: "tv_pro" },
        ],
        [{ text: "⬅ Kembali", keyword: "products" }],
      ],
    },
  },
  {
    id: "tv_lite",
    match: {
      en: ["tv lite", "ezymap lite", "tradingview lite"],
      ms: ["tv lite", "ezymap lite", "tradingview lite"],
    },
    replies: {
      en: [
        "TradingView EzyMap Lite gives you the drawing & mapping tools on TradingView, no live signals, a cheaper way to get started. One-time payment, lifetime access.",
      ],
      ms: [
        "TradingView EzyMap Lite bagi awak alat drawing & mapping di TradingView, tiada live signals, cara lebih murah untuk mula. Bayar sekali sahaja, akses seumur hidup.",
      ],
    },
    buttons: {
      en: [
        [{ text: "Lifetime – $49", buy: { product: "tv_lite", plan: "lifetime" } }],
        [{ text: "⬅ Back", keyword: "tv_products" }],
      ],
      ms: [
        [{ text: "Sekali Bayar – $49", buy: { product: "tv_lite", plan: "lifetime" } }],
        [{ text: "⬅ Kembali", keyword: "tv_products" }],
      ],
    },
  },
  {
    id: "tv_pro",
    match: {
      en: ["tv pro", "ezymap pro", "tradingview pro"],
      ms: ["tv pro", "ezymap pro", "tradingview pro"],
    },
    replies: {
      en: [
        "TradingView EzyMap Pro gives you the full indicator with live signals from M1 all the way to H4, great if you're already trading on TradingView. One-time payment, lifetime access.",
      ],
      ms: [
        "TradingView EzyMap Pro bagi awak indicator penuh dengan live signals dari M1 sampai H4, sesuai kalau awak dah trading di TradingView. Bayar sekali sahaja, akses seumur hidup.",
      ],
    },
    buttons: {
      en: [
        [{ text: "Lifetime – $249", buy: { product: "tv_pro", plan: "lifetime" } }],
        [{ text: "⬅ Back", keyword: "tv_products" }],
      ],
      ms: [
        [{ text: "Sekali Bayar – $249", buy: { product: "tv_pro", plan: "lifetime" } }],
        [{ text: "⬅ Kembali", keyword: "tv_products" }],
      ],
    },
  },
  {
    id: "mt5_products",
    match: {
      en: ["mt5", "mt5 indicators", "mt5 tools", "mt5 bundle"],
      ms: ["mt5", "mt5 indicator", "mt5 bundle"],
    },
    replies: {
      en: [
        "Here's everything we've got for MT5. The full bundle covers all 17 indicators, or pick just the one you need.",
      ],
      ms: [
        "Ni semua yang kami ada untuk MT5. Bundle penuh cover semua 17 indicator, atau pilih je yang awak perlukan.",
      ],
    },
    buttons: {
      en: [
        [{ text: "MT5 Full Bundle (worth $999)", keyword: "mt5_bundle" }],
        [
          { text: "Bulk Close", keyword: "mt5_bulk_close" },
          { text: "Drawdown Guardian", keyword: "mt5_drawdown_guardian" },
        ],
        [
          { text: "Auto TPSL", keyword: "mt5_auto_tpsl" },
          { text: "Currency Strength", keyword: "mt5_currency_strength" },
        ],
        [{ text: "MTF Bias", keyword: "mt5_mtf_bias" }],
        [{ text: "⬅ Back", keyword: "products" }],
      ],
      ms: [
        [{ text: "MT5 Full Bundle (bernilai $999)", keyword: "mt5_bundle" }],
        [
          { text: "Bulk Close", keyword: "mt5_bulk_close" },
          { text: "Drawdown Guardian", keyword: "mt5_drawdown_guardian" },
        ],
        [
          { text: "Auto TPSL", keyword: "mt5_auto_tpsl" },
          { text: "Currency Strength", keyword: "mt5_currency_strength" },
        ],
        [{ text: "MTF Bias", keyword: "mt5_mtf_bias" }],
        [{ text: "⬅ Kembali", keyword: "products" }],
      ],
    },
  },
  mt5Tool(
    "mt5_bundle",
    { en: ["mt5 indicator bundle", "full bundle"], ms: ["bundle penuh"] },
    {
      en: "The full bundle gives you all 17 MT5 EzyMap indicators in one go, best value if you want everything.",
      ms: "Bundle penuh bagi awak semua 17 indicator EzyMap MT5 sekali gus, value terbaik kalau awak nak semuanya.",
    },
    { m1: 99, m6: 499, y1: 999 },
  ),
  mt5Tool(
    "mt5_bulk_close",
    { en: ["bulk close", "layer close"], ms: ["bulk close", "layer close"] },
    {
      en: "Bulk Close lets you close partial profit across any number of layers, fast. Our top seller for a reason.",
      ms: "Bulk Close boleh close partial profit merentasi mana-mana bilangan layer, dengan pantas. Top seller kami sebab tu.",
    },
    { m1: 19, m6: 109, y1: 199 },
  ),
  mt5Tool(
    "mt5_drawdown_guardian",
    {
      en: ["drawdown guardian", "drawdown", "prop firm"],
      ms: ["drawdown guardian", "drawdown", "prop firm"],
    },
    {
      en: "Drawdown Guardian keeps you alert to your current drawdown so you don't get eliminated from a prop firm challenge. A favorite with our prop firm traders.",
      ms: "Drawdown Guardian sentiasa alert awak dengan drawdown semasa supaya tak eliminate daripada prop firm challenge. Kegemaran trader prop firm kami.",
    },
    { m1: 9, m6: 49, y1: 99 },
  ),
  mt5Tool(
    "mt5_auto_tpsl",
    { en: ["auto tpsl", "tp sl", "take profit stop loss"], ms: ["auto tpsl", "tp sl"] },
    {
      en: "Auto TPSL saves you setting TP & SL manually for every single layer. One less thing to worry about.",
      ms: "Auto TPSL jimatkan masa awak set TP & SL secara manual untuk setiap layer. Satu lagi benda awak tak perlu fikir.",
    },
    { m1: 9, m6: 49, y1: 99 },
  ),
  mt5Tool(
    "mt5_currency_strength",
    {
      en: ["currency strength", "strength meter", "volatility"],
      ms: ["currency strength", "strength meter", "volatility"],
    },
    {
      en: "Currency Strength Meter keeps you updated on the current volatility of the most traded currencies, at a glance.",
      ms: "Currency Strength Meter sentiasa update awak dengan volatility semasa currency yang paling banyak di-trade, sekali pandang je.",
    },
    { m1: 9, m6: 49, y1: 99 },
  ),
  mt5Tool(
    "mt5_mtf_bias",
    { en: ["mtf bias", "multi timeframe bias"], ms: ["mtf bias"] },
    {
      en: "MTF Bias reveals bullish or bearish bias to give you confluence for your trading plan as it adapts.",
      ms: "MTF Bias dedahkan bias bullish atau bearish untuk beri confluence kepada trading plan awak yang sentiasa berubah.",
    },
    { m1: 9, m6: 49, y1: 99 },
  ),
  {
    id: "broker",
    match: {
      en: [
        "vantage",
        "broker",
        "free steps",
        "free account",
        "open account",
        "beginner",
        "vip",
        "free",
        "signal",
        "signals",
        "ebook",
        "ebooks",
        "promotion",
        "promotions",
        "bonus",
        "deposit bonus",
        "download app",
        "vantage app",
        "register vantage",
        "ezyscalper",
        "ezyintraday",
        "ezyswing",
        "elite circle",
      ],
      ms: [
        "vantage",
        "broker",
        "langkah percuma",
        "buka akaun",
        "beginner",
        "vip",
        "percuma",
        "signal",
        "ebook",
        "promosi",
        "bonus",
        "muat turun app",
        "daftar vantage",
        "ezyscalper",
        "ezyintraday",
        "ezyswing",
        "elite circle",
      ],
    },
    replies: {
      en: [
        "We work with Vantage Markets for trading, Jack's used them for years for the fast withdrawals and quick executions. Opening an account under his IB unlocks free perks too: ebooks, signals, indicators, depending on your tier, no extra payment needed.",
      ],
      ms: [
        "Kami bekerjasama dengan Vantage Markets untuk trading, Jack dah guna mereka bertahun-tahun sebab pengeluaran laju dan eksekusi pantas. Buka akaun di bawah IB dia bukak perks percuma juga: ebook, signal, indicator, bergantung tier awak, tiada bayaran tambahan.",
      ],
    },
    buttons: {
      en: [
        [{ text: "🎁 See Packages", tiers: true }],
        [{ text: "📝 Register thru Telegram Bot", url: VANTAGE_TELEGRAM }],
        [{ text: "🎁 Promotions & Rewards", url: VANTAGE_PROMOS }],
        [{ text: "📲 Download the Vantage App", url: VANTAGE_APP }],
      ],
      ms: [
        [{ text: "🎁 Lihat Pakej", tiers: true }],
        [{ text: "📝 Daftar melalui Bot Telegram", url: VANTAGE_TELEGRAM }],
        [{ text: "🎁 Promosi & Ganjaran", url: VANTAGE_PROMOS }],
        [{ text: "📲 Muat Turun App Vantage", url: VANTAGE_APP }],
      ],
    },
  },
  {
    id: "faq",
    match: {
      en: ["faq", "questions", "other question", "i have a question", "help me understand"],
      ms: ["faq", "soalan", "soalan lain", "ada soalan"],
    },
    replies: {
      en: ["Got questions? Pick one below and I'll answer right here ✨"],
      ms: ["Ada soalan? Pilih satu di bawah dan saya jawab terus ✨"],
    },
    buttons: {
      en: [
        [{ text: "Is it free to join?", keyword: "faq_free" }],
        [{ text: "Free packages vs Purchase?", keyword: "faq_difference" }],
        [{ text: "How much deposit?", keyword: "faq_deposit" }],
        [{ text: "What's in Elite?", keyword: "faq_elite" }],
        [{ text: "Already have a Vantage account?", keyword: "faq_existing_account" }],
        [{ text: "How long to unlock?", keyword: "faq_unlock_time" }],
        [{ text: "How do I pay?", keyword: "faq_how_to_pay" }],
        [{ text: "Refund or cancel?", keyword: "faq_refund" }],
        [{ text: "Need TradingView?", keyword: "faq_tradingview" }],
        [{ text: "Stuck during signup/payment?", keyword: "faq_stuck" }],
        [{ text: "Vantage app won't download (Android)", keyword: "faq_android" }],
      ],
      ms: [
        [{ text: "Percuma ke nak join?", keyword: "faq_free" }],
        [{ text: "Pakej percuma vs Beli?", keyword: "faq_difference" }],
        [{ text: "Berapa deposit?", keyword: "faq_deposit" }],
        [{ text: "Apa ada dalam Elite?", keyword: "faq_elite" }],
        [{ text: "Dah ada akaun Vantage?", keyword: "faq_existing_account" }],
        [{ text: "Berapa lama nak dibuka?", keyword: "faq_unlock_time" }],
        [{ text: "Macam mana nak bayar?", keyword: "faq_how_to_pay" }],
        [{ text: "Refund atau batal?", keyword: "faq_refund" }],
        [{ text: "Perlu TradingView?", keyword: "faq_tradingview" }],
        [{ text: "Stuck semasa daftar/bayar?", keyword: "faq_stuck" }],
        [{ text: "App Vantage tak boleh download (Android)", keyword: "faq_android" }],
      ],
    },
  },
  {
    id: "faq_free",
    match: {
      en: ["is joining free", "is it really free", "free to join"],
      ms: ["free ke join", "percuma ke join"],
    },
    replies: {
      en: [
        "Yes! The Free tier and the 30-day Vantage Trial cost nothing — the trial just needs an account under Jack's IB with Vantage Markets. The paid packages (Pro $49, Premium $99, Elite $299) and the EzyMap indicators are the only things you pay for.",
      ],
      ms: [
        "Ya! Tier Free dan Vantage Trial 30 hari percuma sepenuhnya — trial cuma perlukan akaun di bawah IB Jack bersama Vantage Markets. Pakej berbayar (Pro $49, Premium $99, Elite $299) dan indicator EzyMap sahaja yang berbayar.",
      ],
    },
    buttons: {
      en: [
        [{ text: "🎁 See Packages", tiers: true }],
        [{ text: "⬅ Back to FAQ", keyword: "faq" }],
      ],
      ms: [
        [{ text: "🎁 Lihat Pakej", tiers: true }],
        [{ text: "⬅ Kembali ke FAQ", keyword: "faq" }],
      ],
    },
  },
  {
    id: "faq_difference",
    match: {
      en: ["difference between free and purchase", "whats the difference between packages"],
      ms: ["beza pakej percuma", "apa beza free dan purchase"],
    },
    replies: {
      en: [
        "The Free tier and the Vantage Trial are unlocked by your broker account status under Jack's IB. Pro, Premium and Elite are paid memberships with the full routines and signal feed. The EzyMap indicators (TradingView / MT5) are separate one-off products.",
      ],
      ms: [
        "Tier Free dan Vantage Trial dibuka berdasarkan status akaun broker anda di bawah IB Jack. Pro, Premium dan Elite adalah keahlian berbayar dengan routine penuh dan feed signal. Indicator EzyMap (TradingView / MT5) adalah produk berasingan sekali bayar.",
      ],
    },
    buttons: {
      en: [[{ text: "⬅ Back to FAQ", keyword: "faq" }]],
      ms: [[{ text: "⬅ Kembali ke FAQ", keyword: "faq" }]],
    },
  },
  {
    id: "faq_deposit",
    match: {
      en: ["how much deposit", "minimum deposit"],
      ms: ["berapa deposit", "deposit minimum"],
    },
    replies: {
      en: [
        "For the Vantage Trial you just need a live account opened under Jack's IB — any deposit amount starts it. Paid packages don't require a broker deposit at all.",
      ],
      ms: [
        "Untuk Vantage Trial anda cuma perlukan akaun live di bawah IB Jack — sebarang jumlah deposit boleh mula. Pakej berbayar tak perlukan deposit broker langsung.",
      ],
    },
    buttons: {
      en: [
        [{ text: "🎁 See Packages", tiers: true }],
        [{ text: "⬅ Back to FAQ", keyword: "faq" }],
      ],
      ms: [
        [{ text: "🎁 Lihat Pakej", tiers: true }],
        [{ text: "⬅ Kembali ke FAQ", keyword: "faq" }],
      ],
    },
  },
  {
    id: "faq_elite",
    match: {
      en: ["what do i get with elite", "elite package perks"],
      ms: ["apa saya dapat pakej elite"],
    },
    replies: {
      en: [
        "Everything in Premium, plus the full EzyMap MT5 indicator set (Drawdown Guardian, Bulk Close with Layer Close, Auto TPSL, and more), and the Ezy Elite Circle with 1-on-1 support from Jack.",
      ],
      ms: [
        "Semua dalam Premium, ditambah set penuh indicator EzyMap MT5 (Drawdown Guardian, Bulk Close with Layer Close, Auto TPSL, dan banyak lagi), serta Ezy Elite Circle dengan sokongan 1-on-1 daripada Jack.",
      ],
    },
    buttons: {
      en: [
        [{ text: "🎁 See Packages", tiers: true }],
        [{ text: "⬅ Back to FAQ", keyword: "faq" }],
      ],
      ms: [
        [{ text: "🎁 Lihat Pakej", tiers: true }],
        [{ text: "⬅ Kembali ke FAQ", keyword: "faq" }],
      ],
    },
  },
  {
    id: "faq_existing_account",
    match: {
      en: ["already have a vantage account", "i already have an account"],
      ms: ["sudah ada akaun vantage", "dah ada akaun vantage"],
    },
    replies: {
      en: [
        "Yes! Use Change IB instead of opening a new account (it's done by email, not a link), then submit your details the same way.",
      ],
      ms: [
        "Boleh! Guna Tukar IB dan bukannya buka akaun baharu (dibuat melalui email, bukan link), kemudian hantar maklumat anda dengan cara yang sama.",
      ],
    },
    buttons: {
      en: [
        [{ text: "🎁 See Packages", tiers: true }],
        [{ text: "⬅ Back to FAQ", keyword: "faq" }],
      ],
      ms: [
        [{ text: "🎁 Lihat Pakej", tiers: true }],
        [{ text: "⬅ Kembali ke FAQ", keyword: "faq" }],
      ],
    },
  },
  {
    id: "faq_unlock_time",
    match: {
      en: ["how long until unlocked", "how long to unlock my package"],
      ms: ["bila pakej saya dibuka", "berapa lama nak dibuka"],
    },
    replies: {
      en: [
        "Paid packages unlock automatically the moment payment clears — check with /status. The Vantage Trial unlocks as soon as you confirm your account is open under Jack's IB.",
      ],
      ms: [
        "Pakej berbayar dibuka automatik sebaik pembayaran selesai — semak dengan /status. Vantage Trial dibuka sebaik anda sahkan akaun anda dibuka di bawah IB Jack.",
      ],
    },
    buttons: {
      en: [[{ text: "⬅ Back to FAQ", keyword: "faq" }]],
      ms: [[{ text: "⬅ Kembali ke FAQ", keyword: "faq" }]],
    },
  },
  {
    id: "faq_how_to_pay",
    match: {
      en: ["how do i pay", "how to pay for indicator", "payment method"],
      ms: ["macam mana nak bayar", "cara bayar indicator"],
    },
    replies: {
      en: [
        "Packages are paid by card through a secure checkout link the bot sends you — access unlocks by itself once it clears. For the EzyMap indicators, tell me which one and Sarah will send you the payment details here.",
      ],
      ms: [
        "Pakej dibayar dengan kad melalui link checkout selamat yang bot hantar — akses dibuka sendiri sebaik selesai. Untuk indicator EzyMap, bagitahu saya yang mana satu dan Sarah akan hantar butiran pembayaran di sini.",
      ],
    },
    buttons: {
      en: [
        [{ text: "🎯 See Packages", tiers: true }],
        [{ text: "⬅ Back to FAQ", keyword: "faq" }],
      ],
      ms: [
        [{ text: "🎯 Lihat Pakej", tiers: true }],
        [{ text: "⬅ Kembali ke FAQ", keyword: "faq" }],
      ],
    },
  },
  {
    id: "faq_refund",
    match: {
      en: ["refund", "cancel my purchase", "can i get a refund"],
      ms: ["boleh refund", "batal pembelian"],
    },
    replies: {
      en: ["Message Sarah directly to discuss. Refund/cancellation isn't handled automatically."],
      ms: ["Mesej Sarah terus untuk berbincang. Pembatalan/refund tidak dikendalikan secara automatik."],
    },
    buttons: {
      en: [
        [{ text: "💬 Ask Sarah", sarah: true }],
        [{ text: "⬅ Back to FAQ", keyword: "faq" }],
      ],
      ms: [
        [{ text: "💬 Tanya Sarah", sarah: true }],
        [{ text: "⬅ Kembali ke FAQ", keyword: "faq" }],
      ],
    },
  },
  {
    id: "faq_tradingview",
    match: {
      en: ["need tradingview", "do i need a tradingview account"],
      ms: ["perlu tradingview", "perlukan akaun tradingview"],
    },
    replies: {
      en: [
        "The TradingView EzyMap indicators (Lite/Pro) need a free or paid TradingView account. The MT5 bundle and individual indicators (Drawdown Guardian, Bulk Close, Auto TPSL, Currency Strength Meter, MTF Bias) run on MT5 instead, no TradingView needed for those.",
      ],
      ms: [
        "Indicator EzyMap TradingView (Lite/Pro) memerlukan akaun TradingView percuma atau berbayar. Bundle MT5 dan indicator individu (Drawdown Guardian, Bulk Close, Auto TPSL, Currency Strength Meter, MTF Bias) berjalan di MT5, tak perlukan TradingView untuk yang ini.",
      ],
    },
    buttons: {
      en: [
        [{ text: "📊 Get TradingView FREE", url: TRADINGVIEW_FREE }],
        [{ text: "⬅ Back to FAQ", keyword: "faq" }],
      ],
      ms: [
        [{ text: "📊 Dapatkan TradingView PERCUMA", url: TRADINGVIEW_FREE }],
        [{ text: "⬅ Kembali ke FAQ", keyword: "faq" }],
      ],
    },
  },
  {
    id: "faq_stuck",
    match: {
      en: ["stuck during registration", "stuck during payment", "i'm stuck", "im stuck"],
      ms: ["stuck semasa pendaftaran", "saya stuck"],
    },
    replies: {
      en: [
        "Go through the Open Account or Change IB steps again from the packages menu, or message Sarah directly and she'll sort it with you.",
      ],
      ms: [
        "Ulang langkah Open Account atau Change IB dari menu pakej, atau mesej Sarah terus dan dia akan bantu awak.",
      ],
    },
    buttons: {
      en: [
        [{ text: "💬 Ask Sarah", sarah: true }],
        [{ text: "⬅ Back to FAQ", keyword: "faq" }],
      ],
      ms: [
        [{ text: "💬 Tanya Sarah", sarah: true }],
        [{ text: "⬅ Kembali ke FAQ", keyword: "faq" }],
      ],
    },
  },
  {
    id: "faq_android",
    match: {
      en: ["cant download vantage android", "vantage app android"],
      ms: ["tak boleh muat turun vantage", "muat turun app android"],
    },
    replies: {
      en: [
        "Having trouble downloading the Vantage app on Android? Tap below for a direct download link.",
      ],
      ms: [
        "Ada masalah muat turun app Vantage di Android? Tekan di bawah untuk pautan muat turun terus.",
      ],
    },
    buttons: {
      en: [
        [{ text: "📲 Download for Android", url: VANTAGE_ANDROID_APK }],
        [{ text: "⬅ Back to FAQ", keyword: "faq" }],
      ],
      ms: [
        [{ text: "📲 Muat Turun untuk Android", url: VANTAGE_ANDROID_APK }],
        [{ text: "⬅ Kembali ke FAQ", keyword: "faq" }],
      ],
    },
  },
  {
    id: "hours",
    match: {
      en: ["hours", "opening hours", "operating hours", "when are you open"],
      ms: ["waktu operasi", "waktu bekerja", "bila buka", "buka pukul berapa"],
    },
    replies: {
      en: [
        "The bot's here 24/7, and Sarah answers personally through the day — just message anytime and she'll get back to you as soon as she can.",
      ],
      ms: [
        "Bot ni ada 24/7, dan Sarah reply sendiri sepanjang hari — message je bila-bila, dia akan balas secepat mungkin.",
      ],
    },
  },
  {
    id: "contact",
    match: {
      en: ["contact", "phone number", "call", "whatsapp", "email"],
      ms: ["hubungi", "nombor telefon", "whatsapp", "emel"],
    },
    replies: {
      en: ["Easiest is right here, hun — tap Ask Sarah and she'll pick it up personally."],
      ms: ["Paling senang di sini je, sayang — tekan Tanya Sarah dan dia akan reply sendiri."],
    },
    buttons: {
      en: [[{ text: "💬 Ask Sarah", sarah: true }]],
      ms: [[{ text: "💬 Tanya Sarah", sarah: true }]],
    },
  },
  {
    id: "thanks",
    match: {
      en: ["thanks", "thank you", "appreciate it"],
      ms: ["terima kasih", "tq", "makasih"],
    },
    replies: {
      en: [
        "Aww, you're so welcome hun 💛 I'm just a message away whenever you need me.",
        "Anytime, honestly. I like being useful, just message me whenever.",
      ],
      ms: [
        "Aww sama-sama sayang 💛 saya cuma sehantar mesej je kalau awak perlukan apa-apa.",
        "Sama-sama, betul-betul. Saya suka tolong, message je saya bila-bila.",
      ],
    },
  },
  {
    id: "help",
    match: {
      en: ["help", "support", "assist"],
      ms: ["bantuan", "tolong", "sokongan"],
    },
    replies: {
      en: [
        "I'm here for you! Ask me about our packages, pricing, or the free broker perks, and I'll walk you through it.",
      ],
      ms: [
        "Saya di sini untuk awak! Tanya pasal pakej kami, harga, atau perks broker percuma, saya akan terangkan.",
      ],
    },
    buttons: {
      en: [
        [{ text: "🛍 Products (Free & Purchase)", keyword: "products" }],
        [{ text: "❓ I Have Other Question", keyword: "faq" }],
      ],
      ms: [
        [{ text: "🛍 Produk (Percuma & Beli)", keyword: "products" }],
        [{ text: "❓ Saya Ada Soalan Lain", keyword: "faq" }],
      ],
    },
  },
];

export const ENTRY_BY_ID = new Map(ENTRIES.map((e) => [e.id, e]));
