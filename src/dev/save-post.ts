import type { APIRoute } from 'astro';
import { mkdir, writeFile, access, unlink } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { slugify, isValidSlug } from '../lib/slug.js';
import { nextPostId } from '../lib/post-files.js';

/**
 * 편집기에서 넘어온 글을 마크다운 파일로 저장합니다.
 *
 * 개발 서버(`npm run dev`)에서만 동작합니다. 배포된 사이트에는 파일을 쓸
 * 서버가 없고, 있어서도 안 됩니다. 누구나 글을 쓸 수 있게 되니까요.
 */
export const prerender = false;

const POSTS_DIR = join(process.cwd(), 'src', 'content', 'posts');

/** 폴더 이름에 쓸 수 있는 형태인지 확인합니다. 경로 탈출을 막습니다. */
const CATEGORY = /^[a-z0-9][a-z0-9/-]*$/;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.DEV) {
    return json({ error: '편집기는 개발 서버에서만 쓸 수 있습니다.' }, 403);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: '잘못된 요청입니다.' }, 400);
  }

  const title = String(payload.title ?? '').trim();
  // 파일 이름은 사람이 알아보기 위한 것이라 제목에서 만듭니다.
  // 주소와는 무관하므로 나중에 바꿔도 링크가 깨지지 않습니다.
  const slug = String(payload.slug ?? '').trim() || slugify(title) || 'post';
  const category = String(payload.category ?? '').trim().replace(/^\/+|\/+$/g, '');
  const description = String(payload.description ?? '').trim();
  const body = String(payload.body ?? '');
  const draft = Boolean(payload.draft);
  const date = String(payload.date ?? '').trim();
  const tags = Array.isArray(payload.tags)
    ? payload.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];
  const overwrite = Boolean(payload.overwrite);
  // 글을 고칠 때 편집기가 원래 파일 위치를 함께 보냅니다.
  const originalPath = String(payload.originalPath ?? '').trim();

  if (!title) return json({ error: '제목을 입력하세요.' }, 400);
  if (!isValidSlug(slug)) {
    return json({ error: `파일 이름을 만들 수 없습니다: "${slug}"` }, 400);
  }
  if (category && !CATEGORY.test(category)) {
    return json({ error: '카테고리 폴더 이름이 올바르지 않습니다.' }, 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: '날짜 형식이 올바르지 않습니다.' }, 400);
  }

  const dir = category ? join(POSTS_DIR, ...category.split('/')) : POSTS_DIR;
  const fileName = `${date}-${slug}.md`;
  const filePath = join(dir, fileName);

  // 글 번호가 곧 주소입니다. 다시 저장할 때 주소가 바뀌면 안 되므로
  // 편집기가 들고 있던 번호를 그대로 쓰고, 없을 때만 새로 매깁니다.
  const givenId = Number(payload.postId);
  const postId = Number.isInteger(givenId) && givenId > 0 ? givenId : nextPostId(POSTS_DIR);

  // 고치는 중인 글은 자기 자신을 덮어쓰는 것이므로 묻지 않습니다.
  const editingSameFile =
    originalPath && join(POSTS_DIR, ...originalPath.split('/')) === filePath;

  // 실수로 다른 글을 덮어쓰지 않도록, 처음 저장할 때는 막고 물어봅니다.
  if (!overwrite && !editingSameFile) {
    try {
      await access(filePath);
      return json({ error: '같은 이름의 글이 이미 있습니다.', exists: true }, 409);
    } catch {
      // 없으면 정상
    }
  }

  const quote = (s: string) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const frontmatter = [
    '---',
    `postId: ${postId}`,
    `title: "${quote(title)}"`,
    `description: "${quote(description)}"`,
    `date: ${date}`,
    `tags: [${tags.map((t) => `"${quote(t)}"`).join(', ')}]`,
    `draft: ${draft}`,
    '---',
    '',
    body.replace(/\r\n/g, '\n').trimEnd(),
    '',
  ].join('\n');

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, frontmatter, 'utf8');

    // 제목이나 카테고리가 바뀌어 파일 위치가 달라졌다면 예전 파일을 지웁니다.
    // 그대로 두면 같은 번호의 글이 두 개가 되어 빌드가 실패합니다.
    if (originalPath && !editingSameFile) {
      await unlink(join(POSTS_DIR, ...originalPath.split('/'))).catch(() => {});
    }
  } catch (error) {
    return json({ error: `파일을 저장하지 못했습니다: ${(error as Error).message}` }, 500);
  }

  return json({
    ok: true,
    // posts 폴더 기준 슬래시 경로. 편집기가 그대로 다시 보내 예전 파일을 찾습니다.
    path: relative(POSTS_DIR, filePath).split(sep).join('/'),
    url: `/posts/${postId}/`,
    postId,
    draft,
  });
};
