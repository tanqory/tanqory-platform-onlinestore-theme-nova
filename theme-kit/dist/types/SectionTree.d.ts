import type { ContentNode } from './types';
/**
 * The heart: render a JSON content tree → React. The editor and the storefront
 * both render through this — content stays JSON, never HTML.
 */
export declare function SectionTree({ tree }: {
    tree: ContentNode[];
}): JSX.Element;
