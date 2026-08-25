"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/swipe", label: "Odkrywaj", icon: "🔥" },
  { href: "/matches", label: "Pary", icon: "💬" },
  { href: "/settings", label: "Profil", icon: "👤" },
];

export function BottomNav({ badge = 0 }: { badge?: number }) {
  const path = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {TABS.map((t) => {
          const activeTab = path === t.href || path.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              prefetch
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5"
            >
              <span className={`text-xl ${activeTab ? "" : "opacity-50 grayscale"}`}>
                {t.icon}
              </span>
              <span
                className={`text-[11px] font-bold ${
                  activeTab ? "text-coral" : "text-inksoft"
                }`}
              >
                {t.label}
              </span>
              {t.href === "/matches" && badge > 0 && (
                <span className="absolute right-[22%] top-1 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-[#06281A]">
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
