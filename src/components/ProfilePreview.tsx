"use client";

import { useState } from "react";
import type { Profile } from "@/lib/types";
import { ProfileCard } from "@/components/ProfileCard";
import { ProfileView } from "@/components/ProfileView";
import { Icon } from "@/components/Icon";

/**
 * Podgląd własnego profilu — dokładnie te same komponenty, których używają
 * inni, tylko bez przycisków do interakcji. Dwie zakładki, bo ludzie widzą
 * Cię w dwóch miejscach: najpierw jako kartę w swipe, potem jako pełny profil.
 */
export function ProfilePreview({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState<"karta" | "profil">("karta");

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col gap-3 px-4 pb-28 pt-4">
      <header className="flex items-center gap-2">
        <a
          href="/settings"
          aria-label="Wróć do ustawień"
          className="grid h-10 w-10 flex-none place-items-center rounded-full bg-surface text-inksoft soft-1 transition active:scale-95"
        >
          <Icon name="back" className="h-5 w-5" />
        </a>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[15px] font-bold leading-tight">
            <Icon name="eye" className="h-4 w-4 text-gold" /> Tak widzą Cię inni
          </p>
          <p className="truncate text-[11px] text-inksoft">
            Podgląd — nikt nie dostaje powiadomienia
          </p>
        </div>
      </header>

      <div className="flex gap-1 rounded-full bg-surface p-1 soft-1">
        {(["karta", "profil"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 text-[13px] font-bold transition ${
              tab === t
                ? "bg-coral text-[rgb(var(--on-coral))]"
                : "text-inksoft"
            }`}
          >
            {t === "karta" ? "Karta w swipe" : "Pełny profil"}
          </button>
        ))}
      </div>

      {tab === "karta" ? (
        <>
          <div className="h-[520px]">
            <ProfileCard profile={profile} />
          </div>
          <p className="px-1 text-center text-[12px] text-inksoft">
            To widzą, zanim zdecydują — pierwsze zdjęcie i pierwsze zdanie robią
            największą różnicę.
          </p>
        </>
      ) : (
        <ProfileView profile={profile} backHref="/settings" embedded self />
      )}
    </div>
  );
}
