import type { Post } from '@/features/feed/types';

export interface CommentsPanelProps {
  post: Post | null;
  visible: boolean;
  onClose: () => void;
}

/**
 * Comments panel. Platform split (Metro picks `.native`/`.web`):
 * - native → `@gorhom/bottom-sheet` modal (slide + inner scroll coordinated).
 * - web → Instagram-style modal (left media carousel, right comments).
 *
 * This base file only provides the shared type + a no-op default for TypeScript.
 */
export default function CommentsPanel(_props: CommentsPanelProps) {
  return null;
}
