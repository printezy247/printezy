export type EbookChapter = { title: string; summary: string };

export type Ebook = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
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
    image: ebookMapping,
    pdf: "/ebooks/mapping-like-a-pro.pdf",
    pages: 8,
    readTime: "20 min read",
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
    tagline: "Price action fundamentals, a confluence framework and the risk rules that keep you trading.",
    description:
      "A deliberately minimal system: read price first, confirm with three indicators, and never break the risk rules. Built for traders drowning in indicators that all say the same thing.",
    image: ebookTechnical,
    pdf: "/ebooks/technical-analysis.pdf",
    pages: 9,
    readTime: "25 min read",
    outcomes: [
      "Read structure, trend and transition without a single indicator",
      "Apply a location + momentum + timing confluence check to every setup",
      "Cut your chart down to four indicators that add real information",
      "Follow risk rules that survive losing streaks",
    ],
    chapters: [
      { title: "Price action first, indicators second", summary: "Why price wins whenever an indicator disagrees." },
      { title: "Candles that carry information", summary: "The only three candle shapes that change a decision." },
      { title: "Market structure and the break that matters", summary: "Protected swings and change of character." },
      { title: "The confluence framework", summary: "Three independent reasons — two is a watch, three is a trade." },
      { title: "A minimal indicator set", summary: "EMA 50/200, RSI 14, ATR 14 and session boxes. Nothing else." },
      { title: "Multi-timeframe execution", summary: "Bias, setup and trigger frames, and never fighting the bias." },
      { title: "Risk management rules", summary: "Fixed fractional risk, ATR stops and the two-loss daily stop." },
      { title: "Your first 30 days", summary: "A week-by-week ramp from chart study to smallest live size." },
    ],
    forYouIf: [
      "Your chart has more indicators than candles",
      "You win often but still finish the month flat",
      "You want one framework instead of ten strategies",
    ],
  },
];

export function getEbook(slug: string): Ebook | undefined {
  return EBOOK_PAGES.find((b) => b.slug === slug);
}
