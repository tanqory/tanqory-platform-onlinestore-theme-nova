import { type ReactNode } from 'react';
import type { ContentNode } from './types';
/**
 * Compile a *static* JSX composition into the canonical JSON block tree.
 *
 *   <Hero settings={{…}}><Button settings={{…}} /></Hero>
 *     →  [{ type:'hero', settings:{…}, blocks:[{ type:'button', settings:{…} }] }]
 *
 * Only nesting + literal `settings` are read — there is no place for logic, which
 * is exactly what keeps a page round-trippable by the editor. (Logic lives in
 * the block components, never in a page composition.)
 */
export declare function jsxToJSON(node: ReactNode): ContentNode[];
