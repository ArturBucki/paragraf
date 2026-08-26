/**
 * Zastępnik zdjęcia: spokojna, ciemna plama z inicjałem.
 * Barwa wynika z identyfikatora, więc ta sama osoba zawsze wygląda tak samo,
 * a całość zostaje w tonacji apki — bez rysunkowych twarzy.
 */
export function Monogram({
  name,
  seed,
  className = "h-full w-full",
}: {
  name?: string | null;
  seed?: string | null;
  className?: string;
}) {
  const key = seed ?? name ?? "paragraf";
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 360;

  // Zieleń apki jako punkt wyjścia — odchylamy się od niej tylko trochę.
  const hue = 120 + ((h % 120) - 60) * 0.7;
  const top = `hsl(${hue} 20% 26%)`;
  const bottom = `hsl(${hue - 12} 24% 13%)`;
  const letter = (name?.trim()?.[0] ?? "?").toUpperCase();
  const id = `mg${Math.round(hue)}`;

  return (
    <svg viewBox="0 0 100 100" className={className} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${id})`} />
      <circle cx="50" cy="34" r="34" fill="#ffffff" opacity="0.04" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="34"
        fontWeight="700"
        fontFamily="'Bricolage Grotesque', system-ui, sans-serif"
        fill="#ffffff"
        opacity="0.18"
      >
        {letter}
      </text>
    </svg>
  );
}
