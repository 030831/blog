import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/** 발행된 글을 최신순으로. draft 글과 미래 날짜 글은 프로덕션 빌드에서 제외됩니다. */
export async function getPublishedPosts(): Promise<Post[]> {
  // 프론트매터의 `date: 2026-09-03` 은 UTC 자정으로 해석됩니다.
  // 그래서 그냥 new Date() 와 비교하면 한국 시간 기준 오늘 쓴 글이
  // "미래 글"로 잡혀 빌드에서 빠집니다. 시각이 아니라 날짜 단위로 비교합니다.
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

  const posts = await getCollection('posts', ({ data }) => {
    if (import.meta.env.DEV) return true;
    return !data.draft && data.date.getTime() <= today;
  });
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** 태그별 글 개수. 개수 많은 순 → 이름순. */
export async function getTagCounts(): Promise<{ tag: string; count: number }[]> {
  const posts = await getPublishedPosts();
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'ko'));
}

/** 한글 기준 대략적인 읽는 시간(분). 코드 블록은 제외하고 분당 500자로 계산합니다. */
export function readingTime(body: string): number {
  const chars = body.replace(/```[\s\S]*?```/g, '').length;
  return Math.max(1, Math.round(chars / 500));
}
