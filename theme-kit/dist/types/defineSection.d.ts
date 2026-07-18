import type { SectionDef } from './types';
/**
 * Declare a section (a top-level, editor-placeable unit). Attaches `blockName`
 * to the component so a JSX composition (`<Hero/>`) can be walked back into the
 * content tree (see jsx-to-json.ts).
 */
export declare function defineSection(def: SectionDef): SectionDef;
