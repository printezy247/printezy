/**
 * Messages members actually sent, shown as chat cards. Wording is theirs;
 * only the display name is changed to "EzyMap | <name>". Each entry carries an
 * English translation and a `source` line so the page stays honest about
 * where it came from. Never add a message nobody sent.
 */

export type ProofImage = "positions" | "history";

export type TelegramMessage = {
  text: string;
  en: string;
  time: string;
  image?: ProofImage;
};

export type TelegramProof = {
  kind: "telegram";
  name: string;
  day?: string;
  messages: TelegramMessage[];
  source: string;
};

export type TiktokComment = { name: string; text: string; en: string; rank?: number };

export type TiktokProof = {
  kind: "tiktok";
  host: string;
  comments: TiktokComment[];
  source: string;
};

export type Proof = TelegramProof | TiktokProof;

export const PROOFS: Proof[] = [
  {
    kind: "telegram",
    name: "EzyMap | Boy",
    messages: [
      {
        text: "paduh abng jack tq",
        en: "Solid work, bro Jack. Thank you.",
        time: "8:37 AM",
        image: "positions",
      },
      {
        text: "dari 20 dol skrng 500 sbb ikut chart ni semalam 😍",
        en: "From $20 to $500 now because I followed this chart last night.",
        time: "8:37 AM",
      },
    ],
    source: "Member's own Telegram message to EzyMap.",
  },
  {
    kind: "telegram",
    name: "EzyMap | Asad",
    day: "October 27",
    messages: [
      {
        text: "Follow live jack paduuu 🙏🔥",
        en: "Followed Jack's live. Really solid.",
        time: "12:42 AM",
        image: "history",
      },
    ],
    source: "Member's own Telegram message to EzyMap, 27 Oct.",
  },
  {
    kind: "tiktok",
    host: "EzyMap | Jack",
    comments: [
      { name: "EzyMap | Ghost", text: "thank you", en: "Thank you.", rank: 1 },
      { name: "EzyMap | Miloo", text: "ss chart", en: "Screenshot the chart, please.", rank: 3 },
      { name: "EzyMap | WMRZ", text: "slmat malam", en: "Good evening.", rank: 3 },
    ],
    source: "Live comments from one of Jack's TikTok lives, as they appeared.",
  },
];
