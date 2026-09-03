import { CATEGORY_LABELS } from '../config';
import { categoryOf, getPublishedPosts, type Post } from './posts';

/** 카테고리 트리의 노드 하나. */
export interface CategoryNode {
  /** 'backend/spring' 같은 전체 경로. URL과 CATEGORY_LABELS의 키로 쓰입니다. */
  path: string;
  /** 화면에 보이는 이름. CATEGORY_LABELS에 없으면 폴더 이름을 그대로 씁니다. */
  label: string;
  /** 이 카테고리에 직접 속한 글 수. */
  count: number;
  /** 하위 카테고리까지 모두 더한 글 수. */
  totalCount: number;
  /** 최상위가 1. */
  depth: number;
  children: CategoryNode[];
}

/** 'backend/spring' → 'Spring'. 등록되지 않은 경로는 마지막 폴더 이름을 씁니다. */
export function labelOf(path: string): string {
  return CATEGORY_LABELS[path] ?? path.split('/').pop() ?? path;
}

export function urlOfCategory(path: string): string {
  return `/categories/${path}/`;
}

/**
 * 'backend/spring' → [{ path: 'backend', label: '백엔드' }, { path: 'backend/spring', label: 'Spring' }]
 * 브레드크럼에 씁니다.
 */
export function breadcrumbOf(path: string): { path: string; label: string }[] {
  if (!path) return [];
  const segments = path.split('/');
  return segments.map((_, i) => {
    const sub = segments.slice(0, i + 1).join('/');
    return { path: sub, label: labelOf(sub) };
  });
}

/**
 * 글들이 놓인 폴더 구조에서 카테고리 트리를 만듭니다.
 *
 * 글이 'backend/spring'에만 있어도 중간 단계인 'backend'가 자동으로 만들어집니다.
 * 그래야 상위 카테고리를 눌렀을 때 하위 글까지 볼 수 있습니다.
 */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const posts = await getPublishedPosts();

  const nodes = new Map<string, CategoryNode>();

  const ensure = (path: string): CategoryNode => {
    const existing = nodes.get(path);
    if (existing) return existing;

    const node: CategoryNode = {
      path,
      label: labelOf(path),
      count: 0,
      totalCount: 0,
      depth: path.split('/').length,
      children: [],
    };
    nodes.set(path, node);

    // 부모를 먼저 만들어 연결합니다. 중간 단계가 비어 있어도 트리가 이어집니다.
    const parentPath = path.split('/').slice(0, -1).join('/');
    if (parentPath) ensure(parentPath).children.push(node);

    return node;
  };

  for (const post of posts) {
    const path = categoryOf(post);
    if (!path) continue; // 최상위에 놓인 글은 미분류
    ensure(path).count += 1;
  }

  // 하위 글 수를 상위로 올려 더합니다.
  for (const node of nodes.values()) {
    for (const segment of ancestorsOf(node.path)) {
      nodes.get(segment)!.totalCount += node.count;
    }
  }

  const sortTree = (list: CategoryNode[]): CategoryNode[] => {
    list.sort((a, b) => a.label.localeCompare(b.label, 'ko'));
    for (const node of list) sortTree(node.children);
    return list;
  };

  const roots = [...nodes.values()].filter((n) => n.depth === 1);
  return sortTree(roots);
}

/** 'a/b/c' → ['a', 'a/b', 'a/b/c'] (자기 자신 포함) */
function ancestorsOf(path: string): string[] {
  const segments = path.split('/');
  return segments.map((_, i) => segments.slice(0, i + 1).join('/'));
}

/**
 * 해당 카테고리와 그 하위 카테고리에 속한 모든 글.
 * 'backend'를 열면 'backend/spring' 글도 함께 보입니다.
 */
export async function getPostsInCategory(path: string): Promise<Post[]> {
  const posts = await getPublishedPosts();
  return posts.filter((post) => {
    const category = categoryOf(post);
    return category === path || category.startsWith(path + '/');
  });
}

/** 트리를 평평하게 편 목록. 정적 경로 생성에 씁니다. */
export function flattenTree(nodes: CategoryNode[]): CategoryNode[] {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
}
