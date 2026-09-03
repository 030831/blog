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
    { label: '태그', href: '/tags' },
    { label: '소개', href: '/about' },
  ],
  // 푸터 링크. 비워두면 표시되지 않습니다.
  social: [
    { label: 'GitHub', href: 'https://github.com/030831' },
    { label: 'RSS', href: '/rss.xml' },
  ],
  postsPerPage: 10,
} as const;
