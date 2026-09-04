import { defineConfig } from 'astro/config';
import type { AstroIntegration } from 'astro';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { transformerMetaHighlight } from '@shikijs/transformers';
import { visit } from 'unist-util-visit';
import { SITE } from './src/config';

/**
 * 코드 블록에 언어 라벨과 파일명을 붙입니다.
 *   ```java title="OrderService.java"
 * 위처럼 쓰면 <pre>에 data-lang / data-title 속성이 붙고, CSS가 헤더 바를 그립니다.
 */
function codeBlockChrome() {
  return {
    name: 'code-block-chrome',
    pre(node: any) {
      const raw: string = (this as any).options?.meta?.__raw ?? '';
      const title = raw.match(/title="([^"]+)"/)?.[1];
      node.properties['data-lang'] = (this as any).options?.lang ?? 'text';
      if (title) node.properties['data-title'] = title;
    },
  };
}

/** 넓은 표가 화면을 밀어내지 않도록 가로 스크롤 컨테이너로 감쌉니다. */
function rehypeWrapTables() {
  return (tree: any) => {
    visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
      if (node.tagName !== 'table' || !parent || index === undefined) return;
      if (parent.properties?.className?.includes?.('table-scroll')) return;
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'] },
        children: [node],
      };
    });
  };
}

/**
 * 글 편집기를 개발 서버에서만 붙입니다.
 *
 * 편집기는 파일을 디스크에 쓰기 때문에 서버가 필요한데, 배포본은 정적 파일뿐이라
 * 애초에 빌드에 넣지 않습니다. src/pages 밖에 두고 여기서 주입하는 이유입니다.
 */
function devEditor(): AstroIntegration {
  return {
    name: 'dev-editor',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command !== 'dev') return;
        injectRoute({ pattern: '/editor', entrypoint: './src/dev/editor.astro' });
        injectRoute({ pattern: '/api/save-post', entrypoint: './src/dev/save-post.ts' });
        injectRoute({ pattern: '/api/load-post', entrypoint: './src/dev/load-post.ts' });
      },
    },
  };
}

export default defineConfig({
  site: SITE.url,
  integrations: [mdx(), sitemap(), devEditor()],
  markdown: {
    shikiConfig: {
      // 라이트/다크 두 벌을 동시에 구워둡니다. 테마 전환 시 CSS 변수로 갈아끼웁니다.
      themes: { light: 'github-light', dark: 'github-dark-dimmed' },
      transformers: [transformerMetaHighlight(), codeBlockChrome()],
      wrap: false,
    },
    rehypePlugins: [
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: { className: ['heading-anchor'], ariaHidden: 'true', tabIndex: -1 },
          content: { type: 'text', value: '#' },
        },
      ],
      rehypeWrapTables,
    ],
  },
});
