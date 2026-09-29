/**
 * Loose text, i.e. text next to block-level children such as
 * <label>Name <input/></label> or <div>Title<p>...</p></div>, cannot be drawn
 * by painting its parent (that would cover the children) and must not be
 * moved into new elements (React owns those nodes). Instead it is drawn with
 * the CSS Custom Highlight API: ::highlight(skx-text) paints a bar behind
 * exactly those characters, without touching the DOM. Browsers without the
 * API leave that text invisible.
 */

const NAME = 'skx-text';
const byOwner = new Map<object, Range[]>();

const supported = () =>
    typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined';

function toRange(node: Text): Range {
    const text = node.nodeValue ?? '';
    const start = text.length - text.trimStart().length;
    const end = text.trimEnd().length;
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, Math.max(start, end));
    return range;
}

/** Replaces the loose text drawn for one skeleton (empty list to remove). */
export function setLooseText(owner: object, nodes: Text[]): void {
    if (!supported()) return;
    if (nodes.length) byOwner.set(owner, nodes.map(toRange));
    else if (!byOwner.delete(owner)) return;

    const ranges = Array.from(byOwner.values()).flat();
    if (ranges.length) CSS.highlights.set(NAME, new Highlight(...ranges));
    else CSS.highlights.delete(NAME);
}
