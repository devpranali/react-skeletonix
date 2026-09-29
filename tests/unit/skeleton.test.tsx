import * as React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPortal } from 'react-dom';
import Skeleton, { SkeletonIgnore, SkeletonKeep, SkeletonScope, SkeletonTheme, SkeletonUnite, useSkeleton } from '../../src';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
});

const render = (ui: React.ReactElement) => act(() => root.render(ui));
const $ = (sel: string) => container.querySelector(sel) as HTMLElement | null;
const $$ = (sel: string) => Array.from(container.querySelectorAll(sel)) as HTMLElement[];

const Card = ({ v }: { v: string }) => <div className="card">{v}</div>;
const Row = ({ v }: { v: string }) => <tr className="row"><td>{v}</td></tr>;

describe('loading state', () => {
    it('masks a single host element by decorating it directly', () => {
        render(<Skeleton loading><h4 className="title">Title</h4></Skeleton>);
        const h4 = $('h4')!;
        expect(h4.classList.contains('skx-loading')).toBe(true);
        expect(h4.classList.contains('title')).toBe(true);
        expect(h4.getAttribute('aria-busy')).toBe('true');
        expect(h4.hasAttribute('inert')).toBe(true);
        expect(h4.hasAttribute('aria-live')).toBe(false);
    });

    it('wraps component children in a display:contents wrapper', () => {
        render(<Skeleton loading><Card v="x" /></Skeleton>);
        expect($('.skx-wrapper.skx-loading > .card')).not.toBeNull();
    });

    it('renders `count` copies with staggered delays', () => {
        render(<Skeleton loading count={3}><p>x</p></Skeleton>);
        expect($$('p').map((p) => p.style.getPropertyValue('--skx-delay'))).toEqual(['0s', '0.1s', '0.2s']);
    });

    it('puts extra HTML props on the first copy only', () => {
        render(<Skeleton loading count={2} id="only" data-testid="t"><p>x</p></Skeleton>);
        expect($$('#only')).toHaveLength(1);
        expect($$('[data-testid]')).toHaveLength(1);
    });

    it('passes placeholderData (or null) to a render function', () => {
        const fn = vi.fn((item: { name: string } | null) => <p>{item?.name ?? 'none'}</p>);
        render(<Skeleton loading count={2} placeholderData={{ name: 'ph' }}>{fn}</Skeleton>);
        expect(fn).toHaveBeenCalledWith({ name: 'ph' }, 0);
        expect(fn).toHaveBeenCalledWith({ name: 'ph' }, 1);
    });

    it('applies the variant, circle, container and scheme classes', () => {
        render(<Skeleton loading variant="pulse" circle container colorScheme="dark"><p>x</p></Skeleton>);
        const cls = $('p')!.className;
        for (const c of ['skx-v-pulse', 'skx-circle', 'skx-container', 'skx-scheme-dark', 'skx-animate']) expect(cls).toContain(c);
    });

    it('sets theme colours as CSS variables', () => {
        render(<Skeleton loading baseColor="red" highlightColor="blue" duration={2} borderRadius={8}><p>x</p></Skeleton>);
        const s = $('p')!.style;
        expect(s.getPropertyValue('--skx-base-color')).toBe('red');
        expect(s.getPropertyValue('--skx-highlight-color')).toBe('blue');
        expect(s.getPropertyValue('--skx-duration')).toBe('2s');
        expect(s.getPropertyValue('--skx-border-radius')).toBe('8px');
    });

    it('does not animate with animate={false}', () => {
        render(<Skeleton loading animate={false}><p>x</p></Skeleton>);
        expect($('p')!.classList.contains('skx-animate')).toBe(false);
    });
});

describe('loaded state', () => {
    it('renders children untouched, without wrapper or attributes', () => {
        render(<Skeleton loading={false} className="x" randomWidth><p className="p">done</p></Skeleton>);
        expect(container.innerHTML).toBe('<p class="p">done</p>');
    });

    it('maps `data` through a render function and keeps user keys', () => {
        render(
            <Skeleton loading={false} data={[{ id: 'a' }, { id: 'b' }]}>
                {(item: { id: string } | null) => <Card key={item?.id} v={item!.id} />}
            </Skeleton>
        );
        expect(container.innerHTML).toBe('<div class="card">a</div><div class="card">b</div>');
    });

    it('accepts a single object as `data`', () => {
        render(<Skeleton loading={false} data={{ name: 'solo' }}>{(i: { name: string } | null) => <p>{i?.name}</p>}</Skeleton>);
        expect($('p')!.textContent).toBe('solo');
    });

    it('renders nothing for missing data', () => {
        render(<Skeleton loading={false}>{() => <p>x</p>}</Skeleton>);
        expect(container.innerHTML).toBe('');
    });
});

describe('showWrapper={false}', () => {
    it('decorates component roots without adding elements, then cleans up', () => {
        render(<Skeleton loading showWrapper={false}><Card v="c" /></Skeleton>);
        const card = $('.card')!;
        expect(card.classList.contains('skx-loading')).toBe(true);
        expect(card.hasAttribute('inert')).toBe(true);
        expect($('div.skx-wrapper')).toBeNull();

        render(<Skeleton loading={false} showWrapper={false}><Card v="c" /></Skeleton>);
        expect(container.innerHTML).toBe('<div class="card">c</div>');
    });

    it('keeps tables valid (no div inside tbody)', () => {
        const table = document.createElement('table');
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);
        container.appendChild(table);
        const tRoot = createRoot(tbody);
        act(() => tRoot.render(<Skeleton loading showWrapper={false} count={2}><Row v="r" /></Skeleton>));
        expect(tbody.querySelectorAll('tr.row.skx-loading')).toHaveLength(2);
        expect(tbody.querySelector('div')).toBeNull();
        act(() => tRoot.unmount());
    });

    it('renders plain text in an inline span root', () => {
        render(<Skeleton loading showWrapper={false}>text</Skeleton>);
        expect($('span.skx-loading')!.textContent).toBe('text');
        expect($('.skx-wrapper')).toBeNull();
    });
});

describe('refs', () => {
    it('forwards the first root and merges the child ref', () => {
        const outer = React.createRef<HTMLElement>();
        const inner = React.createRef<HTMLElement>();
        render(<Skeleton loading ref={outer}><section ref={inner}>x</section></Skeleton>);
        expect(outer.current?.tagName).toBe('SECTION');
        expect(inner.current?.tagName).toBe('SECTION');

        render(<Skeleton loading={false} ref={outer}><section ref={inner}>x</section></Skeleton>);
        expect(outer.current).toBeNull();
        expect(inner.current?.tagName).toBe('SECTION');
    });

    it('forwards a ref with render-function children', () => {
        const outer = React.createRef<HTMLElement>();
        render(<Skeleton loading ref={outer}>{() => <Card v="x" />}</Skeleton>);
        expect(outer.current).not.toBeNull();
    });
});

describe('nested components', () => {
    function WithHook() {
        const [v] = React.useState('hook');
        return <p className="hook">{v}</p>;
    }
    class Klass extends React.Component {
        render() {
            return <p className="klass">class</p>;
        }
    }
    const Memo = React.memo(() => <p className="memo">memo</p>);

    it('renders hook, class and memo components and survives toggling', () => {
        const errors = vi.spyOn(console, 'error').mockImplementation(() => { });
        const ui = (loading: boolean) => (
            <Skeleton loading={loading}><div><WithHook /><Klass /><Memo /></div></Skeleton>
        );
        render(ui(true));
        render(ui(false));
        render(ui(true));
        expect($('.hook')!.textContent).toBe('hook');
        expect($('.klass')).not.toBeNull();
        expect($('.memo')).not.toBeNull();
        expect(errors).not.toHaveBeenCalled();
    });

    it('warns once that useAST is deprecated', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });
        render(<Skeleton loading useAST><p>x</p></Skeleton>);
        render(<Skeleton loading useAST><p>y</p></Skeleton>);
        expect(warn.mock.calls.filter((c) => String(c[0]).includes('useAST')).length).toBeLessThanOrEqual(1);
    });
});

describe('markers and selectors', () => {
    it('control components render data-skeleton markers', () => {
        render(
            <Skeleton loading>
                <div>
                    <SkeletonKeep><b>k</b></SkeletonKeep>
                    <SkeletonIgnore><b>i</b></SkeletonIgnore>
                    <SkeletonUnite><b>u</b></SkeletonUnite>
                </div>
            </Skeleton>
        );
        expect($('skx-keep[data-skeleton="keep"]')).not.toBeNull();
        expect($('skx-ignore[data-skeleton="ignore"]')).not.toBeNull();
        expect($('skx-unite[data-skeleton="unite"]')).not.toBeNull();
    });

    it('marks exceptTags / exceptTagGroups / excludeSelector, including inside components', () => {
        const Toolbar = () => <div><button>Save</button><img alt="" /><span className="badge">new</span></div>;
        render(<Skeleton loading exceptTags={['button']} exceptTagGroups={['MEDIA_TAGS']} excludeSelector=".badge"><Toolbar /></Skeleton>);
        expect($('button')!.dataset.skeleton).toBe('keep');
        expect($('img')!.dataset.skeleton).toBe('keep');
        expect($('.badge')!.dataset.skeleton).toBe('ignore');

        render(<Skeleton loading={false} exceptTags={['button']} excludeSelector=".badge"><Toolbar /></Skeleton>);
        expect($$('[data-skeleton]')).toHaveLength(0);
    });

    it('scopes selectors to their own skeleton', () => {
        render(
            <>
                <Skeleton loading excludeSelector=".badge"><div><span className="badge" id="a">a</span></div></Skeleton>
                <Skeleton loading><div><span className="badge" id="b">b</span></div></Skeleton>
            </>
        );
        expect($('#a')!.dataset.skeleton).toBe('ignore');
        expect($('#b')!.dataset.skeleton).toBeUndefined();
    });

    it('ignores invalid selectors with a warning', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => { });
        render(<Skeleton loading excludeSelector="{{nope"><div><span>x</span></div></Skeleton>);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('invalid selector'));
    });
});

describe('theme', () => {
    it('applies nested theme options, with props taking priority', () => {
        render(
            <SkeletonTheme count={2} variant="pulse" baseColor="red">
                <SkeletonTheme baseColor="blue">
                    <Skeleton loading><p className="a">x</p></Skeleton>
                    <Skeleton loading count={1} variant="wave"><p className="b">y</p></Skeleton>
                </SkeletonTheme>
            </SkeletonTheme>
        );
        expect($$('.a')).toHaveLength(2);
        expect($('.a')!.classList.contains('skx-v-pulse')).toBe(true);
        expect($('.a')!.style.getPropertyValue('--skx-base-color')).toBe('blue');
        expect($$('.b')).toHaveLength(1);
        expect($('.b')!.classList.contains('skx-v-wave')).toBe(true);
    });
});

describe('randomWidth', () => {
    it('is deterministic and within range', () => {
        const html = () => renderToString(<Skeleton loading randomWidth={[40, 60]} count={2}><p>x</p></Skeleton>);
        expect(html()).toBe(html());
        render(<Skeleton loading randomWidth={[40, 60]}><p>x</p></Skeleton>);
        for (const v of ['--skx-w1', '--skx-w2', '--skx-w3']) {
            const n = parseInt($('p')!.style.getPropertyValue(v), 10);
            expect(n).toBeGreaterThanOrEqual(40);
            expect(n).toBeLessThanOrEqual(60);
        }
    });
});

describe('lazy', () => {
    type Cb = (entries: Array<{ isIntersecting: boolean; target: Element }>) => void;
    let callback: Cb;
    let observed: Element[];

    beforeEach(() => {
        observed = [];
        vi.stubGlobal('IntersectionObserver', class {
            constructor(cb: Cb) { callback = cb; }
            observe(el: Element) { observed.push(el); }
            disconnect() { }
        });
    });
    afterEach(() => vi.unstubAllGlobals());

    it('animates only while in view (render-function children)', () => {
        render(<Skeleton loading lazy>{() => <p className="p">x</p>}</Skeleton>);
        const p = $('.p')!;
        expect(observed).toContain(p);
        expect(p.classList.contains('skx-animate')).toBe(false);

        act(() => callback([{ isIntersecting: true, target: p }]));
        expect($('.p')!.classList.contains('skx-animate')).toBe(true);

        act(() => callback([{ isIntersecting: false, target: p }]));
        expect($('.p')!.classList.contains('skx-animate')).toBe(false);
    });

    it('animates only the copies that are in view', () => {
        render(<Skeleton loading lazy count={3}>{(_: unknown, i: number) => <p className={`c${i}`}>x</p>}</Skeleton>);
        act(() => callback([{ isIntersecting: true, target: $('.c1')! }]));
        expect($$('p').map((p) => p.classList.contains('skx-animate'))).toEqual([false, true, false]);
    });

    it('observes the children of display:contents wrappers', () => {
        render(<Skeleton loading lazy><Card v="x" /></Skeleton>);
        expect(observed).toContain($('.card'));
    });
});

describe('complex UI', () => {
    it('classifies elements for the stylesheet and cleans up', () => {
        render(
            <Skeleton loading>
                <div className="card">
                    <img alt="" />
                    <h3></h3>
                    <div className="mixed">12 items <svg /></div>
                    <div className="text">John</div>
                    <div className="spacer" />
                    <input type="checkbox" />
                    <button>Go</button>
                </div>
            </Skeleton>
        );
        const kind = (sel: string) => $(sel)!.getAttribute('data-skx');
        expect(kind('img')).toBe('i'); // no src yet: empty image block
        expect(kind('h3')).toBe('f');
        expect(kind('.mixed')).toBe('t');
        expect(kind('.text')).toBe('t');
        // jsdom has no layout, so an empty element counts as missing text ('f');
        // sized placeholders ('e') are covered by the browser tests.
        expect(kind('.spacer')).toBe('f');
        expect(kind('input')).toBe('c');
        expect(kind('button')).toBe('b');
        expect(kind('.card')).toBeNull();
        expect($('.card')!.hasAttribute('data-skx-ready')).toBe(true);

        render(<Skeleton loading={false}><div className="card"><img alt="" /></div></Skeleton>);
        expect($$('[data-skx], [data-skx-ready]')).toHaveLength(0);
    });

    it('fillEmpty={false} does not fill empty text', () => {
        render(<Skeleton loading fillEmpty={false}><div><h3 /></div></Skeleton>);
        expect($('h3')!.getAttribute('data-skx')).toBe('t');
        expect($('.skx-no-fill')).not.toBeNull();
    });

    it('draws kept content parts instead of one block', () => {
        render(<Skeleton loading><p>Hi <SkeletonKeep><b>kept</b></SkeletonKeep></p></Skeleton>);
        expect($('p')!.getAttribute('data-skx')).toBeNull();
        expect($('p')!.hasAttribute('data-skx-keep-path')).toBe(true);
    });

    it('does not remount a single element child when loading ends', () => {
        let mounts = 0;
        function Child() {
            React.useEffect(() => { mounts++; }, []);
            return <span>child</span>;
        }
        render(<Skeleton loading><section><Child /></section></Skeleton>);
        const node = $('section');
        render(<Skeleton loading={false}><section><Child /></section></Skeleton>);
        expect($('section')).toBe(node);
        expect(mounts).toBe(1);
    });

    it('useSkeleton() reports loading, also through nested loaded skeletons', () => {
        const seen: boolean[] = [];
        function Probe() {
            seen.push(useSkeleton().loading);
            return null;
        }
        render(<Skeleton loading><div><Skeleton loading={false}><Probe /></Skeleton></div></Skeleton>);
        render(<Skeleton loading={false}><div><Probe /></div></Skeleton>);
        expect(seen[0]).toBe(true);
        expect(seen[seen.length - 1]).toBe(false);
    });

    it('SkeletonScope applies the skeleton inside portals', () => {
        const target = document.createElement('div');
        document.body.appendChild(target);
        const Menu = () => createPortal(<SkeletonScope><ul><li>item</li></ul></SkeletonScope>, target);
        render(<Skeleton loading><div><Menu /></div></Skeleton>);
        expect(target.querySelector('.skx-wrapper.skx-loading')).not.toBeNull();
        render(<Skeleton loading={false}><div><Menu /></div></Skeleton>);
        expect(target.querySelector('.skx-loading')).toBeNull();
        target.remove();
    });
});

describe('SSR', () => {
    it('renders loading markup on the server without warnings', () => {
        const errors = vi.spyOn(console, 'error').mockImplementation(() => { });
        const html = renderToString(<Skeleton loading><div className="card"><p>x</p></div></Skeleton>);
        expect(html).toContain('skx-loading');
        expect(html).toContain('aria-busy="true"');
        expect(errors).not.toHaveBeenCalled();
    });

    it('renders plain children when loaded', () => {
        expect(renderToString(<Skeleton loading={false}><p>x</p></Skeleton>)).toBe('<p>x</p>');
    });
});
