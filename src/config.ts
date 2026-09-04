// 블로그 전역 설정. 여기만 고치면 사이트 전체에 반영됩니다.
export const SITE = {
  title: '030831',
  // 검색엔진과 링크 미리보기에 쓰이는 설명문 (조금 길어도 됩니다)
  description: '백엔드 개발을 공부하며 남기는 기록. Java, Spring, MySQL, 그리고 그 사이의 것들.',
  // 사이트 이름 아래에 보이는 한 줄. 짧게 유지해야 줄바꿈이 어색하지 않습니다.
  tagline: '백엔드를 공부하며 남기는 기록',
  // 배포 후 실제 도메인으로 바꿔주세요. (RSS/사이트맵/OG 태그에 쓰입니다)
  url: 'https://030831-blog.vercel.app',
  author: '030831',
  locale: 'ko-KR',
  // 푸터 링크. 비워두면 표시되지 않습니다.
  social: [
    { label: 'GitHub', href: 'https://github.com/030831' },
    { label: 'RSS', href: '/rss.xml' },
  ],
  /** 홈에서 한 쪽에 보여줄 글 수 (카드라 자리를 많이 차지해 적게 잡습니다) */
  homePostsPerPage: 5,
  /** 글 목록(/posts)에서 한 쪽에 보여줄 글 수 (제목+날짜 행이라 더 담을 수 있습니다) */
  postsPerPage: 10,

  /**
   * 사이트 전체 디자인. 'warm' | 'ink' | 'terminal' | 'nordic'
   * 실제 화면은 src/styles/skins.css 에서 정의합니다.
   */
  skin: 'warm',

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
  sample: '샘플',
};
