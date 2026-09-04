#!/usr/bin/env node
/**
 * 새 글 파일을 만들어 줍니다.
 *
 *   npm run new "JPA N+1 문제 해결하기" --in backend/spring
 *
 * --in    글을 넣을 카테고리 폴더 (생략하면 미분류)
 * --name  파일 이름을 직접 정하고 싶을 때. 생략하면 제목에서 자동으로 만듭니다
 *
 * 주소는 파일 이름과 무관하게 글 번호(postId)로 정해집니다.
 * 그래서 파일 이름이나 제목을 나중에 바꿔도 링크가 깨지지 않습니다.
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { slugify, isValidSlug } from '../src/lib/slug.js';
import { nextPostId, categoryFolders } from '../src/lib/post-files.js';

const POSTS_DIR = join('src', 'content', 'posts');

// ── 인자 파싱 ────────────────────────────────────────────────
const args = process.argv.slice(2);
const flags = {};
const rest = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--in' || args[i] === '--name') {
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
  fail('제목을 입력하세요.\n  npm run new "JPA N+1 문제 해결하기" --in backend/spring');
}

// ── 파일 이름 ────────────────────────────────────────────────
// 파일 이름은 사람이 알아보기 위한 것입니다. 주소가 아니므로 자유롭게 바꿔도 됩니다.
const name = flags.name ?? slugify(title);

if (!name || !isValidSlug(name)) {
  fail(`파일 이름을 만들 수 없습니다. --name 으로 직접 정해주세요.`);
}

// ── 카테고리 폴더 ────────────────────────────────────────────
const category = (flags.in ?? '').replace(/^\/+|\/+$/g, '');

if (category && !/^[a-z0-9][a-z0-9/-]*$/.test(category)) {
  fail(`카테고리 폴더는 영문 소문자, 숫자, 하이픈, 슬래시만 쓸 수 있습니다: "${category}"`);
}

if (category && !existsSync(join(POSTS_DIR, ...category.split('/')))) {
  const known = categoryFolders(POSTS_DIR);
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
const file = join(dir, `${today}-${name}.md`);

if (existsSync(file)) fail(`이미 있는 파일입니다: ${file}`);

const postId = nextPostId(POSTS_DIR);

const frontmatter = `---
postId: ${postId}
title: "${title.replace(/"/g, '\\"')}"
description: ""
date: ${today}
tags: []
draft: true
---

`;

mkdirSync(dir, { recursive: true });
writeFileSync(file, frontmatter, 'utf8');

console.log(`\n생성됨   ${file}`);
console.log(`주소     /posts/${postId}/`);
console.log(`카테고리 ${category || '(미분류)'}`);
console.log(`\n다 쓰면 draft: true 를 false 로 바꾸고 커밋하세요.`);
console.log(`  git add . && git commit -m "새 글" && git push\n`);
