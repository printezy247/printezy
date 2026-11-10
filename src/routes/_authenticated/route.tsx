import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSupabase } from "@/integrations/supabase/lazy";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const supabase = await getSupabase();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
