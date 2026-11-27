import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTicker } from "@/lib/ticker.functions";

/**
 * Latest XAU/USD price, read from the same query as the header price strip
 * (same key, same fetcher), so the two always show the same number.
 * Returns null until the first quote arrives.
 */
export function useXauUsdPrice(): number | null {
  const loadTicker = useServerFn(getTicker);
  const { data } = useQuery({
    queryKey: ["header-ticker"],
    queryFn: () => loadTicker(),
    refetchInterval: 60_000,
    staleTime: 55_000,
  });
  const quote = data?.quotes.find((item) => item.symbol === "XAU/USD");
  const value = quote ? Number.parseFloat(quote.price.replace(/,/g, "")) : Number.NaN;
  return Number.isFinite(value) && value > 0 ? value : null;
}
