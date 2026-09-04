/**
 * 글 파일을 직접 훑어보는 도구.
 *
 * 편집기(개발 서버)와 scripts/new-post.mjs 가 함께 씁니다.
 * astro:content 는 Astro 안에서만 쓸 수 있어서 여기서는 파일을 직접 읽습니다.
 */
import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/** 폴더 아래의 모든 .md / .mdx 파일 경로 */
export function findPostFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return findPostFiles(full);
    return /\.mdx?$/.test(name) ? [full] : [];
  });
}

/**
 * 다음에 쓸 글 번호.
 *
 * 주소가 번호라서 한 번 쓴 번호는 다시 쓰면 안 됩니다.
 * 글을 지웠더라도 그 번호는 건너뛰도록 항상 최대값 + 1 을 씁니다.
 */
export function nextPostId(postsDir) {
  let max = 0;
  for (const file of findPostFiles(postsDir)) {
    const match = readFileSync(file, 'utf8').match(/^postId:\s*(\d+)\s*$/m);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max + 1;
}

/** 이미 있는 카테고리 폴더 목록 */
export function categoryFolders(dir, prefix = '') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) return [];
    const path = prefix ? `${prefix}/${name}` : name;
    return [path, ...categoryFolders(full, path)];
  });
}
