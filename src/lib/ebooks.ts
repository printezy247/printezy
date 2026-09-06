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

const ebookMapping = "/__l5e/assets-v1/b177d46a-680e-4021-ae98-bcc3631ab665/ebook-mapping-like-pro.png";
const ebookTechnical = "/__l5e/assets-v1/eb540617-0a0b-4444-993e-d90be97af7d7/ebook-technical-analysis.png";

export const EBOOK_PAGES: Ebook[] = [
  {
    slug: "mapping-like-a-pro",
    title: "Mapping Like A Pro",
    tagline: "Turn any chart into a decision map — support, resistance and a 20-minute daily routine.",
    description:
      "Stop guessing the next candle. This guide shows you how to mark the levels that actually hold, grade them A/B/C, and pre-write the plan so you only execute decisions you already made calmly.",
    author: "EzyMap ALGO",
    language: "en",
    image: ebookMapping,
    file: "mapping-like-a-pro.pdf",
    pages: 12,
    readTime: "15 min read",
    outcomes: [
      "Draw support and resistance zones that hold instead of leak",
      "Grade every level A, B or C so only quality zones get real risk",
      "Run a complete 20-minute pre-market routine around a full-time job",
      "Size positions with a formula, not a feeling",
    ],
    chapters: [
      { title: "Why mapping beats prediction", summary: "The three questions every map must answer before you can click." },
      { title: "Building the higher-timeframe skeleton", summary: "Daily → H4 → H1 structure, and the six-zone limit." },
      { title: "Support and resistance that actually hold", summary: "The departure, freshness, confluence and location filter." },
      { title: "The 20-minute daily routine", summary: "A minute-by-minute pre-session checklist with alerts, not screen time." },
      { title: "Entry triggers and confirmation", summary: "Three triggers ranked, and why you only use one for 50 trades." },
      { title: "Risk, sizing and the maths", summary: "Position size, expectancy and the daily stop that keeps you solvent." },
      { title: "Journaling and review", summary: "The weekly plan-adherence score that is your real skill metric." },
    ],
    forYouIf: [
      "You can only look at charts before or after work",
      "Your levels keep getting run through",
      "You want a routine you can repeat every single day",
    ],
    ms: {
      title: "Memetakan Seperti Pro",
      tagline: "Tukar mana-mana carta kepada peta keputusan — sokongan, rintangan dan rutin harian 20 minit.",
      description:
        "Berhenti meneka lilin seterusnya. Panduan ini menunjukkan cara menanda paras yang benar-benar bertahan, menggredkannya A/B/C, dan menulis pelan lebih awal supaya anda hanya melaksanakan keputusan yang sudah dibuat dengan tenang.",
      readTime: "Bacaan 15 minit",
      outcomes: [
        "Lukis zon sokongan dan rintangan yang bertahan, bukan bocor",
        "Gredkan setiap paras A, B atau C supaya hanya zon berkualiti menerima risiko sebenar",
        "Jalankan rutin pra-pasaran 20 minit yang lengkap di sebalik kerja sepenuh masa",
        "Tentukan saiz kedudukan dengan formula, bukan perasaan",
      ],
      chapters: [
        { title: "Mengapa pemetaan mengatasi ramalan", summary: "Tiga soalan yang setiap peta mesti jawab sebelum anda klik." },
        { title: "Membina rangka rangka masa tinggi", summary: "Struktur Harian → H4 → H1, dan had enam zon." },
        { title: "Sokongan dan rintangan yang benar-benar bertahan", summary: "Penapis pelepasan, kesegaran, pertemuan dan lokasi." },
        { title: "Rutin harian 20 minit", summary: "Senarai semak pra-sesi minit demi minit dengan amaran, bukan masa skrin." },
        { title: "Pencetus kemasukan dan pengesahan", summary: "Tiga pencetus disusun mengikut kedudukan, dan mengapa anda hanya guna satu untuk 50 dagangan." },
        { title: "Risiko, saiz dan matematiknya", summary: "Saiz kedudukan, jangkaan dan henti harian yang memastikan anda kekal solven." },
        { title: "Jurnal dan semakan", summary: "Skor kepatuhan pelan mingguan yang menjadi metrik kemahiran sebenar anda." },
      ],
      forYouIf: [
        "Anda hanya boleh melihat carta sebelum atau selepas kerja",
        "Paras anda asyik ditembusi",
        "Anda mahukan rutin yang boleh diulang setiap hari",
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
    image: ebookTechnical,
    file: "technical-analysis.pdf",
    pages: 21,
    readTime: "15 min read",
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
      readTime: "Bacaan 15 minit",
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
