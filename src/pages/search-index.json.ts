import type { APIRoute } from 'astro';
import { categoryOf, excerptOf, getPublishedPosts, toPlainText, urlOf } from '../lib/posts';
import { breadcrumbOf, labelOf } from '../lib/categories';

/**
 * 클라이언트 검색용 색인.
 *
 * 정적 사이트라 검색을 처리할 서버가 없습니다. 대신 빌드 시점에 글 전체를
 * JSON 하나로 구워두고, 브라우저가 그걸 받아 직접 걸러냅니다.
 * 글이 수백 개로 늘어 파일이 무거워지면 body를 앞부분만 남기거나
 * 색인을 나눠 받는 방식으로 바꾸면 됩니다.
 */
export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();

  const entries = posts.map((post) => {
    const category = categoryOf(post);
    return {
      title: post.data.title,
      url: urlOf(post),
      date: post.data.date.toISOString().slice(0, 10),
      excerpt: excerptOf(post),
      tags: post.data.tags,
      category,
      // '백엔드 › Spring' 처럼 사람이 읽는 경로. 카테고리 검색에 이 값을 씁니다.
      categoryLabel: breadcrumbOf(category).map((c) => c.label).join(' ') || '미분류',
      categoryName: category ? labelOf(category) : '미분류',
      body: toPlainText(post.body ?? ''),
    };
  });

  return new Response(JSON.stringify(entries), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
