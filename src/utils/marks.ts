import * as TAGS from '../constants/tags';
import type { HtmlTagGroup } from '../constants/tags';
import { setLooseText } from './highlights';

export type MarkKind = 'keep' | 'ignore';

const MARK_ATTR = 'data-skeleton';
const KIND_ATTR = 'data-skx';
const READY_ATTR = 'data-skx-ready';
const KEEP_PATH_ATTR = 'data-skx-keep-path';
const KEEP_SELECTOR = '[data-skeleton="keep"], .not-skeleton';
const HTML_NS = 'http://www.w3.org/1999/xhtml';

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

/* ------------------------------------------------------------------ */
/* Element classification                                              */
/*                                                                     */
/* Each element inside a loading skeleton gets data-skx:               */
/*   t  text line(s)          f  empty text, filled with a line        */
/*   b  block (media, control, explicit shape)                         */
/*   e  empty element (drawn only if it has a size)                    */
/*   c  covered (canvas, iframe, checkbox...: inset outline)           */
/* Containers get nothing and are descended into. The stylesheet then  */
/* only needs cheap attribute rules; its own :has()-based detection is */
/* a fallback for server-rendered HTML before hydration.               */
/* ------------------------------------------------------------------ */

const set = (...items: string[]) => new Set(items);

const TEXT_TAGS = set('p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'figcaption', 'legend', 'caption', 'summary', 'dt');
const PHRASING = set('br', 'wbr', 'b', 'i', 'u', 's', 'strong', 'em', 'small', 'mark', 'sub', 'sup', 'code', 'kbd', 'abbr', 'time', 'q', 'cite', 'var', 'samp', 'del', 'ins');
const BLOCK_TAGS = set('img', 'svg', 'textarea', 'select', 'button');
const BLOCK_CLASSES = ['sk-block', 'sk-circle', 'sk-rect', 'sk-pill'];
const COVERED_TAGS = set('progress', 'meter', 'canvas', 'iframe', 'embed', 'object', 'audio', 'video');
const CONTROL_TAGS = set('input', 'select', 'textarea');
const COVERED_INPUTS = set('checkbox', 'radio', 'range', 'color', 'file');
const FILLABLE = set('p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'label', 'li', 'td', 'th', 'dd', 'dt', 'figcaption', 'caption', 'blockquote');
const NON_VISUAL = set(
    'br', 'wbr', 'option', 'optgroup', 'script', 'style', 'template', 'noscript', 'source', 'track', 'area', 'param',
    'col', 'colgroup', 'datalist', 'slot', 'link', 'meta', 'title', 'base', 'map', 'head'
);
// Treated as inline content without asking getComputedStyle (icons and
// controls are often display:block, e.g. with Tailwind, yet sit in a line).
const INLINE_TAGS = set(
    'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'button', 'cite', 'code', 'data', 'del', 'dfn', 'em', 'i', 'img', 'input',
    'ins', 'kbd', 'label', 'mark', 'q', 's', 'samp', 'select', 'small', 'span', 'strong', 'sub', 'sup', 'svg', 'time',
    'u', 'var', 'wbr', 'picture'
);

function hasDirectText(el: Element): boolean {
    for (let node = el.firstChild; node; node = node.nextSibling) {
        if (node.nodeType === 3 && node.nodeValue && node.nodeValue.trim()) return true;
    }
    return false;
}

interface Classification {
    kinds: Map<Element, string>;
    /** Text nodes next to block-level children, drawn with a CSS highlight. */
    loose: Text[];
}

function classifyRoot(root: Element, fill: boolean, result: Classification): void {
    const { kinds: out, loose } = result;
    const hasKeep = !!root.querySelector(KEEP_SELECTOR);
    const keepInside = (el: Element) => hasKeep && !!el.querySelector(KEEP_SELECTOR);
    const isInline = (el: Element) => INLINE_TAGS.has(el.localName) || getComputedStyle(el).display.startsWith('inline');
    // A line of text may contain icons, links, buttons..., but not form fields
    // or block-level elements (painting it would cover them).
    const isLine = (children: HTMLCollection) => Array.from(children).every((c) => !CONTROL_TAGS.has(c.localName) && isInline(c));
    // Empty elements: sized ones are placeholders, zero-sized ones are text
    // whose data is missing. Decided after the walk, so layout is read once.
    const empties: Element[] = [];
    // Text elements that may really be a shape with a label (avatar "JD",
    // icon tile): checked against their size after the walk.
    const texts: Element[] = [];

    const visit = (el: Element): void => {
        const marker = el.getAttribute(MARK_ATTR);
        if (marker) {
            if (marker === 'block') out.set(el, 'b');
            else if (marker === 'line') out.set(el, 't');
            return; // keep / ignore / unite are handled by the stylesheet
        }
        const tag = el.localName;
        const cls = el.classList;
        if (cls.contains('not-skeleton') || NON_VISUAL.has(tag)) return;
        if (cls.contains('skx-wrapper')) {
            for (const child of Array.from(el.children)) visit(child);
            return;
        }
        if (el.namespaceURI !== HTML_NS && tag !== 'svg') return;

        if (tag === 'input') {
            const type = (el as HTMLInputElement).type;
            if (type !== 'hidden') out.set(el, COVERED_INPUTS.has(type) ? 'c' : 'b');
            return;
        }
        if (COVERED_TAGS.has(tag)) {
            out.set(el, 'c');
            return;
        }

        const children = el.children;
        const painted = (kind: string) => {
            // Kept content inside: draw its parts instead of one block.
            if (keepInside(el)) descend(el);
            else out.set(el, kind);
        };

        if (BLOCK_TAGS.has(tag) || BLOCK_CLASSES.some((c) => cls.contains(c))) return painted('b');
        if (cls.contains('sk-line')) return painted('t');

        let onlyPhrasing = true;
        for (let i = 0; i < children.length; i++) {
            if (!PHRASING.has(children[i].localName)) {
                onlyPhrasing = false;
                break;
            }
        }

        const text = () => {
            painted('t');
            if (out.get(el) === 't') texts.push(el);
        };

        if (onlyPhrasing) {
            if (children.length || hasDirectText(el)) return text();
            if (fill && FILLABLE.has(tag)) return painted('f');
            if (TEXT_TAGS.has(tag)) return painted('t');
            empties.push(el);
            return;
        }
        // Text with inline elements: <div>12 items <svg/></div>, <p>Hi <a/></p>
        if ((TEXT_TAGS.has(tag) || hasDirectText(el)) && isLine(children)) return text();

        descend(el);
    };

    const descend = (el: Element) => {
        for (let node = el.firstChild; node; node = node.nextSibling) {
            if (node.nodeType === 3) {
                if (node.nodeValue && node.nodeValue.trim()) loose.push(node as Text);
            } else if (node.nodeType === 1) {
                visit(node as Element);
            }
        }
    };

    if (!root.classList.contains('skx-container')) visit(root);

    for (const el of empties) {
        const rect = el.getBoundingClientRect();
        out.set(el, fill && (rect.width === 0 || rect.height === 0) ? 'f' : 'e');
    }
    for (const el of texts) {
        if (isLabelledShape(el)) out.set(el, 'b');
    }
}

/**
 * A round or roughly square box that is much taller than the text inside it,
 * e.g. an avatar with initials or an icon tile with an emoji. Drawn as one
 * solid shape instead of text lines (which would stripe it).
 */
function isLabelledShape(el: Element): boolean {
    const box = el.getBoundingClientRect();
    if (box.height < 24 || !box.width) return false;
    const style = getComputedStyle(el);
    const round = parseFloat(style.borderTopLeftRadius) > 0;
    if (!round && box.width > box.height * 2.5) return false;
    const range = document.createRange();
    range.selectNodeContents(el);
    const textHeight = range.getBoundingClientRect().height;
    if (!textHeight) return false;
    const px = (v: string) => parseFloat(v) || 0;
    const inner = box.height - px(style.paddingTop) - px(style.paddingBottom) - px(style.borderTopWidth) - px(style.borderBottomWidth);
    return inner > textHeight * 1.6;
}

/**
 * DOM pass over the skeleton roots, re-run when their content changes while
 * loading. It sets the attributes the stylesheet relies on:
 *
 * - data-skx on every element (see above) and data-skx-ready on the roots;
 * - data-skeleton="keep|ignore" for `exceptTags` / `excludeSelector`
 *   matches, including content rendered by child components;
 * - data-skx-keep-path on ancestors of kept content, so they do not pass a
 *   transparent text colour down to it.
 *
 * Only attributes added here are changed or removed.
 */
export function decorateSubtrees(
    roots: Element[],
    rules: Array<[selector: string, kind: MarkKind]>,
    { fill = true }: { fill?: boolean } = {}
): () => void {
    if (!roots.length || typeof document === 'undefined') return () => { };

    const added: Array<[Element, string]> = [];
    const setOnce = (el: Element, name: string, value: string) => {
        if (el.hasAttribute(name)) return;
        el.setAttribute(name, value);
        added.push([el, name]);
    };
    const active = rules.filter(([selector]) => selector);
    const owner = {};
    let kinds = new Map<Element, string>();

    const run = () => {
        const result: Classification = { kinds: new Map(), loose: [] };
        const next = result.kinds;
        // Switch every root off the CSS fallback first, so a style read below
        // never evaluates the heavier fallback selectors.
        roots.forEach((root) => setOnce(root, READY_ATTR, ''));
        for (const root of roots) {
            for (const [selector, kind] of active) {
                if (root.matches(selector)) setOnce(root, MARK_ATTR, kind);
                root.querySelectorAll(selector).forEach((el) => setOnce(el, MARK_ATTR, kind));
            }
            root.querySelectorAll(KEEP_SELECTOR).forEach((kept) => {
                for (let el = kept.parentElement; el; el = el.parentElement) {
                    if (el.hasAttribute(KEEP_PATH_ATTR)) break;
                    setOnce(el, KEEP_PATH_ATTR, '');
                    if (el === root) break;
                }
            });
            classifyRoot(root, fill, result);
        }
        setLooseText(owner, result.loose);
        kinds.forEach((_, el) => {
            if (!next.has(el)) el.removeAttribute(KIND_ATTR);
        });
        next.forEach((kind, el) => {
            if (el.getAttribute(KIND_ATTR) !== kind) el.setAttribute(KIND_ATTR, kind);
        });
        kinds = next;
    };

    run();

    let observer: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined') {
        observer = new MutationObserver(run);
        roots.forEach((root) => observer!.observe(root, { childList: true, subtree: true, characterData: true }));
    }

    return () => {
        observer?.disconnect();
        setLooseText(owner, []);
        kinds.forEach((_, el) => el.removeAttribute(KIND_ATTR));
        kinds.clear();
        added.forEach(([el, name]) => el.removeAttribute(name));
        added.length = 0;
    };
}
