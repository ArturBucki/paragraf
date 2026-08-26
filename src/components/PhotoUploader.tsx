"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { savePhotos } from "@/app/settings/actions";
import { Icon } from "@/components/Icon";

const MAX = 6;
const MAX_SIDE = 1280; // większe zdjęcia nic nie wnoszą, a spowalniają apkę

/** Zmniejsza i kompresuje zdjęcie zanim poleci na serwer. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);

  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.85),
  );
}

export function PhotoUploader({
  userId,
  initial,
}: {
  userId: string;
  initial: string[];
}) {
  const [photos, setPhotos] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, MAX - photos.length);
    e.target.value = "";
    if (!files.length) return;

    setBusy(true);
    setError(null);
    const supabase = createClient();
    const added: string[] = [];

    try {
      for (const file of files) {
        if (!file.type.startsWith("image/")) continue;
        const blob = await shrink(file);
        const path = `${userId}/${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("photos")
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("photos").getPublicUrl(path);
        added.push(data.publicUrl);
      }

      const next = [...photos, ...added].slice(0, MAX);
      setPhotos(next);
      await savePhotos(next);
    } catch (err: any) {
      setError(err?.message ?? "Nie udało się wgrać zdjęcia.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(url: string) {
    const next = photos.filter((p) => p !== url);
    setPhotos(next);
    await savePhotos(next);

    // Sprzątamy plik w magazynie, żeby nie zostawiać śmieci.
    const supabase = createClient();
    const marker = "/photos/";
    const at = url.indexOf(marker);
    if (at >= 0) {
      const path = url.slice(at + marker.length);
      supabase.storage.from("photos").remove([path]).catch(() => {});
    }
  }

  async function makeMain(url: string) {
    const next = [url, ...photos.filter((p) => p !== url)];
    setPhotos(next);
    await savePhotos(next);
  }

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="font-mono text-[11px] uppercase tracking-wide text-inksoft">
          Zdjęcia
        </p>
        <span className="text-[11px] text-inksoft">
          {photos.length}/{MAX} · pierwsze jest główne
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {photos.map((url, i) => (
          <div
            key={url}
            className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-line bg-surface"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />

            {i === 0 ? (
              <span className="absolute left-1.5 top-1.5 rounded-full bg-coral px-2 py-0.5 text-[9px] font-extrabold text-[rgb(var(--on-coral))]">
                GŁÓWNE
              </span>
            ) : (
              <button
                onClick={() => makeMain(url)}
                className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white"
              >
                Ustaw główne
              </button>
            )}

            <button
              onClick={() => remove(url)}
              aria-label="Usuń zdjęcie"
              className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {photos.length < MAX && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="grid aspect-[3/4] place-items-center rounded-2xl border border-dashed border-line bg-surface text-inksoft transition active:scale-95 disabled:opacity-50"
          >
            <span className="flex flex-col items-center gap-1">
              <span className="text-2xl leading-none">+</span>
              <span className="text-[10px] font-semibold">
                {busy ? "Wgrywam…" : "Dodaj"}
              </span>
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onPick}
        className="hidden"
      />

      {error && <p className="mt-2 text-xs text-coraldeep">{error}</p>}
      {photos.length === 0 && !error && (
        <p className="mt-2 text-xs text-inksoft">
          Bez zdjęcia pokazujemy rysowany awatar — dodaj choć jedno, żeby ludzie
          wiedzieli, kogo poznają.
        </p>
      )}
    </section>
  );
}
