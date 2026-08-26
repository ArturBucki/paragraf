import { Icon } from "@/components/Icon";

/**
 * Status weryfikacji zdjęcia. Pokazujemy oba stany — brak odznaki
 * mówiłby tyle samo co jej brak z powodu błędu, a to różne rzeczy.
 */
export function VerifiedBadge({
  verified,
  onPhoto = false,
}: {
  verified: boolean;
  /** Wersja na zdjęciu — jaśniejsza, bo tło bywa dowolne. */
  onPhoto?: boolean;
}) {
  if (verified) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
          onPhoto
            ? "bg-[#6FD3A6] text-[#14211C]"
            : "bg-[#6FD3A6]/18 text-berry"
        }`}
      >
        <Icon name="verified" className="h-3.5 w-3.5" />
        Zweryfikowany profil
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        onPhoto
          ? "border border-white/40 bg-black/35 text-white/85"
          : "border border-line text-inksoft"
      }`}
    >
      <Icon name="verified" className="h-3.5 w-3.5 opacity-70" />
      Bez weryfikacji
    </span>
  );
}
