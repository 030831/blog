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
 * 다음에 쓸 글 번호. 남아 있는 글들의 최대값 + 1 입니다.
 *
 * 가장 최근 글을 지우면 그 번호는 다시 쓰입니다. 이미 공유한 링크가 있는 글을
 * 지웠다면 그 주소를 다른 글이 물려받게 되니, 그럴 때는 새 글의 postId 를
 * 손으로 올려주세요. 개인 블로그 규모에서 거의 생기지 않는 상황이라
 * 번호를 따로 기록해두는 장치는 두지 않았습니다.
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
