"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/Icon";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/swipe", label: "Odkrywaj", icon: "cards" },
  { href: "/matches", label: "Pary", icon: "chat" },
  { href: "/settings", label: "Profil", icon: "user" },
];

export function BottomNav({ badge = 0 }: { badge?: number }) {
  const path = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {TABS.map((t) => {
          const active = path === t.href || path.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              prefetch
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 transition ${
                active ? "text-coral" : "text-inksoft"
              }`}
            >
              <Icon name={t.icon} className="h-6 w-6" />
              <span className="text-[11px] font-bold">{t.label}</span>
              {t.href === "/matches" && badge > 0 && (
                <span className="absolute right-[24%] top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-[#06281A]">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
