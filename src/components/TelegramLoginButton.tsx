import { useEffect, useRef, useState } from "react";

/**
 * Telegram's Login Widget. Telegram renders the button itself, inside an
 * iframe it controls — there is no way to style it or to fake it, which is
 * the point: the payload it hands back is signed by the bot token and can be
 * checked server-side.
 *
 * It only renders when Telegram recognises the page's domain, so the button
 * silently failing to appear almost always means BotFather /setdomain has not
 * been set for this bot. `onUnavailable` gives the caller a chance to keep a
 * fallback sign-in on screen when that happens.
 */
export type TelegramAuthPayload = {
  id: string;
  auth_date: string;
  hash: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

/**
 * The widget calls back with numeric id and auth_date; the signature covers
 * the decimal strings, so everything is stringified before it leaves here.
 * A payload without the three signed essentials is dropped rather than sent —
 * the server would only reject it.
 */
function asStrings(user: Record<string, unknown>): TelegramAuthPayload | null {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(user)) {
    if (value === null || value === undefined) continue;
    out[key] = String(value);
  }
  if (!out.id || !out.auth_date || !out.hash) return null;
  return out as TelegramAuthPayload;
}

export function TelegramLoginButton({
  botUsername,
  onAuth,
  requestWriteAccess = true,
  onUnavailable,
}: {
  /** Bot the button belongs to, without the @. Null hides the button. */
  botUsername: string | null;
  onAuth: (payload: TelegramAuthPayload) => void;
  /** Asks for permission to message the buyer — how the product is delivered. */
  requestWriteAccess?: boolean;
  onUnavailable?: () => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  // Held in a ref so a re-render with a new handler does not tear down and
  // re-inject the widget, which would flicker the button.
  const handler = useRef(onAuth);
  handler.current = onAuth;
  const unavailable = useRef(onUnavailable);
  unavailable.current = onUnavailable;

  useEffect(() => {
    const host = holder.current;
    if (!botUsername || !host) return;

    // The widget calls a function by name off window, so each mount gets its
    // own to avoid two buttons on a page fighting over one global.
    const callbackName = `onTelegramAuth_${Math.random().toString(36).slice(2, 10)}`;
    const globals = window as unknown as Record<string, unknown>;
    globals[callbackName] = (user: Record<string, unknown>) => {
      const payload = asStrings(user);
      if (payload) handler.current(payload);
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "10");
    script.setAttribute("data-userpic", "false");
    if (requestWriteAccess) script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", `${callbackName}(user)`);
    script.onerror = () => {
      setFailed(true);
      unavailable.current?.();
    };
    host.appendChild(script);

    return () => {
      delete globals[callbackName];
      host.replaceChildren();
    };
  }, [botUsername, requestWriteAccess]);

  if (!botUsername || failed) return null;
  return <div ref={holder} className="flex justify-center [&_iframe]:!m-0" />;
}
