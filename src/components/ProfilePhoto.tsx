import type { Profile } from "@/lib/types";
import { Monogram } from "@/components/Monogram";

/**
 * Zdjęcie profilowe, a gdy go nie ma — monogram w tonacji apki.
 * Jeden komponent na całą apkę, żeby podmiana była w jednym miejscu.
 */
export function ProfilePhoto({
  profile,
  className = "h-full w-full",
  index = 0,
}: {
  profile: Pick<Profile, "photos" | "name"> & { id?: string } | null;
  className?: string;
  index?: number;
}) {
  const url = profile?.photos?.[index];

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={profile?.name ? `Zdjęcie: ${profile.name}` : "Zdjęcie profilowe"}
        className={`${className} object-cover`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return <Monogram name={profile?.name} seed={profile?.id} className={className} />;
}
