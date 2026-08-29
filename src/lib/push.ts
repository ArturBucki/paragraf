"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Powiadomienia push — cała obsługa po stronie przeglądarki w jednym miejscu.
 *
 * Klucz publiczny VAPID jest jawny (musi być w przeglądarce). Prywatny siedzi
 * wyłącznie w funkcji brzegowej Supabase, więc nikt poza serwerem nie wyśle
 * powiadomienia w naszym imieniu.
 */
const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export function pushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function pushState(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

function toUint8(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Pyta o zgodę i zapisuje subskrypcję. Zwraca true, gdy się udało. */
export async function enablePush(userId: string): Promise<boolean> {
  if (!pushSupported() || !VAPID_PUBLIC) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toUint8(VAPID_PUBLIC),
    }));

  const json = sub.toJSON() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false;

  const { error } = await createClient().from("push_subs").upsert({
    endpoint: json.endpoint,
    user_id: userId,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  });

  return !error;
}

/** Wyłącza powiadomienia na tym urządzeniu. */
export async function disablePush() {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await createClient().from("push_subs").delete().eq("endpoint", sub.endpoint);
  await sub.unsubscribe();
}

/**
 * Prosi serwer o wysłanie powiadomienia drugiej osobie z pary.
 * Treść buduje serwer — stąd tylko rodzaj zdarzenia.
 */
export async function notifyPeer(
  matchId: string,
  kind: "invite" | "ready" | "message",
  game?: string,
) {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;

    await supabase.functions.invoke("notify", {
      body: { matchId, kind, game },
    });
  } catch {
    // Powiadomienie to dodatek — jak nie doleci, apka działa dalej.
  }
}
