// 블로그 전역 설정. 여기만 고치면 사이트 전체에 반영됩니다.
export const SITE = {
  title: '030831',
  description: '백엔드 개발을 공부하며 남기는 기록. Java, Spring, MySQL, 그리고 그 사이의 것들.',
  // 배포 후 실제 도메인으로 바꿔주세요. (RSS/사이트맵/OG 태그에 쓰입니다)
  url: 'https://030831-blog.vercel.app',
  author: '030831',
  locale: 'ko-KR',
  // 상단 네비게이션
  nav: [
    { label: '글', href: '/posts' },
    { label: '카테고리', href: '/categories' },
    { label: '태그', href: '/tags' },
    { label: '소개', href: '/about' },
  ],
  // 푸터 링크. 비워두면 표시되지 않습니다.
  social: [
    { label: 'GitHub', href: 'https://github.com/030831' },
    { label: 'RSS', href: '/rss.xml' },
  ],
  postsPerPage: 10,

  /**
   * 사이트 전체 디자인. 'warm' | 'ink' | 'terminal' | 'nordic'
   * 실제 화면은 src/styles/skins.css 에서 정의합니다.
   */
  skin: 'warm',

  /**
   * 오른쪽 아래에 디자인 전환 버튼을 띄웁니다.
   * 마음에 드는 걸 고른 뒤 skin 값을 바꾸고 이 값을 false로 두세요.
   */
  showSkinSwitcher: true,
} as const;

/**
 * 카테고리 표시 이름.
 *
 * 폴더 이름이 곧 카테고리이고, URL에 그대로 들어가므로 폴더는 영문으로 만듭니다.
 * 화면에 한글로 보이게 하려면 여기에 폴더 경로 → 표시 이름을 적어주세요.
 * 적지 않은 폴더는 폴더 이름이 그대로 표시됩니다.
 *
 * 예) src/content/posts/backend/spring/글.md  →  'backend/spring' 항목이 쓰입니다.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  backend: '백엔드',
  'backend/spring': 'Spring',
  'backend/mysql': 'MySQL',
  algorithm: '알고리즘',
  'algorithm/binary-search': '이분 탐색',
  blog: '블로그',
};
