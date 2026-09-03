import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { X } from "lucide-react";
import { saveMyProfile, type Profile } from "@/lib/profile.functions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  profile: Profile;
  requireMt5: boolean;
  onSaved: () => void;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-md border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

export function PurchaseDetailsForm({ profile, requireMt5, onSaved, onClose }: Props) {
  const save = useServerFn(saveMyProfile);
  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [telegramUsername, setTelegramUsername] = useState(profile.telegramUsername ?? "");
  const [experienceLevel, setExperienceLevel] = useState(profile.experienceLevel ?? "");
  const [capitalRange, setCapitalRange] = useState(profile.capitalRange ?? "");
  const [mt5Account, setMt5Account] = useState(profile.mt5Account ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);

  const handle = telegramUsername.trim().replace(/^@+/, "");
  const ready = /^[A-Za-z0-9_]{5,32}$/.test(handle) && (!requireMt5 || mt5Account.trim().length > 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      await save({
        data: {
          fullName,
          telegramUsername: handle,
          ...(experienceLevel ? { experienceLevel } : {}),
          ...(capitalRange ? { capitalRange } : {}),
          ...(mt5Account ? { mt5Account } : {}),
        },
      });
      toast.success("Profile saved");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your details.");
      setPulse((p) => p + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, ...(pulse ? { scale: [1, 1.02, 1] } : {}) }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative my-8 w-full max-w-md rounded-xl border border-border bg-background p-6"
        >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md p-1.5 text-muted hover:bg-elevated hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold text-foreground">A few quick details</h2>
        <p className="mt-1 text-sm text-muted">
          One-time — saved to your account, you won't be asked again.
        </p>

        <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
          <label className="text-sm text-muted">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            className={inputClass}
          />

          <label className="text-sm text-muted">Telegram username</label>
          <input
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value)}
            placeholder="your_telegram"
            autoComplete="off"
            spellCheck={false}
            className={inputClass}
          />

          <label className="text-sm text-muted">Trading experience</label>
          <Select
            value={experienceLevel || "unspecified"}
            onValueChange={(v) => setExperienceLevel(v === "unspecified" ? "" : v)}
          >
            <SelectTrigger className={inputClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unspecified">Prefer not to say</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <label className="text-sm text-muted">Capital you're working with</label>
          <Select
            value={capitalRange || "unspecified"}
            onValueChange={(v) => setCapitalRange(v === "unspecified" ? "" : v)}
          >
            <SelectTrigger className={inputClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unspecified">Prefer not to say</SelectItem>
              <SelectItem value="under_1k">Under $1k</SelectItem>
              <SelectItem value="1k_10k">$1k – $10k</SelectItem>
              <SelectItem value="10k_plus">$10k+</SelectItem>
            </SelectContent>
          </Select>

          {requireMt5 ? (
            <>
              <label className="text-sm text-muted">MT5 account number</label>
              <input
                value={mt5Account}
                onChange={(e) => setMt5Account(e.target.value.replace(/\D/g, ""))}
                placeholder="12345678"
                inputMode="numeric"
                className={inputClass}
              />
            </>
          ) : null}

          <button
            type="submit"
            disabled={!ready || busy}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Saving…" : "Continue to payment"}
          </button>
          {error && <p className="text-sm text-[#d9534f]">{error}</p>}
        </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
