const TOTAL_AVATARS = 255;

export const AVATAR_COUNT = TOTAL_AVATARS;

export function getAvatarPath(index: number): string {
  const num = String(index + 1).padStart(2, '0');
  return `/avatars/images/${num}.png`;
}

export const NETFLIX_AVATARS: string[] = Array.from(
  { length: TOTAL_AVATARS },
  (_, i) => getAvatarPath(i)
);
