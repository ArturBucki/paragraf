"use client";

import { INTEREST_GROUPS } from "@/lib/types";

/* Wspólny wygląd pigułki — jedno miejsce, żeby wszystko klikało się tak samo. */
const CHIP =
  "rounded-full border px-3.5 py-2 text-sm font-semibold transition duration-150 active:scale-95";

function chipStyle(on: boolean, accent: string): React.CSSProperties {
  return on
    ? { borderColor: accent, background: `${accent}24`, color: accent }
    : {};
}

/** Wybór jednej odpowiedzi. Klik zmienia zdanie — bez list rozwijanych. */
export function ChipOne({
  options,
  value,
  onChange,
  accent = "#F5A524",
}: {
  options: readonly string[];
  value: string | null;
  onChange: (v: string | null) => void;
  accent?: string;
}) {
  const sel = value;

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = sel === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(on ? null : o)}
            className={`${CHIP} ${on ? "" : "border-line bg-surface text-inksoft"}`}
            style={chipStyle(on, accent)}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

/** Wybór kilku odpowiedzi z limitem — licznik mówi, ile jeszcze można. */
export function ChipMany({
  options,
  value,
  onChange,
  max,
  accent = "#157A59",
}: {
  options: readonly string[];
  value: string[];
  onChange: (v: string[]) => void;
  max: number;
  accent?: string;
}) {
  const sel = value;
  const full = sel.length >= max;

  function toggle(o: string) {
    onChange(
      sel.includes(o)
        ? sel.filter((x) => x !== o)
        : sel.length >= max
          ? sel
          : [...sel, o],
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = sel.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className={`${CHIP} ${
                on
                  ? ""
                  : `border-line bg-surface text-inksoft ${full ? "opacity-40" : ""}`
              }`}
              style={chipStyle(on, accent)}
            >
              {o}
            </button>
          );
        })}
      </div>
      <p className="mt-2 font-mono text-[10px] text-inksoft">
        {sel.length}/{max} wybrane
      </p>
    </div>
  );
}

/**
 * Zainteresowania na półkach. Każda grupa ma swój kolor — wybieranie
 * przypomina układanie playlisty, nie wypełnianie formularza.
 */
export function InterestPicker({
  value,
  onChange,
  max,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  max: number;
}) {
  const sel = value;
  const full = sel.length >= max;

  function toggle(o: string) {
    onChange(
      sel.includes(o)
        ? sel.filter((x) => x !== o)
        : sel.length >= max
          ? sel
          : [...sel, o],
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-inksoft">
          {full ? "Komplet — odklikaj coś, żeby zmienić." : "Wybierz do ośmiu."}
        </p>
        <span
          className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-bold ${
            full ? "bg-coral text-[rgb(var(--on-coral))]" : "bg-bg text-gold"
          }`}
        >
          {sel.length}/{max}
        </span>
      </div>

      {INTEREST_GROUPS.map((g) => (
        <div key={g.name}>
          <p
            className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em]"
            style={{ color: g.accent }}
          >
            {g.name}
          </p>
          <div className="flex flex-wrap gap-2">
            {g.items.map((o) => {
              const on = sel.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggle(o)}
                  className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold transition duration-150 active:scale-95 ${
                    on
                      ? ""
                      : `border-line bg-surface text-inksoft ${full ? "opacity-40" : ""}`
                  }`}
                  style={chipStyle(on, g.accent)}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </div>
      ))}

    </div>
  );
}
