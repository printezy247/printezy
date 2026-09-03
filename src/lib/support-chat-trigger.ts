const EVENT_NAME = "pe:open-support-chat";

/** Programmatically open the floating Sarah chat widget from anywhere on the site. */
export function openSupportChat() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function onOpenSupportChatRequested(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
