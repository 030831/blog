# 개인 블로그 (030831)

이 파일은 새 Claude Code 세션이 프로젝트 맥락을 바로 파악하기 위한 문서입니다.
노트북과 데스크톱을 오가며 작업하므로, 결정 사항은 대화가 아니라 **여기에** 기록합니다.

## 이 프로젝트가 무엇인가

- 백엔드(Java/Spring/MySQL)를 공부하며 남기는 개인 기술 블로그 겸 포트폴리오
- 저장소: https://github.com/030831/blog
- 배포: https://030831-blog.vercel.app (main에 push하면 Vercel이 자동 배포)
- 로컬 경로: 노트북 `C:\myblog` / 데스크톱은 클론한 위치

## 스택과 그 이유

**Astro + 마크다운 정적 사이트.** DB 없음. 서버 없음.

- 글 하나 = `src/content/posts/` 안의 `.md` 파일 하나. Git이 사실상 DB 역할
- 빌드 시점에 HTML로 구워 CDN에 올림 → 요청 시 애플리케이션/DB 관여 없음
- React/Next 대신 Astro를 쓴 이유: 결과물이 거의 순수 HTML/CSS라 프론트 지식 없이도
  유지보수가 가능하고, 마크다운이 표준 형식이라 나중에 다른 프레임워크로 이전 가능
- 조회수·댓글이 필요해지면 그때 Spring Boot + MySQL API를 별도로 붙이는 방향
  (블로그 본문은 정적으로 유지)

## 작업자에 대해

사용자는 **백엔드 학습자**입니다. 프론트엔드·CSS·디자인은 잘 모르며,
그 영역의 결정은 Claude가 맡아서 해주기를 원합니다. 선택지를 나열해 되묻지 말고
근거를 갖춘 결과물을 제시할 것.

다만 **기술 스택 선택은 신중하게** 다룹니다. 스택을 제안할 때는
(1) 검토한 대안과 그것을 택하지 않은 구체적 이유, (2) 나중에 빠져나올 수 있는 경로를
함께 설명해야 납득합니다.

## 구조

```
src/
  config.ts            사이트 전역 설정 — 제목, 주소, 메뉴, 카테고리 표시 이름, 스킨
  content/posts/       글. 폴더 구조가 곧 카테고리 트리
  content.config.ts    프론트매터 스키마 (오타는 빌드에서 잡힘)
  lib/posts.ts         글 목록, 슬러그, 카테고리 경로, 읽는 시간
  lib/categories.ts    카테고리 트리 생성, 브레드크럼
  layouts/             BaseLayout(공통) / SidebarLayout(목록형) / DemoShell(시안 전용)
  components/          Header, Footer, PostCard, CategoryTree, CategorySidebar 등
  pages/               라우팅. 파일 = 주소
  styles/global.css    구조 + 본문 스타일
  styles/skins.css     색·글꼴 팔레트 (warm / ink / terminal / nordic)
astro.config.ts        코드 블록(Shiki), 제목 앵커, 표 감싸기 설정
```

## 반드시 지켜야 할 규칙

**글의 URL은 파일 이름만으로 정해집니다** (`lib/posts.ts`의 `slugOf`).
폴더 경로는 URL에 들어가지 않습니다. 카테고리를 바꾸려고 글을 다른 폴더로 옮겨도
링크가 깨지지 않게 하려는 의도적인 설계입니다. 폴더가 달라도 **파일 이름이 겹치면
빌드가 실패**합니다(의도된 동작).

**프론트매터의 날짜는 UTC 자정으로 해석됩니다.** 한국 시간 기준 오늘 쓴 글이
미래 글로 분류되어 빌드에서 빠지는 문제가 있어, `getPublishedPosts`에서
시각이 아니라 날짜 단위로 비교합니다. 이 비교 로직을 단순화하지 말 것.

**글 파일 이름은 영문 슬러그로.** 한글 파일명은 URL에서 퍼센트 인코딩되어 읽기 어려워집니다.

## 자주 쓰는 명령

```bash
npm run dev              # 개발 서버 (http://localhost:4321)
npm run build            # 정적 빌드
npm run new "글 제목"     # 프론트매터가 채워진 새 글 파일 생성
```

## 진행 중인 작업

- [ ] **블로그 테마 결정** — `src/pages/themes/` 에 구조가 다른 시안 5종이 있음
      (1 미니멀 저널 / 2 프로필 사이드바 / 3 매거진 그리드 / 4 터미널 / 5 스플릿 스크린).
      사용자가 하나를 고르면 그 구조로 전체 페이지를 다시 짜고,
      `src/pages/themes/` 폴더와 `SkinSwitcher`(config의 `showSkinSwitcher`)를 삭제할 것.
- [ ] 테마 확정 후 `config.ts`의 `showSkinSwitcher`를 `false`로

## 하지 않기로 한 것

- 댓글, 조회수, 회원 기능 — 당장 필요 없다고 확인됨
- 티스토리/velog 같은 서비스형 플랫폼 — 글 이전이 어려워서 배제
