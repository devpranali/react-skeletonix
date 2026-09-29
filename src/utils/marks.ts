import * as TAGS from '../constants/tags';
import type { HtmlTagGroup } from '../constants/tags';

export type MarkKind = 'keep' | 'ignore';

const ATTR = 'data-skeleton';

/** Builds a selector for `exceptTags` + `exceptTagGroups`, or '' when empty. */
export function tagsSelector(tags: string[] = [], groups: HtmlTagGroup[] = []): string {
    const all = new Set<string>(tags);
    groups.forEach((group) => (TAGS[group] as readonly string[] | undefined)?.forEach((tag) => all.add(tag)));
    return Array.from(all).join(', ');
}

const warned = new Set<string>();

/** Returns the selector if the browser accepts it; warns once otherwise. */
export function validSelector(selector: string | undefined): string {
    if (!selector || typeof document === 'undefined') return '';
    try {
        document.createDocumentFragment().querySelector(selector);
        return selector;
    } catch {
        if (!warned.has(selector)) {
            warned.add(selector);
            console.warn(`[react-skeletonix] Ignoring invalid selector: "${selector}"`);
        }
        return '';
    }
}

/**
 * Marks elements inside the skeleton roots with data-skeleton="keep|ignore"
 * so the stylesheet treats them accordingly. Works for content rendered by
 * child components too, and follows DOM changes while loading. Only the
 * attributes added here are removed on cleanup.
 */
export function markSubtrees(roots: Element[], rules: Array<[selector: string, kind: MarkKind]>): () => void {
    const active = rules.filter(([selector]) => selector);
    if (!roots.length || !active.length) return () => { };

    const marked = new Set<Element>();

    const mark = () => {
        for (const [selector, kind] of active) {
            for (const root of roots) {
                const matches = Array.from(root.querySelectorAll(selector));
                if (root.matches(selector)) matches.unshift(root);
                for (const el of matches) {
                    if (el.hasAttribute(ATTR)) continue;
                    el.setAttribute(ATTR, kind);
                    marked.add(el);
                }
            }
        }
    };

    mark();

    let observer: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(mark);
        roots.forEach((root) => observer!.observe(root, { childList: true, subtree: true }));
    }

    return () => {
        observer?.disconnect();
        marked.forEach((el) => el.removeAttribute(ATTR));
        marked.clear();
    };
}
