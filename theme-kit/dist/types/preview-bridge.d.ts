import { type FC, type ReactNode } from 'react';
import type { ContentNode } from './types';
export declare function PreviewBridge({ pages, initialPage, Shell, }: {
    pages: Record<string, ContentNode[]>;
    initialPage: string;
    Shell: FC<{
        children: ReactNode;
    }>;
}): JSX.Element;
