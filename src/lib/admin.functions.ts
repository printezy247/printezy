import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = (data: unknown) => z.object({ key: z.string().min(1) }).parse(data);

/**
 * Verifies the shared admin passphrase (ADMIN_DASHBOARD_KEY project secret).
 * Used to gate private pages such as the Track Record archive.
 */
export const verifyAdminKey = createServerFn({ method: "POST" })
  .inputValidator(schema)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const expected = process.env["ADMIN_DASHBOARD_KEY"];
    if (!expected) throw new Error("Admin passphrase is not configured yet.");
    if (data.key !== expected) throw new Error("Wrong passphrase.");
    return { ok: true };
  });
