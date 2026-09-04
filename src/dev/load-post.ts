import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { findPostFiles } from '../lib/post-files.js';

/**
 * 글 번호로 기존 글을 찾아 편집기에 넘겨줍니다.
 * 저장과 마찬가지로 개발 서버에서만 동작합니다.
 */
export const prerender = false;

const POSTS_DIR = join(process.cwd(), 'src', 'content', 'posts');

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

/** 프론트매터에서 한 줄짜리 값을 꺼냅니다. 이 블로그가 쓰는 형식만 다룹니다. */
function field(frontmatter: string, name: string): string {
  const match = frontmatter.match(new RegExp(`^${name}:\\s*(.*)$`, 'm'));
  if (!match) return '';
  return match[1].trim().replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"');
}

export const GET: APIRoute = async ({ url }) => {
  if (!import.meta.env.DEV) {
    return json({ error: '편집기는 개발 서버에서만 쓸 수 있습니다.' }, 403);
  }

  const id = Number(url.searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return json({ error: '글 번호가 잘못되었습니다.' }, 400);

  for (const file of findPostFiles(POSTS_DIR)) {
    const raw = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) continue;

    const [, frontmatter, body] = match;
    if (Number(field(frontmatter, 'postId')) !== id) continue;

    // 파일이 놓인 폴더가 곧 카테고리입니다.
    const relativePath = relative(POSTS_DIR, file);
    const parts = relativePath.split(sep);
    const category = parts.slice(0, -1).join('/');

    const tagsRaw = field(frontmatter, 'tags');
    const tags = [...tagsRaw.matchAll(/"([^"]*)"/g)].map((m) => m[1]);

    return json({
      postId: id,
      title: field(frontmatter, 'title'),
      description: field(frontmatter, 'description'),
      date: field(frontmatter, 'date'),
      draft: field(frontmatter, 'draft') === 'true',
      tags,
      category,
      body: body.replace(/^\n+/, ''),
      // 저장할 때 이 경로를 되돌려받아, 파일 이름이나 카테고리가 바뀌면
      // 예전 파일을 지웁니다. 그러지 않으면 같은 글이 두 개가 됩니다.
      path: relativePath.split(sep).join('/'),
    });
  }

  return json({ error: `${id}번 글을 찾을 수 없습니다.` }, 404);
};
