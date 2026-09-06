// Grants an MT5 tool subscription on the EzyMap License Server (a separate
// Node.js service - see the EzyMap repo's EzyMapLicenseServer) the moment a
// website MT5 purchase is fulfilled. One compiled .ex5 per tool works for
// every customer - access is controlled server-side by MT5 account number,
// so "delivering" a sale here just means telling that server "this account
// now has this subscription." Same integration already wired into
// ASAP-TeleBot (see mt5_license.py there) - this is the website's copy of
// the same call.
//
// Left unconfigured (no MT5_LICENSE_SERVER_URL/MT5_LICENSE_ADMIN_TOKEN),
// every call is a silent no-op, same pattern as Meta CAPI (see meta.server.ts) -
// the purchase still records and Sarah still gets notified, it just falls
// back to manual fulfillment instead of auto-granting.

// Catalog sku (see catalog.ts) -> the license server's product id
// (EzyMapLicenseServer/lib/products.js) and tier code. Kept as an explicit
// map (not parsed from the sku string) so the two vocabularies can diverge
// later without a silent mismatch - mirrors mt5_license.py's PRODUCT_CODE_MAP.
const MT5_SKU_MAP: Record<string, { product: string; tier: string }> = {
  mt5_bundle_1m: { product: "bundle", tier: "1m" },
  mt5_bundle_6m: { product: "bundle", tier: "6m" },
  mt5_bundle_1y: { product: "bundle", tier: "1y" },
  mt5_bulk_close_1m: { product: "bulkclose", tier: "1m" },
  mt5_bulk_close_6m: { product: "bulkclose", tier: "6m" },
  mt5_bulk_close_1y: { product: "bulkclose", tier: "1y" },
  mt5_drawdown_guardian_1m: { product: "drawdownguardian", tier: "1m" },
  mt5_drawdown_guardian_6m: { product: "drawdownguardian", tier: "6m" },
  mt5_drawdown_guardian_1y: { product: "drawdownguardian", tier: "1y" },
  mt5_auto_tpsl_1m: { product: "autotpsl", tier: "1m" },
  mt5_auto_tpsl_6m: { product: "autotpsl", tier: "6m" },
  mt5_auto_tpsl_1y: { product: "autotpsl", tier: "1y" },
  mt5_currency_strength_1m: { product: "currencystrength", tier: "1m" },
  mt5_currency_strength_6m: { product: "currencystrength", tier: "6m" },
  mt5_currency_strength_1y: { product: "currencystrength", tier: "1y" },
  mt5_mtf_bias_1m: { product: "mtfbias", tier: "1m" },
  mt5_mtf_bias_6m: { product: "mtfbias", tier: "6m" },
  mt5_mtf_bias_1y: { product: "mtfbias", tier: "1y" },
};

export function isMt5Sku(sku: string): boolean {
  return sku in MT5_SKU_MAP;
}

function mt5LicenseConfig() {
  const serverUrl = process.env.MT5_LICENSE_SERVER_URL;
  const adminToken = process.env.MT5_LICENSE_ADMIN_TOKEN;
  if (!serverUrl || !adminToken) return null;
  return { serverUrl: serverUrl.replace(/\/+$/, ""), adminToken };
}

/**
 * Grants (or extends) an MT5 subscription on the license server. Returns
 * true on success, false on any failure (including "not configured" or an
 * unknown sku) - never throws, so a license-server hiccup must never block
 * the purchase confirmation the buyer is waiting on. Callers should fall
 * back to a manual-fulfillment notice when this returns false.
 */
export async function grantMt5License(args: {
  account: string;
  sku: string;
  note?: string;
}): Promise<boolean> {
  const config = mt5LicenseConfig();
  if (!config) {
    console.warn(
      `[mt5-license] MT5_LICENSE_SERVER_URL/MT5_LICENSE_ADMIN_TOKEN not configured - skipping auto-grant for account=${args.account} sku=${args.sku}`,
    );
    return false;
  }

  const mapping = MT5_SKU_MAP[args.sku];
  if (!mapping) {
    console.error(`[mt5-license] Unknown MT5 sku "${args.sku}" - cannot map to a license server product/tier`);
    return false;
  }

  try {
    const response = await fetch(`${config.serverUrl}/admin/grant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.adminToken}`,
      },
      body: JSON.stringify({
        account: args.account,
        product: mapping.product,
        tier: mapping.tier,
        note: args.note ?? "",
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!response.ok || !data.ok) {
      console.error(
        `[mt5-license] License server rejected grant for account=${args.account} product=${mapping.product} tier=${mapping.tier}: ${data.error ?? response.statusText}`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error(
      `[mt5-license] Failed to reach license server granting account=${args.account} product=${mapping.product} tier=${mapping.tier}`,
      error,
    );
    return false;
  }
}
