import type { SectionDef } from './types';
export declare function registerSections(defs: SectionDef[]): void;
export declare function getSection(name: string): SectionDef | undefined;
/** All registered sections — the editor uses this to build its inserter. */
export declare function allSections(): SectionDef[];
