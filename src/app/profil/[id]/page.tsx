import { notFound, redirect } from "next/navigation";
import { createClient, currentUser } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { ProfileView } from "@/components/ProfileView";

export const dynamic = "force-dynamic";

export default async function ProfilPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { skad?: string };
}) {
  const user = await currentUser();
  if (!user) redirect("/login");

  // Własny profil edytuje się w ustawieniach — nie ma sensu go tu oglądać.
  if (params.id === user.id) redirect("/settings");

  const supabase = createClient();

  const [{ data }, { data: match }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("matches")
      .select("id")
      .or(
        `and(user_a.eq.${user.id},user_b.eq.${params.id}),and(user_a.eq.${params.id},user_b.eq.${user.id})`,
      )
      .maybeSingle(),
  ]);

  if (!data) notFound();

  // Skąd przyszedł — żeby strzałka wracała tam, gdzie był.
  const back =
    searchParams.skad === "swipe"
      ? "/swipe"
      : match
        ? `/matches/${match.id}`
        : "/matches";

  return (
    <ProfileView
      profile={data as Profile}
      backHref={back}
      matchHref={match ? `/matches/${match.id}` : undefined}
    />
  );
}
