#!/usr/bin/env node
/**
 * 새 글 파일을 만들어 줍니다.
 *
 *   npm run new "JPA N+1 문제 해결하기" --slug jpa-n-plus-one --in backend/spring
 *
 * --in    글을 넣을 카테고리 폴더 (생략하면 미분류)
 * --slug  파일 이름에 쓸 영문 슬러그 (제목이 한글이면 반드시 필요)
 */
import { mkdirSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const POSTS_DIR = join('src', 'content', 'posts');

// ── 인자 파싱 ────────────────────────────────────────────────
const args = process.argv.slice(2);
const flags = {};
const rest = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--in' || args[i] === '--slug') {
    flags[args[i].slice(2)] = args[++i];
  } else {
    rest.push(args[i]);
  }
}

const title = rest.join(' ').trim();

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

if (!title) {
  fail(
    '제목을 입력하세요.\n' +
      '  npm run new "JPA N+1 문제 해결하기" --slug jpa-n-plus-one --in backend/spring',
  );
}

// ── 슬러그 결정 ──────────────────────────────────────────────
// 파일 이름이 곧 주소입니다. 한글 파일명은 주소에서 %EA%B8%80... 처럼
// 퍼센트 인코딩되어 읽을 수 없게 되므로 영문만 허용합니다.
const autoSlug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const slug = flags.slug ?? autoSlug;

if (!slug) {
  fail(
    `제목이 한글이라 파일 이름을 만들 수 없습니다. --slug 로 영문 이름을 정해주세요.\n` +
      `  npm run new "${title}" --slug my-post-name`,
  );
}

if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  fail(`슬러그는 영문 소문자, 숫자, 하이픈만 쓸 수 있습니다: "${slug}"`);
}

// ── 카테고리 폴더 ────────────────────────────────────────────
const category = (flags.in ?? '').replace(/^\/+|\/+$/g, '');

if (category && !/^[a-z0-9][a-z0-9/-]*$/.test(category)) {
  fail(`카테고리 폴더도 영문 소문자, 숫자, 하이픈, 슬래시만 쓸 수 있습니다: "${category}"`);
}

/** 이미 있는 카테고리 폴더를 모아 안내에 씁니다. */
function existingCategories(dir = POSTS_DIR, prefix = '') {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (!statSync(full).isDirectory()) return [];
    const path = prefix ? `${prefix}/${name}` : name;
    return [path, ...existingCategories(full, path)];
  });
}

if (category && !existsSync(join(POSTS_DIR, ...category.split('/')))) {
  const known = existingCategories();
  console.log(`\n새 카테고리를 만듭니다: ${category}`);
  if (known.length) console.log(`이미 있는 카테고리: ${known.join(', ')}`);
  console.log(`화면에 한글로 보이게 하려면 src/config.ts 의 CATEGORY_LABELS 에 추가하세요.`);
}

// ── 파일 만들기 ──────────────────────────────────────────────
// 날짜는 UTC가 아니라 이 컴퓨터의 달력 날짜를 씁니다.
// toISOString() 을 쓰면 한국 시간 새벽에 어제 날짜가 찍힙니다.
const now = new Date();
const today = [
  now.getFullYear(),
  String(now.getMonth() + 1).padStart(2, '0'),
  String(now.getDate()).padStart(2, '0'),
].join('-');

const dir = category ? join(POSTS_DIR, ...category.split('/')) : POSTS_DIR;
const file = join(dir, `${today}-${slug}.md`);

if (existsSync(file)) fail(`이미 있는 파일입니다: ${file}`);

const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: ""
date: ${today}
tags: []
draft: true
---

`;

mkdirSync(dir, { recursive: true });
writeFileSync(file, frontmatter, 'utf8');

console.log(`\n생성됨  ${file}`);
console.log(`주소    /posts/${today}-${slug}/`);
console.log(`카테고리 ${category || '(미분류)'}`);
console.log(`\n다 쓰면 draft: true 를 false 로 바꾸고 커밋하세요.`);
console.log(`  git add . && git commit -m "새 글" && git push\n`);
