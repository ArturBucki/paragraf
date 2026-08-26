import { Icon, type IconName } from "@/components/Icon";

/**
 * Sekcja profilu — zwinięta, dopóki nie jest potrzebna.
 * Licznik „2/4" mówi, ile zostało, bez wchodzenia do środka.
 */
export function Section({
  icon,
  title,
  hint,
  done,
  total,
  open,
  children,
}: {
  icon: IconName;
  title: string;
  hint: string;
  done: number;
  total: number;
  open?: boolean;
  children: React.ReactNode;
}) {
  const full = done === total;

  return (
    <details
      open={open}
      className="group overflow-hidden rounded-2xl border border-line bg-surface"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span
          className={`grid h-9 w-9 flex-none place-items-center rounded-xl ${
            full ? "bg-berry/15 text-berry" : "bg-bg text-coraldeep"
          }`}
        >
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold leading-tight">{title}</span>
          <span className="block truncate text-[11px] text-inksoft">{hint}</span>
        </span>
        <span
          className={`flex-none rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
            full ? "bg-berry/20 text-berry" : "bg-bg text-gold"
          }`}
        >
          {done}/{total}
        </span>
        <Icon
          name="back"
          className="h-4 w-4 flex-none -rotate-90 text-inksoft transition-transform duration-200 group-open:rotate-90"
        />
      </summary>
      <div className="flex flex-col gap-5 border-t border-line p-4">{children}</div>
    </details>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-wide text-inksoft">
        {label}
      </span>
      {children}
    </label>
  );
}

/** To samo co Field, ale dla pigułek — te nie są polem <label>. */
export function Pick({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-wide text-inksoft">
        {label}
      </span>
      {hint && <span className="-mt-1 text-xs text-inksoft">{hint}</span>}
      {children}
    </div>
  );
}
