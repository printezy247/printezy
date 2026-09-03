import { Send } from "lucide-react";
import { botStartLink, MACRO_BOT_URL } from "@/lib/telegram-links";
import { track } from "@/lib/analytics";

type Props = {
  /** Exact ?start= payload — never modified or suffixed. */
  payload: string;
  variant?: "primary" | "gold";
  className?: string;
  /** Hide the small payment-methods line (for dense list rows). */
  hideNote?: boolean;
};

const NOTE = "Card, USDT or Telegram Stars — access delivered instantly in Telegram.";

/** Single buy path: open EzyRegisterBot with the product payload. */
export function TelegramBuyButton({
  payload,
  variant = "primary",
  className = "",
  hideNote = false,
}: Props) {
  const styles =
    variant === "gold"
      ? "border border-[rgba(201,161,58,0.45)] bg-accent/5 text-accent hover:bg-accent/10"
      : "bg-primary text-primary-foreground hover:opacity-90";

  return (
    <div className={className}>
      <a
        href={botStartLink(payload)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("click", `buy_${payload}`)}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${styles}`}
      >
        <Send className="h-4 w-4" /> Get it in Telegram
      </a>
      {hideNote ? null : (
        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{NOTE}</p>
      )}
    </div>
  );
}

/** Macro desk products live in a separate bot with no deep-link payloads. */
export function MacroSubscribeButton({
  className = "",
  variant = "gold",
}: {
  className?: string;
  variant?: "primary" | "gold";
}) {
  const styles =
    variant === "gold"
      ? "border border-[rgba(201,161,58,0.45)] bg-accent/5 text-accent hover:bg-accent/10"
      : "bg-primary text-primary-foreground hover:opacity-90";

  return (
    <div className={className}>
      <a
        href={MACRO_BOT_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => track("click", "macro_subscribe")}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${styles}`}
      >
        <Send className="h-4 w-4" /> Subscribe in Telegram
      </a>
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
        Tap /subscribe in the bot to choose this product.
      </p>
    </div>
  );
}
