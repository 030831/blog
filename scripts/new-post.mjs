#!/usr/bin/env node
/**
 * 새 글 파일을 만들어 줍니다.
 *   npm run new "JPA N+1 문제 해결하기"
 * → src/content/posts/2026-09-03-jpa-n-1-문제-해결하기.md
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('제목을 입력하세요.  예: npm run new "JPA N+1 문제 해결하기"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, '-')   // 한글은 그대로 두고 기호만 하이픈으로
  .replace(/^-+|-+$/g, '');

const today = new Date().toISOString().slice(0, 10);
const dir = join('src', 'content', 'posts');
const file = join(dir, `${today}-${slug}.md`);

if (existsSync(file)) {
  console.error(`이미 있는 파일입니다: ${file}`);
  process.exit(1);
}

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
console.log(`생성됨: ${file}`);
console.log('다 쓰면 draft: false 로 바꾸고 커밋하세요.');
