import type { Profile } from "@/lib/types";
import { Avatar, DEFAULT_AVATAR } from "@/components/Avatar";

/**
 * Zdjęcie profilowe, a gdy go nie ma — ilustrowany awatar.
 * Jeden komponent na całą apkę, żeby podmiana była w jednym miejscu.
 */
export function ProfilePhoto({
  profile,
  className = "h-full w-full",
  index = 0,
}: {
  profile: Pick<Profile, "photos" | "avatar" | "name"> | null;
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

  return <Avatar spec={profile?.avatar ?? DEFAULT_AVATAR} className={className} />;
}
