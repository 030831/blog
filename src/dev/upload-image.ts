import type { APIRoute } from 'astro';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { slugify } from '../lib/slug.js';

/**
 * 편집기에서 올린 이미지를 public/images/ 에 저장합니다.
 * 저장·불러오기와 마찬가지로 개발 서버에서만 동작합니다.
 */
export const prerender = false;

const IMAGES_DIR = join(process.cwd(), 'public', 'images');

/** 사진은 화면 폭보다 클 이유가 없습니다. 본문 폭(46rem)의 두 배 남짓이면 충분합니다. */
const MAX_WIDTH = 1600;

/** 원본을 그대로 둬야 하는 형식. 벡터이거나 움직이는 그림이라 변환하면 망가집니다. */
const PASS_THROUGH = new Set(['image/svg+xml', 'image/gif']);

const EXTENSION: Record<string, string> = {
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export const POST: APIRoute = async ({ request }) => {
  if (!import.meta.env.DEV) {
    return json({ error: '이미지 업로드는 개발 서버에서만 됩니다.' }, 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: '잘못된 요청입니다.' }, 400);
  }

  const file = form.get('file');
  if (!(file instanceof File)) return json({ error: '파일이 없습니다.' }, 400);
  if (!file.type.startsWith('image/')) return json({ error: '이미지 파일만 올릴 수 있습니다.' }, 400);

  const input = Buffer.from(await file.arrayBuffer());

  // 확장자를 뺀 원래 이름을 로마자로 옮겨 파일 이름에 씁니다.
  const baseName = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
  const today = new Date();
  const datePart = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('');

  let output = input;
  let extension = EXTENSION[file.type] ?? 'webp';
  let width: number | undefined;
  let height: number | undefined;

  if (!PASS_THROUGH.has(file.type)) {
    try {
      /*
       * 폰이나 카메라 사진은 4000px이 넘습니다. 그대로 올리면 글 하나에 몇 MB가
       * 실려 페이지가 느려지고 저장소도 무거워집니다.
       * 화면에 필요한 크기로 줄이고 webp로 바꿔 용량을 크게 낮춥니다.
       */
      const image = sharp(input).rotate(); // 사진의 회전 정보를 실제 픽셀에 반영
      const meta = await image.metadata();

      const resized = (meta.width ?? 0) > MAX_WIDTH ? image.resize({ width: MAX_WIDTH }) : image;
      output = await resized.webp({ quality: 82 }).toBuffer();

      const result = await sharp(output).metadata();
      width = result.width;
      height = result.height;
    } catch (error) {
      return json({ error: `이미지를 처리하지 못했습니다: ${(error as Error).message}` }, 500);
    }
  }

  // 같은 이름이 있으면 뒤에 숫자를 붙입니다.
  await mkdir(IMAGES_DIR, { recursive: true });
  let fileName = `${datePart}-${baseName}.${extension}`;
  let n = 2;
  while (existsSync(join(IMAGES_DIR, fileName))) {
    fileName = `${datePart}-${baseName}-${n++}.${extension}`;
  }

  await writeFile(join(IMAGES_DIR, fileName), output);

  return json({
    ok: true,
    url: `/images/${fileName}`,
    width,
    height,
    originalKB: Math.round(input.length / 1024),
    savedKB: Math.round(output.length / 1024),
  });
};
