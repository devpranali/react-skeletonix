/**
 * `showWrapper={false}` with a component child: there is no element we can
 * clone, and a wrapper <div> would be invalid inside <tbody>, <ul>, <select>...
 * Instead the child is rendered between two <template> anchors (valid in any
 * parent) and the skeleton classes are applied to the DOM elements between
 * them. Everything added here is removed again on cleanup.
 */

export interface RootDecoration {
    classes: string[];
    vars: Record<string, string>;
    attrs: Record<string, string>;
}

export const ANCHOR_ATTR = 'data-skx-anchor';

interface Applied {
    classes: Set<string>;
    vars: Map<string, string>;
    attrs: Map<string, string | null>;
}

function isAnchor(node: Node, kind?: 'start' | 'end'): node is Element {
    return node.nodeType === 1
        && (node as Element).tagName === 'TEMPLATE'
        && (node as Element).hasAttribute(ANCHOR_ATTR)
        && (!kind || (node as Element).getAttribute(ANCHOR_ATTR) === kind);
}

/** Element siblings between a start anchor and its matching end anchor. */
export function collectAnchored(start: Element): Element[] {
    const out: Element[] = [];
    let depth = 0;
    for (let node = start.nextSibling; node; node = node.nextSibling) {
        if (isAnchor(node)) {
            if (isAnchor(node, 'start')) depth++;
            else if (depth === 0) break;
            else depth--;
            continue;
        }
        if (node.nodeType === 1) out.push(node as Element);
    }
    return out;
}

/**
 * Keeps the decoration applied to every element between the anchors, also when
 * React replaces an element or rewrites its `class`. Returns a cleanup.
 */
export function decorateAnchored(
    start: Element,
    decoration: RootDecoration,
    onRoots: (roots: Element[]) => void
): () => void {
    const applied = new Map<Element, Applied>();

    const ensure = (el: Element) => {
        let rec = applied.get(el);
        if (!rec) {
            rec = { classes: new Set(), vars: new Map(), attrs: new Map() };
            applied.set(el, rec);
        }
        for (const c of decoration.classes) {
            if (!el.classList.contains(c)) {
                el.classList.add(c);
                rec.classes.add(c);
            }
        }
        const style = (el as HTMLElement).style;
        if (style) {
            for (const [k, v] of Object.entries(decoration.vars)) {
                if (style.getPropertyValue(k) !== v) {
                    if (!rec.vars.has(k)) rec.vars.set(k, style.getPropertyValue(k));
                    style.setProperty(k, v);
                }
            }
        }
        for (const [k, v] of Object.entries(decoration.attrs)) {
            if (el.getAttribute(k) !== v) {
                if (!rec.attrs.has(k)) rec.attrs.set(k, el.getAttribute(k));
                el.setAttribute(k, v);
            }
        }
    };

    const undo = (el: Element, rec: Applied) => {
        rec.classes.forEach((c) => el.classList.remove(c));
        const style = (el as HTMLElement).style;
        rec.vars.forEach((prev, k) => (prev ? style.setProperty(k, prev) : style.removeProperty(k)));
        rec.attrs.forEach((prev, k) => (prev === null ? el.removeAttribute(k) : el.setAttribute(k, prev)));
    };

    let observer: MutationObserver | null = null;

    const sync = () => {
        const current = collectAnchored(start);
        applied.forEach((rec, el) => {
            if (!current.includes(el)) {
                undo(el, rec);
                applied.delete(el);
            }
        });
        current.forEach(ensure);
        onRoots(current);
        if (observer) {
            observer.disconnect();
            if (start.parentNode) observer.observe(start.parentNode, { childList: true });
            current.forEach((el) => observer!.observe(el, { attributes: true, attributeFilter: ['class', 'style'] }));
        }
    };

    if (typeof MutationObserver !== 'undefined') observer = new MutationObserver(sync);
    sync();

    return () => {
        observer?.disconnect();
        applied.forEach((rec, el) => undo(el, rec));
        applied.clear();
        onRoots([]);
    };
}
