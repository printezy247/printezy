// Server-only chat interface for the enrollment bot: the package menu,
// payment-status view and support shortcuts, all rendered as inline keyboards.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { TIER_CATALOG, formatPrice, getTier } from "./tiers";
import { sendMessage, telegramCall, type InlineButton } from "./telegram.server";
import { createMemberSession, accountLink, type EnrollmentRow } from "./member.server";

export const SUPPORT = "https://t.me/ezysarah";
export const FREE_CHANNEL = "https://t.me/ezymap";

/** Opens the in-bot live chat with Sarah (relay), not just a profile link. */
const BTN_ASK_SARAH: InlineButton = { text: "💬 Ask Sarah", callback_data: "sarah:start" };

/** Persistent slash-command list shown by Telegram's menu button. */
export async function registerBotCommands() {
  return telegramCall("setMyCommands", {
    commands: [
      { command: "start", description: "Open the EzyMap ALGO menu" },
      { command: "packages", description: "Browse packages and prices" },
      { command: "status", description: "Check your payment & access status" },
      { command: "account", description: "Open your trading account" },
      { command: "products", description: "Products, indicators and prices" },
      { command: "faq", description: "Common questions, answered" },
      { command: "language", description: "Switch language (en / ms)" },
      { command: "ask", description: "Message Sarah (human support)" },
      { command: "help", description: "What this bot can do" },
    ],
  });
}

function navRow(extra: InlineButton[] = []): InlineButton[] {
  return [
    { text: "📦 Packages", callback_data: "menu:packages" },
    { text: "🧾 My status", callback_data: "menu:status" },
    ...extra,
  ];
}

/** Home / package menu: every tier as a button, plus account and support. */
export async function sendMainMenu(chatId: number, firstName?: string | null) {
  const keyboard: InlineButton[][] = TIER_CATALOG.map((t) => [
    {
      text:
        t.id === "vantage"
          ? `🎁 ${t.name} — free via Vantage`
          : t.amountCents === 0
            ? `🆓 ${t.name}`
            : `${t.name} — ${formatPrice(t.amountCents)}`,
      callback_data: `tier:${t.id}`,
    },
  ]);
  keyboard.push([{ text: "🧾 Check my payment status", callback_data: "menu:status" }]);
  keyboard.push([{ text: "🔑 My trading account", callback_data: "menu:account" }]);
  keyboard.push([BTN_ASK_SARAH]);

  await sendMessage(
    chatId,
    `👋 <b>EzyMap ALGO${firstName ? ` — hi ${firstName}` : ""}.</b>\n\nPick a package below and I'll set your account up right here. Paid packages activate automatically the moment payment clears — tap <b>My status</b> any time to check.`,
    keyboard,
  );
}

/** Compact packages-only view (used by /packages and the nav row). */
export async function sendPackages(chatId: number) {
  const lines = TIER_CATALOG.map((t) => {
    const price =
      t.id === "vantage" ? "free via Vantage" : formatPrice(t.amountCents);
    return `<b>${t.name}</b> — ${price}\n<i>${t.blurb}</i>`;
  });
  const keyboard: InlineButton[][] = TIER_CATALOG.map((t) => [
    { text: `Choose ${t.name}`, callback_data: `tier:${t.id}` },
  ]);
  keyboard.push(navRow());
  keyboard.push([BTN_ASK_SARAH]);

  await sendMessage(
    chatId,
    `📦 <b>Packages</b>\n\n${lines.join("\n\n")}`,
    keyboard,
  );
}

const STATUS_ICON: Record<string, string> = {
  active: "🟢",
  pending: "🟡",
  expired: "🔴",
  canceled: "⚪️",
};

function statusLine(row: EnrollmentRow): string {
  const tier = getTier(row.tier);
  const name = tier?.name ?? row.tier;
  const icon = STATUS_ICON[row.status] ?? "⚪️";
  const price = row.amount_cents > 0 ? ` · ${formatPrice(row.amount_cents, row.currency)}` : "";

  let detail = "";
  if (row.status === "pending") detail = " — awaiting payment";
  else if (row.status === "active" && row.expires_at) {
    detail = ` — until ${new Date(row.expires_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
  } else if (row.status === "active") detail = " — live";

  return `${icon} <b>${name}</b>${price}${detail}`;
}

/** Payment & access status for this member, newest first. */
export async function sendPaymentStatus(chatId: number, telegramId: number) {
  const { data, error } = await supabaseAdmin
    .from("enrollments")
    .select("id, tier, amount_cents, currency, status, created_at, activated_at, expires_at")
    .eq("telegram_id", telegramId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) console.error("[menu] status query failed", error);

  const rows = (data as EnrollmentRow[] | null) ?? [];
  const pending = rows.find((r) => r.status === "pending");
  const hasActive = rows.some(
    (r) =>
      r.status === "active" &&
      (!r.expires_at || new Date(r.expires_at).getTime() > Date.now()),
  );

  const keyboard: InlineButton[][] = [];
  if (pending) {
    const tier = getTier(pending.tier);
    if (tier && tier.amountCents > 0) {
      keyboard.push([
        {
          text: `💳 Resume ${tier.name} payment`,
          callback_data: `tier:${tier.id}`,
        },
      ]);
    }
  }
  if (!hasActive) {
    keyboard.push([{ text: "📦 Browse packages", callback_data: "menu:packages" }]);
  } else {
    keyboard.push([{ text: "🔑 Open my account", callback_data: "menu:account" }]);
  }
  keyboard.push(navRow());
  keyboard.push([BTN_ASK_SARAH]);

  const body =
    rows.length === 0
      ? `🧾 <b>Your status</b>\n\nNo packages yet — pick one below and you'll appear here instantly.`
      : `🧾 <b>Your status</b>\n\n${rows.map(statusLine).join("\n")}\n\n<i>🟢 active · 🟡 awaiting payment · 🔴 expired</i>`;

  await sendMessage(chatId, body, keyboard);
}

/** Account shortcut with a fresh 30-day sign-in link. */
export async function sendAccountLink(chatId: number, telegramId: number) {
  const sessionToken = await createMemberSession(telegramId);
  await sendMessage(
    chatId,
    sessionToken
      ? `🔑 <b>Your trading account</b>\n\nThis link signs you in for 30 days — your signals, your trade log, your stats and your billing history.`
      : `Something went wrong opening your account. Try again in a moment.`,
    sessionToken
      ? [
          [{ text: "Open my account", url: accountLink(sessionToken) }],
          navRow(),
          [BTN_ASK_SARAH],
        ]
      : [navRow(), [BTN_ASK_SARAH]],
  );
}

/** Support shortcut — opens the in-bot live chat with Sarah. */
export async function sendAskSarah(chatId: number) {
  const { openSarahChat } = await import("./sarah.server");
  await openSarahChat(chatId);
}

/** Nothing in the reply book matched — nudge, don't leave them in silence. */
export async function sendFallback(chatId: number) {
  await sendMessage(
    chatId,
    `Hmm, I don't have a ready answer for that one — I've passed it to Sarah and she'll come back to you personally. Meanwhile, here's what I can show you 👇`,
    [
      [
        { text: "🛍 Products", callback_data: "kw:products" },
        { text: "❓ FAQ", callback_data: "kw:faq" },
      ],
      navRow(),
      [BTN_ASK_SARAH],
    ],
  );
}
