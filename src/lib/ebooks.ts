export type EbookChapter = { title: string; summary: string };

export type Ebook = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  author: string;
  language: string;
  image: string;
  pdf: string;
  pages: number;
  readTime: string;
  outcomes: string[];
  chapters: EbookChapter[];
  forYouIf: string[];
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
    pdf: "/ebooks/mapping-like-a-pro.pdf",
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
    pdf: "/ebooks/technical-analysis.pdf",
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
  },
];

export function getEbook(slug: string): Ebook | undefined {
  return EBOOK_PAGES.find((b) => b.slug === slug);
}
