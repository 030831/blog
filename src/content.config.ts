import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    /**
     * 글 번호. 이 값이 곧 주소가 됩니다 (/posts/12/).
     * 제목이나 파일 이름을 바꿔도 주소가 유지되도록 번호를 따로 둡니다.
     * 편집기와 `npm run new` 가 자동으로 매깁니다. 손으로 고치지 마세요.
     */
    postId: z.number().int().positive(),
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    // true면 빌드에서 제외됩니다. 초고 쓸 때 사용하세요.
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
