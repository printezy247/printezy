import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";

type Props = { onNavigate?: () => void; className?: string };

/** Session-aware account affordance for the site nav. */
export function AccountNavButton({ onNavigate, className = "" }: Props) {
  const { user, loading } = useSupabaseUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (loading) return null;

  if (!user) {
    return (
      <Link
        to="/auth"
        search={{ redirect: undefined }}
        onClick={onNavigate}
        className={`inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-body transition-colors hover:text-primary ${className}`}
      >
        <User className="h-4 w-4" /> Sign in
      </Link>
    );
  }

  async function signOut() {
    onNavigate?.();
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { redirect: undefined }, replace: true });
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Link
        to="/my-account"
        onClick={onNavigate}
        className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-body transition-colors hover:text-primary"
      >
        <User className="h-4 w-4" /> My account
      </Link>
      <button
        type="button"
        onClick={signOut}
        aria-label="Sign out"
        className="rounded-md p-2 text-muted transition-colors hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
