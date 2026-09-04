import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

/**
 * 글의 주소 조각. 프론트매터의 postId(글 번호)를 씁니다.
 *
 * 파일 이름이나 제목이 아니라 번호를 쓰는 이유:
 * - 한글 제목을 그대로 쓰면 주소가 %EC%BB%A4... 로 인코딩되어 읽을 수 없습니다
 * - 로마자로 옮기면 읽기도 어렵고 검색엔진이 원래 낱말로 인식하지도 못합니다
 * - 번호로 두면 제목을 고치거나 카테고리를 옮겨도 주소가 그대로입니다
 *
 * 대신 파일 이름은 사람이 알아보게 자유롭게 둘 수 있습니다.
 */
export function slugOf(post: Post): string {
  return String(post.data.postId);
}

export function urlOf(post: Post): string {
  return `/posts/${slugOf(post)}/`;
}

/**
 * 글이 속한 카테고리 경로. 파일이 놓인 폴더가 곧 카테고리입니다.
 *
 * 'backend/spring/2026-08-24-jpa' → 'backend/spring'
 * 폴더 없이 최상위에 있으면 빈 문자열(= 미분류)입니다.
 */
export function categoryOf(post: Post): string {
  return post.id.split('/').slice(0, -1).join('/');
}

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

  assertUniqueSlugs(posts);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/**
 * 글 번호가 겹치면 두 글이 같은 주소를 갖게 되어 하나가 조용히 사라집니다.
 * 그런 상태로 배포되지 않도록 빌드를 실패시킵니다.
 */
function assertUniqueSlugs(posts: Post[]): void {
  const seen = new Map<string, string>();
  for (const post of posts) {
    const slug = slugOf(post);
    const existing = seen.get(slug);
    if (existing) {
      throw new Error(
        `글 파일 이름이 중복됩니다: "${slug}"\n` +
          `  - ${existing}\n  - ${post.id}\n` +
          `번호가 곧 주소이므로 겹치면 안 됩니다. 한쪽 번호를 바꾸세요.`,
      );
    }
    seen.set(slug, post.id);
  }
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

/**
 * 마크다운 본문에서 검색용 평문을 뽑습니다.
 *
 * 코드 블록은 통째로 버립니다. 코드까지 검색되면 `public`, `return` 같은
 * 흔한 키워드에 대부분의 글이 걸려서 검색이 쓸모없어집니다.
 */
export function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')      // 코드 블록
    .replace(/`[^`]*`/g, ' ')             // 인라인 코드
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // 이미지
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // 링크는 글자만 남김
    .replace(/^#{1,6}\s+/gm, '')          // 제목 기호
    .replace(/^>\s?/gm, '')               // 인용
    .replace(/[*_~]/g, '')                // 강조 기호
    .replace(/^\s*[-*+]\s+/gm, '')        // 목록 기호
    .replace(/\|/g, ' ')                  // 표 구분자
    .replace(/<[^>]+>/g, ' ')             // 인라인 HTML
    .replace(/\s+/g, ' ')
    .trim();
}

/** 카드에 보일 발췌문. description이 있으면 그걸 쓰고, 없으면 본문 앞부분을 자릅니다. */
export function excerptOf(post: Post, limit = 140): string {
  if (post.data.description) return post.data.description;
  const text = toPlainText(post.body ?? '');
  return text.length > limit ? text.slice(0, limit).trimEnd() + '…' : text;
}

/** 목록을 쪽 단위로 자릅니다. 결과는 1쪽부터 순서대로 담깁니다. */
export function paginate<T>(items: T[], perPage: number): T[][] {
  if (items.length === 0) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push(items.slice(i, i + perPage));
  }
  return pages;
}
