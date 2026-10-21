/**
 * Copy rendered by the `/` Welcome page and reused to build its HowTo and
 * FAQPage JSON-LD, so the structured data can never drift from the visible
 * text. Kept out of Welcome.tsx so that file exports only components.
 */

export const STEPS = [
  {
    n: "1",
    title: "Join the free channel",
    body: "One tap opens Telegram. No sign-up form, no card.",
  },
  {
    n: "2",
    title: "Get the alert",
    body: "When a setup forms your phone buzzes with the full plan.",
  },
  {
    n: "3",
    title: "Act on your terms",
    body: "Take it, skip it, or study it. Daily education shows the reasoning.",
  },
];

export const FAQ = [
  {
    q: "Is the channel really free?",
    a: "Yes. Joining the Telegram channel costs nothing and needs no card. Paid plans exist for people who want more, but they are never required.",
  },
  {
    q: "Do I need trading experience?",
    a: "No. Alerts come with the reasoning, and the daily education is written so a beginner can follow it while experienced traders still find the levels useful.",
  },
  {
    q: "Which markets do you cover?",
    a: "Forex, gold, crypto and major indices, such as XAUUSD, BTCUSD and EURUSD.",
  },
  {
    q: "Are signals guaranteed to win?",
    a: "No. Nobody can promise that, and anyone who does should be avoided. Every trade can lose. That is why each alert comes with a stop and a defined risk.",
  },
  {
    q: "Can I leave any time?",
    a: "Yes. Leave or mute the channel whenever you like. There is nothing to cancel.",
  },
];
