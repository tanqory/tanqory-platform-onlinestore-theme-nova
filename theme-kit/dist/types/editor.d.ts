import type { ContentNode } from './types';
export declare function Editor({ pages, initialPage }: {
    pages: Record<string, ContentNode[]>;
    initialPage?: string;
}): JSX.Element;
