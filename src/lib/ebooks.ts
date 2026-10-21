export type EbookChapter = { title: string; summary: string };

export type EbookCopy = {
  title: string;
  tagline: string;
  description: string;
  readTime: string;
  outcomes: string[];
  chapters: EbookChapter[];
  forYouIf: string[];
};

export type Ebook = EbookCopy & {
  slug: string;
  author: string;
  /** Language of the PDF itself (the file is English for every locale). */
  language: string;
  image: string;
  /** Object key inside the private `ebooks` storage bucket. Never a public URL. */
  file: string;
  pages: number;
  /** Page copy in Malay; the PDF stays English. */
  ms?: EbookCopy;
};

/**
 * The covers live in /public, so the site serves them itself instead of
 * pointing at the asset store. One source of truth: Landing.tsx imports these
 * too, so a cover swap can never miss a second hardcoded URL.
 */
export const EBOOK_COVER_MAPPING = "/ebook-cover-mapping-like-a-pro.png";
export const EBOOK_COVER_TECHNICAL = "/ebook-cover-technical-analysis.png";

export const EBOOK_PAGES: Ebook[] = [
  {
    slug: "mapping-like-a-pro",
    title: "Mapping Like A Pro",
    tagline: "Read the market top-down, from Weekly to M15, and wait for the entry to confirm.",
    description:
      "A short, beginner-friendly guide to mapping the market the way professional traders do. Start with the Weekly trend, refine the zones on Daily and H4, then filter entries on H1 and M15, so you plan the trade first and trade the plan.",
    author: "EzyMap ALGO",
    language: "en",
    image: EBOOK_COVER_MAPPING,
    file: "mapping-like-a-pro.pdf",
    pages: 12,
    readTime: "10 min read",
    outcomes: [
      "Map the market top-down from Weekly to M15 in three clear steps",
      "Mark support and resistance zones, and spot A- and V-shapes with a line chart",
      "Tell a valid breakout from a fakeout before you enter",
      "Run a pre-trade checklist covering risk, reward and stop loss",
    ],
    chapters: [
      { title: "What is mapping?", summary: "The difference between random trading and professional mapping, with a top-down ladder." },
      { title: "Weekly mapping", summary: "Identify the major trend and mark the key support and resistance zones." },
      { title: "Daily and H4 mapping", summary: "Refine the big picture, find fresh and stronger zones, and plan breakouts." },
      { title: "H1 and M15 filter", summary: "Zoom in, filter the noise and find high-probability entries." },
      { title: "Breakout vs fakeout", summary: "How to spot a real breakout, and why you wait for the next M15 candle." },
      { title: "Newbie secret tips", summary: "Line charts, A and V shapes, looking left, and the Weekly-to-M15 flow." },
      { title: "Pre-trade checklist", summary: "Weekly marked, Daily refined, H4 zones, entry confirmed, risk and stop planned." },
    ],
    forYouIf: [
      "You are new to trading and want one simple process",
      "You keep entering without a plan or a clear level",
      "You get caught by false breakouts",
    ],
    ms: {
      title: "Memetakan Seperti Pro",
      tagline: "Baca pasaran dari atas ke bawah, dari Mingguan ke M15, dan tunggu kemasukan disahkan.",
      description:
        "Panduan ringkas dan mesra pemula untuk memetakan pasaran seperti pedagang profesional. Mulakan dengan trend Mingguan, perhalusi zon pada Harian dan H4, kemudian tapis kemasukan pada H1 dan M15, supaya anda merancang dagangan dahulu dan berdagang mengikut pelan.",
      readTime: "Bacaan 10 minit",
      outcomes: [
        "Petakan pasaran dari atas ke bawah, Mingguan hingga M15, dalam tiga langkah jelas",
        "Tanda zon sokongan dan rintangan, dan kenali bentuk A dan V dengan carta garisan",
        "Bezakan pecah-keluar sah daripada fakeout sebelum anda masuk",
        "Jalankan senarai semak pra-dagangan merangkumi risiko, ganjaran dan stop loss",
      ],
      chapters: [
        { title: "Apa itu pemetaan?", summary: "Beza antara dagangan rawak dan pemetaan profesional, dengan tangga atas-ke-bawah." },
        { title: "Pemetaan Mingguan", summary: "Kenal pasti trend utama dan tanda zon sokongan dan rintangan penting." },
        { title: "Pemetaan Harian & H4", summary: "Perhalusi gambaran besar, cari zon baharu yang lebih kuat, dan rancang pecah-keluar." },
        { title: "Penapis H1 & M15", summary: "Zum masuk, tapis bunyi bising dan cari kemasukan berkebarangkalian tinggi." },
        { title: "Breakout lawan fakeout", summary: "Cara mengesan breakout sebenar dan mengapa anda menunggu lilin M15 seterusnya." },
        { title: "Tip rahsia pemula", summary: "Carta garisan, bentuk A dan V, tengok ke kiri, dan aliran Mingguan ke M15." },
        { title: "Senarai semak pra-dagangan", summary: "Mingguan ditanda, Harian diperhalusi, zon H4, kemasukan disahkan, risiko dan stop loss dirancang." },
      ],
      forYouIf: [
        "Anda baru dalam dagangan dan mahukan satu proses yang mudah",
        "Anda asyik masuk tanpa pelan atau paras yang jelas",
        "Anda sering terperangkap dengan pecah-keluar palsu",
      ],
    },
  },
  {
    slug: "technical-analysis",
    title: "Technical Analysis Ebook",
    tagline: "Support & resistance, trendlines, chart patterns and candlesticks — the core toolkit, no fluff.",
    description:
      "The four building blocks every trader uses to read a chart before taking a trade: where price is likely to react, how to draw the lines that matter, the patterns that repeat, and what a single candle is telling you.",
    author: "EzyMap ALGO",
    language: "en",
    image: EBOOK_COVER_TECHNICAL,
    file: "technical-analysis.pdf",
    pages: 14,
    readTime: "10 min read",
    outcomes: [
      "Spot support and resistance zones and know how traders actually use them",
      "Draw trendlines correctly and read what their angle and breaks mean",
      "Recognise the key reversal and continuation chart patterns",
      "Read single and multi-candle patterns like doji, engulfing and morning/evening star",
    ],
    chapters: [
      { title: "Why use technical analysis", summary: "Charting the patterns and trends before you take a trade." },
      { title: "Support & resistance", summary: "Where buyers and sellers take over, and how levels flip once broken." },
      { title: "Trendlines", summary: "How to draw them, read their angle, and what a break signals." },
      { title: "Chart patterns", summary: "Reversal patterns (head & shoulders, double top/bottom, wedges) and continuation patterns (flags, triangles)." },
      { title: "Candlestick patterns", summary: "Single-candle signals (doji, hammer, marubozu) and multi-candle signals (engulfing, morning/evening star, three soldiers/crows)." },
    ],
    forYouIf: [
      "You want the core chart-reading toolkit in one short guide",
      "You're just starting with support/resistance, trendlines and candles",
      "You'd rather see the essentials than wade through ten strategies",
    ],
    ms: {
      title: "E-buku Analisis Teknikal",
      tagline: "Sokongan & rintangan, garis aliran, corak carta dan lilin — kit alat teras, tanpa bunga-bunga.",
      description:
        "Empat blok binaan yang setiap pedagang guna untuk membaca carta sebelum berdagang: di mana harga berkemungkinan bertindak balas, cara melukis garis yang penting, corak yang berulang, dan apa yang satu lilin sedang beritahu anda.",
      readTime: "Bacaan 10 minit",
      outcomes: [
        "Kenal pasti zon sokongan dan rintangan dan tahu cara pedagang sebenarnya menggunakannya",
        "Lukis garis aliran dengan betul dan baca maksud sudut dan penembusannya",
        "Kenali corak carta pembalikan dan penerusan yang utama",
        "Baca corak lilin tunggal dan berbilang seperti doji, engulfing dan bintang pagi/petang",
      ],
      chapters: [
        { title: "Mengapa guna analisis teknikal", summary: "Memetakan corak dan aliran sebelum anda berdagang." },
        { title: "Sokongan & rintangan", summary: "Di mana pembeli dan penjual mengambil alih, dan cara paras bertukar selepas ditembusi." },
        { title: "Garis aliran", summary: "Cara melukisnya, membaca sudutnya, dan apa yang penembusan isyaratkan." },
        { title: "Corak carta", summary: "Corak pembalikan (kepala & bahu, puncak/dasar berganda, baji) dan corak penerusan (bendera, segi tiga)." },
        { title: "Corak lilin", summary: "Isyarat lilin tunggal (doji, tukul, marubozu) dan berbilang lilin (engulfing, bintang pagi/petang, tiga askar/gagak)." },
      ],
      forYouIf: [
        "Anda mahukan kit alat pembacaan carta teras dalam satu panduan ringkas",
        "Anda baru bermula dengan sokongan/rintangan, garis aliran dan lilin",
        "Anda lebih suka melihat perkara asas daripada meredah sepuluh strategi",
      ],
    },
  },
];

export function getEbook(slug: string): Ebook | undefined {
  return EBOOK_PAGES.find((b) => b.slug === slug);
}

/** Book with its page copy swapped to `locale` where a translation exists. */
export function localizeEbook(book: Ebook, locale: string): Ebook {
  return locale === "ms" && book.ms ? { ...book, ...book.ms } : book;
}
