# 개인 블로그

Astro 기반 정적 블로그. 마크다운 파일을 쓰고 push 하면 사이트가 갱신됩니다.

## 로컬에서 실행

```bash
npm install
npm run dev
```

http://localhost:4321 에서 열립니다. 파일을 저장하면 브라우저가 바로 반영합니다.

| 명령어 | 하는 일 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | `dist/` 에 정적 사이트 생성 |
| `npm run preview` | 빌드 결과를 실제 배포와 같은 형태로 확인 |
| `npm run new "제목"` | 프론트매터가 채워진 새 글 파일 생성 |

## 글 쓰기

`src/content/posts/` 에 `.md` 파일을 만듭니다. 파일명이 곧 URL입니다.

```markdown
---
title: "글 제목"
description: "목록에 보이는 한 줄 요약"
date: 2026-09-03
tags: ["Spring", "JPA"]
draft: false
---

본문...
```

`draft: true` 인 글은 개발 서버에서는 보이지만 배포된 사이트에는 나가지 않습니다.
쓰다 만 글을 그대로 커밋해도 안전합니다.

코드 블록 문법(파일명 표시, 줄 강조, 접기)은 사이트의 **"이 블로그에 글 쓰는 법"** 글에 정리돼 있습니다.

## 처음 한 번만 하는 설정

1. `src/config.ts` 에서 사이트 제목, 소개, GitHub 주소를 본인 것으로 바꿉니다.
2. 같은 파일의 `url` 을 배포된 실제 주소로 바꿉니다. RSS·사이트맵·카톡 링크 미리보기가 이 값을 씁니다. **이걸 안 바꾸면 공유 링크가 깨집니다.**
3. `src/pages/about.astro` 의 소개 내용을 고칩니다.

## 배포

### GitHub에 올리기

```bash
git init
git add .
git commit -m "블로그 초기 설정"
git branch -M main
git remote add origin https://github.com/<사용자명>/<저장소명>.git
git push -u origin main
```

### Vercel (가장 간단)

1. https://vercel.com 에 GitHub 계정으로 로그인
2. Add New → Project → 방금 만든 저장소 선택
3. 프레임워크가 **Astro** 로 자동 인식되므로 그대로 Deploy

이후로는 `git push` 할 때마다 자동 배포됩니다.

### Cloudflare Pages (대안)

Workers & Pages → Create → Pages → 저장소 연결.
빌드 명령 `npm run build`, 출력 디렉터리 `dist`.

### 도메인 연결

두 서비스 모두 프로젝트 설정의 Domains 메뉴에서 도메인을 넣고, 안내하는 DNS 레코드를 도메인 등록처에 추가하면 됩니다. HTTPS는 자동입니다.
도메인을 붙인 뒤 `src/config.ts` 의 `url` 을 반드시 새 주소로 바꾸세요.

## 나중에 백엔드를 붙이고 싶다면

이 블로그는 정적 사이트라 서버가 없습니다. 조회수, 댓글, 검색 같은 동적 기능이 필요해지면
Spring Boot로 API 서버를 따로 만들고 프론트에서 `fetch` 로 호출하는 구조가 자연스럽습니다.

- 조회수: `POST /api/posts/{slug}/views` 로 증가, `GET` 으로 조회
- 댓글: 직접 만들거나 [giscus](https://giscus.app) (GitHub Discussions 기반, 서버 불필요)

정적 사이트를 유지한 채 API만 얹는 구조라, 블로그 본문의 속도와 SEO는 그대로 둔 채
백엔드 연습을 할 수 있습니다.

## 구조

```
src/
  config.ts            사이트 전역 설정 — 제목, 주소, 메뉴
  content/posts/       글 (마크다운)
  content.config.ts    프론트매터 스키마 — 오타가 있으면 빌드가 막아줍니다
  layouts/             페이지 공통 뼈대
  components/          헤더, 푸터, 목차, 글 카드
  pages/               라우팅 (파일 = 주소)
  lib/posts.ts         글 목록·태그·읽는 시간 계산
  styles/global.css    디자인 토큰과 본문 스타일 — 색을 바꾸려면 여기
astro.config.ts        코드 블록·제목 앵커 등 마크다운 처리 설정
```

색을 바꾸고 싶으면 `src/styles/global.css` 맨 위의 `--accent` 값만 바꾸면
링크, 태그, 강조 줄까지 전부 따라옵니다.
