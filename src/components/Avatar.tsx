import type { AvatarSpec } from "@/lib/types";

// Ilustrowany portret (SVG) — tymczasowo zamiast prawdziwych zdjęć.
// Później wystarczy podmienić ten komponent na <img src={photo_url} />.
export function Avatar({
  spec,
  className,
  rounded,
}: {
  spec: AvatarSpec;
  className?: string;
  rounded?: boolean;
}) {
  const { skin: s, hair: h, cloth: c, bg, style } = spec;
  return (
    <svg
      viewBox="0 0 300 380"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={rounded ? { borderRadius: "50%" } : undefined}
    >
      <rect width="300" height="380" fill={bg} />
      <path d="M40 380 Q46 296 118 280 L182 280 Q254 296 260 380 Z" fill={c} />
      {style !== "short" && <ellipse cx="150" cy="206" rx="76" ry="84" fill={h} />}
      <path d="M128 250 h44 v34 q-22 14 -44 0 Z" fill={s} />
      {style === "short" && <ellipse cx="150" cy="170" rx="62" ry="54" fill={h} />}
      <ellipse cx="150" cy="208" rx="58" ry="66" fill={s} />
      {style === "short" && (
        <>
          <circle cx="90" cy="216" r="12" fill={s} />
          <circle cx="210" cy="216" r="12" fill={s} />
        </>
      )}
      {spec.stubble && (
        <path
          d="M100 232 Q150 300 200 232 Q196 268 150 274 Q104 268 100 232 Z"
          fill={h}
          opacity="0.16"
        />
      )}
      <ellipse cx="120" cy="232" rx="11" ry="6" fill="#E8907F" opacity="0.35" />
      <ellipse cx="180" cy="232" rx="11" ry="6" fill="#E8907F" opacity="0.35" />
      <ellipse cx="129" cy="206" rx="5.5" ry="7.5" fill="#3A2B2B" />
      <ellipse cx="171" cy="206" rx="5.5" ry="7.5" fill="#3A2B2B" />
      <circle cx="131" cy="203" r="1.8" fill="#fff" />
      <circle cx="173" cy="203" r="1.8" fill="#fff" />
      <path d="M119 191 Q129 185 140 190" stroke={h} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M160 190 Q171 185 181 191" stroke={h} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M150 214 l-5 16 q5 4 10 0" stroke="rgba(0,0,0,0.16)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M134 244 Q150 260 166 244" stroke="#B5566A" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      {style === "bangs" && (
        <>
          <path d="M96 150 Q150 120 204 150 Q205 176 150 178 Q95 176 96 150 Z" fill={h} />
          <path d="M92 160 Q86 210 96 250 Q100 210 100 176 Z" fill={h} />
          <path d="M208 160 Q214 210 204 250 Q200 210 200 176 Z" fill={h} />
        </>
      )}
      {style === "wavy" && (
        <path d="M100 156 Q150 128 200 156 Q198 172 150 166 Q102 172 100 156 Z" fill={h} />
      )}
    </svg>
  );
}

// Domyślny awatar, gdy profil go nie ma.
export const DEFAULT_AVATAR: AvatarSpec = {
  skin: "#EEC099",
  hair: "#5B4636",
  cloth: "#7A459C",
  bg: "#E9DDF3",
  style: "short",
};
