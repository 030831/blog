import type { APIRoute } from 'astro';
import { readFile, writeFile, unlink, mkdir, rename, rmdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, sep, dirname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { findPostFiles, categoryFolders } from '../lib/post-files.js';
import { slugify } from '../lib/slug.js';

/**
 * 글 삭제, 카테고리 관리, 배포를 담당합니다.
 * 저장·불러오기와 마찬가지로 개발 서버에서만 동작합니다.
 */
export const prerender = false;

const run = promisify(execFile);
const ROOT = process.cwd();
const POSTS_DIR = join(ROOT, 'src', 'content', 'posts');
const CONFIG_PATH = join(ROOT, 'src', 'config.ts');

const CATEGORY = /^[a-z0-9][a-z0-9/-]*$/;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

/** posts 폴더 밖으로 나가는 경로를 막습니다. */
function insidePosts(path: string): boolean {
  const rel = relative(POSTS_DIR, path);
  return rel !== '' && !rel.startsWith('..') && !join(POSTS_DIR, rel).includes('..');
}

/** 글 번호로 파일을 찾습니다. */
async function findByPostId(id: number): Promise<string | null> {
  for (const file of findPostFiles(POSTS_DIR)) {
    const raw = await readFile(file, 'utf8');
    const match = raw.match(/^postId:\s*(\d+)\s*$/m);
    if (match && Number(match[1]) === id) return file;
  }
  return null;
}

/** 빈 폴더를 위쪽으로 거슬러 올라가며 정리합니다. */
async function removeEmptyFolders(dir: string) {
  let current = dir;
  while (insidePosts(current)) {
    const entries = await readdir(current).catch(() => null);
    if (!entries || entries.length > 0) return;
    await rmdir(current).catch(() => {});
    current = dirname(current);
  }
}

/**
 * 보이는 이름에서 폴더 이름을 만듭니다.
 *
 * 폴더 이름은 저장소에서만 보이는 값이라 글쓴이가 정할 이유가 없습니다.
 * 한글 이름은 로마자로 옮기고, 이미 있으면 뒤에 숫자를 붙입니다.
 */
function folderNameFor(name: string, parent: string): string {
  const base = slugify(name) || 'category';
  const prefix = parent ? `${parent}/` : '';

  let candidate = base;
  let n = 2;
  while (existsSync(join(POSTS_DIR, ...(prefix + candidate).split('/')))) {
    candidate = `${base}-${n++}`;
  }
  return prefix + candidate;
}

/** config.ts 의 CATEGORY_LABELS 를 통째로 다시 씁니다. */
async function writeLabels(labels: Record<string, string>) {
  const source = await readFile(CONFIG_PATH, 'utf8');
  const body = Object.entries(labels)
    .map(([path, label]) => {
      const key = /^[a-zA-Z_$][\w$]*$/.test(path) ? path : `'${path}'`;
      return `  ${key}: '${label.replace(/'/g, "\\'")}',`;
    })
    .join('\n');

  const next = source.replace(
    /export const CATEGORY_LABELS: Record<string, string> = \{[\s\S]*?\n\};/,
    `export const CATEGORY_LABELS: Record<string, string> = {\n${body}\n};`,
  );

  if (next === source) throw new Error('config.ts 에서 CATEGORY_LABELS 를 찾지 못했습니다.');
  await writeFile(CONFIG_PATH, next, 'utf8');
}

/** config.ts 에서 현재 라벨을 읽습니다. */
async function readLabels(): Promise<Record<string, string>> {
  const source = await readFile(CONFIG_PATH, 'utf8');
  const block = source.match(/export const CATEGORY_LABELS: Record<string, string> = \{([\s\S]*?)\n\};/);
  if (!block) return {};

  const labels: Record<string, string> = {};
  for (const line of block[1].split('\n')) {
    const match = line.match(/^\s*'?([^':]+)'?\s*:\s*'(.*)',?\s*$/);
    if (match) labels[match[1]] = match[2].replace(/\\'/g, "'");
  }
  return labels;
}

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.DEV) {
    return json({ error: '개발 서버에서만 쓸 수 있습니다.' }, 403);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json({ error: '잘못된 요청입니다.' }, 400);
  }

  const action = String(payload.action ?? '');

  try {
    switch (action) {
      // ── 글 삭제 ──
      case 'delete-post': {
        const id = Number(payload.postId);
        if (!Number.isInteger(id) || id <= 0) return json({ error: '글 번호가 잘못되었습니다.' }, 400);

        const file = await findByPostId(id);
        if (!file) return json({ error: `${id}번 글을 찾을 수 없습니다.` }, 404);

        await unlink(file);
        await removeEmptyFolders(dirname(file));
        return json({ ok: true, path: relative(POSTS_DIR, file).split(sep).join('/') });
      }

      // ── 카테고리 목록 ──
      case 'list-categories': {
        const labels = await readLabels();
        const folders = categoryFolders(POSTS_DIR).sort();
        const counts: Record<string, number> = {};
        for (const file of findPostFiles(POSTS_DIR)) {
          const folder = relative(POSTS_DIR, dirname(file)).split(sep).join('/');
          if (folder) counts[folder] = (counts[folder] ?? 0) + 1;
        }
        return json({
          ok: true,
          categories: folders.map((path) => ({
            path,
            label: labels[path] ?? path.split('/').pop(),
            count: counts[path] ?? 0,
          })),
        });
      }

      // ── 카테고리 추가 ──
      case 'add-category': {
        const name = String(payload.name ?? '').trim();
        const parent = String(payload.parent ?? '').trim().replace(/^\/+|\/+$/g, '');

        if (!name) return json({ error: '카테고리 이름을 입력하세요.' }, 400);
        if (parent && !CATEGORY.test(parent)) return json({ error: '부모 카테고리가 잘못되었습니다.' }, 400);
        if (parent && !existsSync(join(POSTS_DIR, ...parent.split('/')))) {
          return json({ error: '부모 카테고리를 찾을 수 없습니다.' }, 404);
        }

        const labels = await readLabels();
        // 같은 부모 아래 같은 이름이 있으면 막습니다. 폴더가 달라도 화면에서는 구분되지 않습니다.
        for (const [existingPath, existingLabel] of Object.entries(labels)) {
          const existingParent = existingPath.split('/').slice(0, -1).join('/');
          if (existingParent === parent && existingLabel === name) {
            return json({ error: `'${name}' 은(는) 이미 있습니다.` }, 409);
          }
        }

        const path = folderNameFor(name, parent);
        await mkdir(join(POSTS_DIR, ...path.split('/')), { recursive: true });
        // 빈 폴더는 Git이 추적하지 않아 다른 컴퓨터에서 사라집니다. 표시용 파일을 둡니다.
        await writeFile(join(POSTS_DIR, ...path.split('/'), '.gitkeep'), '', 'utf8');

        labels[path] = name;
        await writeLabels(labels);
        return json({ ok: true, path, name });
      }

      // ── 카테고리 이름 바꾸기 (표시 이름 / 폴더 이름) ──
      case 'rename-category': {
        const path = String(payload.path ?? '').trim();
        const name = String(payload.name ?? '').trim();
        // 부모를 바꾸지 않을 때는 parent 를 보내지 않습니다. 빈 문자열은 '최상위로'라는 뜻입니다.
        const moveParent = payload.parent !== undefined;
        const parent = String(payload.parent ?? '').trim().replace(/^\/+|\/+$/g, '');

        if (!CATEGORY.test(path)) return json({ error: '카테고리 경로가 잘못되었습니다.' }, 400);
        if (!name) return json({ error: '카테고리 이름을 입력하세요.' }, 400);

        const dir = join(POSTS_DIR, ...path.split('/'));
        if (!existsSync(dir)) return json({ error: '없는 카테고리입니다.' }, 404);

        const labels = await readLabels();
        let finalPath = path;

        const currentParent = path.split('/').slice(0, -1).join('/');

        if (moveParent && parent !== currentParent) {
          if (parent && !CATEGORY.test(parent)) return json({ error: '부모 카테고리가 잘못되었습니다.' }, 400);

          // 자기 자신이나 자기 하위로는 옮길 수 없습니다. 폴더가 자기 안으로 들어갑니다.
          if (parent === path || parent.startsWith(path + '/')) {
            return json({ error: '자기 자신이나 하위 카테고리로는 옮길 수 없습니다.' }, 400);
          }
          if (parent && !existsSync(join(POSTS_DIR, ...parent.split('/')))) {
            return json({ error: '부모 카테고리를 찾을 수 없습니다.' }, 404);
          }

          const folder = path.split('/').pop()!;
          const newPath = parent ? `${parent}/${folder}` : folder;
          const target = join(POSTS_DIR, ...newPath.split('/'));
          if (existsSync(target)) return json({ error: '그곳에 같은 폴더가 이미 있습니다.' }, 409);

          // 폴더를 옮기면 그 아래 글이 통째로 따라갑니다.
          // 주소는 글 번호라서 옮겨도 링크가 깨지지 않습니다.
          await mkdir(dirname(target), { recursive: true });
          await rename(dir, target);
          await removeEmptyFolders(dirname(dir));

          // 하위 카테고리 라벨도 함께 옮깁니다.
          for (const key of Object.keys(labels)) {
            if (key === path || key.startsWith(path + '/')) {
              labels[newPath + key.slice(path.length)] = labels[key];
              delete labels[key];
            }
          }
          finalPath = newPath;
        }

        // 보이는 이름만 바꿀 때는 폴더를 그대로 둡니다.
        // 폴더까지 따라 바꾸면 저장소 이력이 불필요하게 지저분해집니다.
        labels[finalPath] = name;
        await writeLabels(labels);
        return json({ ok: true, path: finalPath, name });
      }

      // ── 카테고리 삭제 ──
      case 'delete-category': {
        const path = String(payload.path ?? '').trim();
        if (!CATEGORY.test(path)) return json({ error: '카테고리 경로가 잘못되었습니다.' }, 400);

        const dir = join(POSTS_DIR, ...path.split('/'));
        if (!existsSync(dir)) return json({ error: '없는 카테고리입니다.' }, 404);

        // 글이 남아 있으면 지우지 않습니다. 글까지 사라지면 되돌릴 수 없습니다.
        const remaining = findPostFiles(dir);
        if (remaining.length > 0) {
          return json(
            { error: `글 ${remaining.length}개가 남아 있습니다. 먼저 옮기거나 지워주세요.`, count: remaining.length },
            409,
          );
        }

        await unlink(join(dir, '.gitkeep')).catch(() => {});
        await rmdir(dir).catch(() => {});
        await removeEmptyFolders(dirname(dir));

        const labels = await readLabels();
        for (const key of Object.keys(labels)) {
          if (key === path || key.startsWith(path + '/')) delete labels[key];
        }
        await writeLabels(labels);
        return json({ ok: true });
      }

      // ── 배포 (git add / commit / push) ──
      case 'deploy': {
        const message = String(payload.message ?? '').trim() || '글 업데이트';

        const git = (args: string[]) => run('git', args, { cwd: ROOT, timeout: 120000 });

        /*
         * 글과 카테고리 설정만 담습니다.
         * `git add -A` 로 전부 담으면 손보던 코드까지 딸려 올라갑니다.
         * 글 하나 올리려다 미완성 코드가 배포되는 사고를 막기 위한 제한입니다.
         */
        await git(['add', '--', 'src/content/posts', 'src/config.ts']);

        // 담긴 게 없으면 커밋할 것도 없습니다. 오류가 아니라 정상 상황입니다.
        const status = await git(['diff', '--cached', '--name-only']);
        if (!status.stdout.trim()) {
          const ahead = await git(['rev-list', '--count', '@{u}..HEAD']).catch(() => ({ stdout: '0' }));
          if (Number(ahead.stdout.trim()) === 0) {
            return json({ ok: true, skipped: true, message: '올릴 변경사항이 없습니다.' });
          }
        } else {
          await git(['commit', '-m', message]);
        }

        const push = await git(['push']);
        return json({ ok: true, output: (push.stdout + push.stderr).trim().split('\n').slice(-3).join('\n') });
      }

      default:
        return json({ error: `알 수 없는 요청입니다: ${action}` }, 400);
    }
  } catch (error) {
    const err = error as Error & { stderr?: string };
    return json({ error: (err.stderr || err.message || '알 수 없는 오류').trim() }, 500);
  }
};
