import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getAdminStatus } from "@/lib/admin.functions";

/** Renders children only for accounts holding the admin role. */
export function AdminGate({ children }: { children: ReactNode }) {
  const check = useServerFn(getAdminStatus);
  const [state, setState] = useState<"loading" | "allowed" | "denied">("loading");

  useEffect(() => {
    let active = true;
    void check({ data: undefined })
      .then((r) => {
        if (active) setState(r.isAdmin ? "allowed" : "denied");
      })
      .catch(() => {
        if (active) setState("denied");
      });
    return () => {
      active = false;
    };
  }, [check]);

  if (state === "loading") {
    return <p className="mx-auto max-w-md px-4 py-24 text-sm text-muted-foreground">Checking access…</p>;
  }
  if (state === "denied") {
    return (
      <div className="mx-auto max-w-md px-4 py-24">
        <h1 className="text-2xl tracking-tight">Not authorised</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This account does not have admin access. Sign in with the administrator account.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
