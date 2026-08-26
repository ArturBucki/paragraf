import { redirect } from "next/navigation";
import { createClient, currentUser } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { ProfilePreview } from "@/components/ProfilePreview";

export const dynamic = "force-dynamic";

export default async function PodgladProfilu() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const { data } = await createClient()
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) redirect("/onboarding");

  return <ProfilePreview profile={data as Profile} />;
}
