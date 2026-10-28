import { BadgeCheck, Radio, Send, ShieldCheck } from "lucide-react";
import historyImg from "@/assets/proof-mt5-history.webp";
import positionsImg from "@/assets/proof-mt5-positions.webp";
import { PROOFS, type ProofImage, type TelegramProof, type TiktokProof } from "./proof-data";

/**
 * "Straight from the chats": real member messages drawn as futuristic
 * Telegram and TikTok-live cards. Copy lives in proof-data.ts; this file only
 * draws it. Motion is CSS-only and switched off by prefers-reduced-motion.
 */

const IMAGES: Record<ProofImage, { src: string; w: number; h: number; alt: string }> = {
  positions: {
    src: positionsImg,
    w: 400,
    h: 688,
    alt: "Trading app screenshot: a list of closed gold sell positions, each in profit.",
  },
  history: {
    src: historyImg,
    w: 546,
    h: 820,
    alt: "Trading app history screenshot: gold buy trades closed with a total profit of 35.94.",
  },
};

const initial = (name: string) =>
  name
    .replace(/^EzyMap \|\s*/, "")
    .charAt(0)
    .toUpperCase();

/** Glass shell shared by every card: neon edge, soft glow, faint scan lines. */
function Shell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-[#3ddc84]/25 bg-white/[0.04] shadow-[0_0_44px_-14px_rgba(61,220,132,0.55)] backdrop-blur-md transition-[border-color,box-shadow] duration-300 hover:border-[#3ddc84]/60 hover:shadow-[0_0_60px_-12px_rgba(61,220,132,0.75)]">
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3ddc84] to-transparent"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:repeating-linear-gradient(to_bottom,#fff_0_1px,transparent_1px_4px)]"
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#3ddc84]/10 to-transparent motion-safe:animate-[shine_6s_ease-in-out_infinite] motion-reduce:hidden"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
      <div className="relative flex h-full flex-col">{children}</div>
    </div>
  );
}

function TelegramCard({ proof }: { proof: TelegramProof }) {
  return (
    <Shell label={`Telegram chat with ${proof.name}`}>
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/30 px-4 py-3">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#3ddc84] to-[#12803f] text-base font-extrabold text-neutral-950"
          aria-hidden="true"
        >
          {initial(proof.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-white">{proof.name}</p>
          <p className="flex items-center gap-1.5 text-xs text-[#3ddc84]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3ddc84] motion-safe:animate-pulse" />
            Telegram
          </p>
        </div>
        <Send className="ml-auto h-5 w-5 text-[#3ddc84]" aria-hidden="true" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {proof.day ? (
          <p className="mx-auto rounded-full bg-white/10 px-3 py-0.5 font-mono text-[11px] text-neutral-300">
            {proof.day}
          </p>
        ) : null}
        {proof.messages.map((m) => {
          const img = m.image ? IMAGES[m.image] : null;
          return (
            <div
              key={m.text}
              className="max-w-[92%] rounded-2xl rounded-bl-sm border border-white/10 bg-[#13201c] p-2 motion-safe:animate-[fadeUp_0.5s_ease-out]"
            >
              {img ? (
                <img
                  src={img.src}
                  width={img.w}
                  height={img.h}
                  alt={img.alt}
                  loading="lazy"
                  decoding="async"
                  className="mb-2 max-h-72 w-full rounded-xl object-cover object-top"
                />
              ) : null}
              <p className="px-1.5 text-[15px] leading-snug text-white">{m.text}</p>
              <p className="mt-1 px-1.5 font-mono text-[11px] leading-snug text-[#3ddc84]/90">
                EN: {m.en}
              </p>
              <p className="px-1.5 pt-1 text-right font-mono text-[10px] text-neutral-400">
                {m.time} <span aria-hidden="true">✓✓</span>
              </p>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}

function TiktokCard({ proof }: { proof: TiktokProof }) {
  return (
    <Shell label={`TikTok live comments on ${proof.host}`}>
      <div className="flex items-center gap-3 border-b border-white/10 bg-black/30 px-4 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#fe2c55] px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">
          <Radio className="h-3.5 w-3.5 motion-safe:animate-pulse" aria-hidden="true" />
          Live
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-white">{proof.host}</p>
          <p className="text-xs text-[#25f4ee]">TikTok</p>
        </div>
        <span
          className="ml-auto h-5 w-5 rounded-full border-2 border-[#25f4ee] shadow-[2px_2px_0_0_#fe2c55]"
          aria-hidden="true"
        />
      </div>

      <ul className="flex flex-1 flex-col justify-center gap-3 p-4">
        {proof.comments.map((c, i) => (
          <li
            key={c.name}
            className="flex items-start gap-3 rounded-xl border border-white/10 bg-black/35 p-3 motion-safe:animate-[fadeUp_0.5s_ease-out_both]"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#25f4ee] to-[#fe2c55] text-sm font-extrabold text-neutral-950"
              aria-hidden="true"
            >
              {initial(c.name)}
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-neutral-300">
                {c.name}
                {c.rank ? (
                  <span className="rounded-full bg-[#fe2c55] px-2 py-px font-mono text-[10px] font-bold text-white">
                    No. {c.rank}
                  </span>
                ) : null}
              </p>
              <p className="text-[15px] text-white">{c.text}</p>
              <p className="font-mono text-[11px] text-[#25f4ee]/90">EN: {c.en}</p>
            </div>
          </li>
        ))}
        <li
          className="mt-1 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-neutral-400"
          aria-hidden="true"
        >
          Add comment…
        </li>
      </ul>
    </Shell>
  );
}

export function ProofWall() {
  return (
    <section
      aria-labelledby="proof-heading"
      className="relative overflow-hidden bg-neutral-950 px-5 py-14 sm:px-8 sm:py-20"
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(61,220,132,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(61,220,132,0.12)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,#000_30%,transparent_75%)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[#3ddc84]/40 bg-[#3ddc84]/10 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wide text-[#3ddc84]">
            <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Real messages
          </p>
          <h2
            id="proof-heading"
            className="text-3xl font-extrabold leading-[1.08] tracking-tight text-white [text-wrap:balance] sm:text-4xl lg:text-5xl"
          >
            Straight from the chats.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-neutral-300">
            What members wrote to us on Telegram and in our TikTok lives. Only the display names are
            changed.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PROOFS.map((p) => (
            <figure key={p.source} className="flex flex-col gap-3">
              <div className="flex-1">
                {p.kind === "telegram" ? <TelegramCard proof={p} /> : <TiktokCard proof={p} />}
              </div>
              <figcaption className="text-center text-xs text-neutral-400">{p.source}</figcaption>
            </figure>
          ))}
        </div>

        <p className="mx-auto mt-8 flex max-w-2xl items-start justify-center gap-2 text-center text-xs leading-relaxed text-neutral-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#3ddc84]" aria-hidden="true" />
          Individual results. Messages are the members' own words, not a promise of profit. Trading
          carries risk and alerts are information, not financial advice.
        </p>
      </div>
    </section>
  );
}
