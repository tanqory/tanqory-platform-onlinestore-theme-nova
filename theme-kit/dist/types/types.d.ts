import type { FC, ReactNode } from 'react';
/** A single editor-facing setting (= a section attribute). */
export interface AttrSpec {
    type: 'text' | 'textarea' | 'color' | 'number' | 'url' | 'boolean' | 'select' | 'radio' | 'richtext' | 'html' | 'text_alignment' | 'range' | 'video' | 'collection' | 'product' | 'page' | 'blog' | 'article' | 'menu' | 'image';
    default?: unknown;
    label?: string;
    /** Editor grouping — controls sharing a `group` are rendered together under
     *  that heading in the settings panel (e.g. 'Brand', 'Header', 'Cart'). Used
     *  by the theme-settings schema so the panel has structure instead of one
     *  flat list. Optional; ungrouped controls fall under a default section. */
    group?: string;
    /** Slider bounds — for type 'range'. */
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    /** Placeholder / helper text shown in the editor control. */
    placeholder?: string;
    info?: string;
    /** Conditional visibility (Shopify-style), e.g. `"{{ section.settings.x == 'y' }}"`. */
    visible_if?: string;
    /** For type 'select'/'radio' — the editor renders these as options. */
    options?: {
        value: string;
        label: string;
    }[];
}
/** Props every section component receives. `attributes` are resolved (defaults applied). */
export interface SectionProps {
    attributes: Record<string, any>;
    children?: ReactNode;
}
/**
 * One section definition — serves all three consumers from a single source:
 *   - dev:        write `component` (React, logic allowed)
 *   - editor:     `attributes` → auto settings UI, `allowedBlocks` → nesting
 *   - storefront: `component` renders the node
 */
export interface SectionDef {
    name: string;
    title: string;
    category?: string;
    icon?: string;
    attributes?: Record<string, AttrSpec>;
    allowedBlocks?: string[];
    component: FC<SectionProps>;
}
/** A node in the content tree (what the editor stores as JSON, never HTML). */
export interface ContentNode {
    type: string;
    id?: string;
    settings?: Record<string, unknown>;
    /** Nested child instances. */
    blocks?: ContentNode[];
}
/** A page = a route + its tree of section instances. */
export interface PageDoc {
    sections: ContentNode[];
}
