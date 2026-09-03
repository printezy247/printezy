import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckout } from "@/lib/checkout.functions";

type Props = {
  sku: string;
  onClose: () => void;
};

export function StripeEmbeddedCheckout({ sku, onClose }: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const result = await createCheckout({
      data: {
        sku,
        origin: window.location.origin,
        environment: getStripeEnvironment(),
      },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Stripe did not return a client secret");
    return result.clientSecret;
  };

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
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative my-8 w-full max-w-lg rounded-xl border border-border bg-background"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
          <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
