/**
 * 제목에서 주소(슬러그)를 자동으로 만듭니다.
 *
 * 파일 이름이 곧 주소인데, 한글 파일명은 주소에서 %EC%BB%A4... 처럼 인코딩되어
 * 링크를 공유했을 때 알아볼 수 없게 됩니다. 그렇다고 글쓴이가 매번 영문 주소를
 * 직접 적는 것도 번거로우므로, 한글을 로마자로 옮겨 자동으로 채웁니다.
 *
 * 편집기(브라우저)와 scripts/new-post.mjs(Node) 양쪽에서 씁니다.
 */

// 국어의 로마자 표기법 기준 표. 초성 19 / 중성 21 / 종성 28.
const INITIALS = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp',
  's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];

const MEDIALS = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae',
  'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i',
];

const FINALS = [
  '', 'k', 'k', 'ks', 'n', 'nj', 'nh', 't', 'l', 'lk', 'lm', 'lb', 'ls',
  'lt', 'lp', 'lh', 'm', 'b', 'bs', 's', 'ss', 'ng', 'j', 'ch', 'k', 't', 'p', 'h',
];

const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;

/** 한글 음절 하나를 로마자로 옮깁니다. 한글이 아니면 그대로 돌려줍니다. */
function romanizeSyllable(char) {
  const code = char.charCodeAt(0);
  if (code < HANGUL_BASE || code > HANGUL_LAST) return char;

  const offset = code - HANGUL_BASE;
  const initial = Math.floor(offset / 588);
  const medial = Math.floor((offset % 588) / 28);
  const final = offset % 28;

  return INITIALS[initial] + MEDIALS[medial] + FINALS[final];
}

/** 문자열 전체를 로마자로 옮깁니다. */
export function romanize(text) {
  return [...text].map(romanizeSyllable).join('');
}

/**
 * 제목 → 주소.
 *
 * 기술 글은 제목에 영문이 섞이는 경우가 많아(JPA, Spring 같은 것) 그대로 두면
 * 읽기 좋은 주소가 나옵니다. 한글은 로마자로 옮깁니다.
 *
 *   'JPA N+1 문제 해결하기'  →  'jpa-n-1-munje-haegyeolhagi'
 *   '커넥션 풀 크기 정하기'   →  'keonaeksyeon-pul-keugi-jeonghagi'
 */
export function slugify(title) {
  return romanize(String(title))
    .toLowerCase()
    // 한글이 아닌 기호와 공백은 하이픈으로
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    // 주소가 지나치게 길어지지 않게 자릅니다. 하이픈 중간에서 끊지 않습니다.
    .replace(/^(.{0,60})(-.*)?$/, '$1');
}

/** 파일 이름과 폴더 이름으로 쓸 수 있는 형태인지 확인합니다. */
export function isValidSlug(slug) {
  return /^[a-z0-9][a-z0-9-]*$/.test(slug);
}
