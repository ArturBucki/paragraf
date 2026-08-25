import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, currentUser } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { SwipeDeck } from "@/components/SwipeDeck";

export const dynamic = "force-dynamic";

export default async function SwipePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const supabase = createClient();

  const { data: me } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!me || !me.name) redirect("/onboarding");

  const [{ data: liked }, { data: passed }] = await Promise.all([
    supabase.from("likes").select("liked").eq("liker", user.id),
    supabase.from("passes").select("passed").eq("passer", user.id),
  ]);

  const seen = [
    user.id,
    ...(liked ?? []).map((r) => r.liked),
    ...(passed ?? []).map((r) => r.passed),
  ];

  const { data: candidates } = await supabase
    .from("profiles")
    .select("*")
    .not("id", "in", `(${seen.join(",")})`)
    .limit(25);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 py-4">
      <header className="mb-3 flex items-center justify-between px-2">
        <span className="font-display text-xl font-extrabold">
          para<span className="text-coral">graf</span>
        </span>
        <Link href="/matches" className="font-mono text-xs uppercase tracking-wide text-inksoft">
          Dopasowania →
        </Link>
      </header>
      <SwipeDeck candidates={(candidates as Profile[]) ?? []} />
    </main>
  );
}
