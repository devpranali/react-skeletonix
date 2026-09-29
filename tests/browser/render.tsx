import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import * as Lib from 'react-skeletonix';

const Skeleton: any = (Lib as any).default;
const results: string[] = [];
let fails = 0;
const check = (name: string, ok: boolean, info = '') => {
    if (!ok) fails++;
    results.push(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ' | ' + info}`);
};
const errors: string[] = [];
const origErr = console.error;
console.error = (...a: any[]) => { errors.push(a.map(String).join(' ').slice(0, 200)); origErr(...a); };

const Row = ({ label }: { label: string }) => <tr className="row"><td>{label}</td></tr>;
const Card = ({ v }: { v: string }) => <div className="card">{v}</div>;
function WithHook() { const [s] = useState('hooked'); return <p className="hooked">{s}</p>; }

const refs: Record<string, any> = {};
let setLoadingAll: (v: boolean) => void = () => { };

function App() {
    const [loading, setLoading] = useState(true);
    setLoadingAll = setLoading;
    refs.fwd = useRef<HTMLElement>(null);
    refs.fwdFn = useRef<HTMLElement>(null);
    refs.child = useRef<HTMLElement>(null);
    return (
        <div>
            <div id="c1"><Skeleton loading={loading} data={{ name: 'obj' }}>{(i: any) => <span className="item">{i?.name ?? 'x'}</span>}</Skeleton></div>
            <div id="c2"><Skeleton loading={loading} randomWidth data={[1, 2]}>{(i: any) => <p key={`k${i}`} className="p">{i}</p>}</Skeleton></div>
            <div id="c3"><Skeleton loading={loading} count={3} id="only-once" data-testid="t"><div className="x">x</div></Skeleton></div>
            <div id="c4"><Skeleton loading={loading} showWrapper={false}><Card v="card" /></Skeleton></div>
            <table><tbody id="c5"><Skeleton loading={loading} showWrapper={false} count={2}><Row label="row" /></Skeleton></tbody></table>
            <div id="c6"><Skeleton loading={loading} ref={refs.fwd}><section className="host">host</section></Skeleton></div>
            <div id="c7"><Skeleton loading={loading} ref={refs.fwdFn}>{() => <Card v="fn" />}</Skeleton></div>
            <div id="c8"><Skeleton loading={loading}><article ref={refs.child} className="own">own ref</article></Skeleton></div>
            <div id="c9"><Skeleton loading={loading} showWrapper={false}>plain text</Skeleton></div>
            <div id="c10"><Skeleton loading={loading}><WithHook /></Skeleton></div>
            <div id="c11"><Skeleton loading={loading} data={[{ id: 'a' }, { id: 'b' }]}>{(i: any) => <Card key={i?.id} v={i?.id ?? '-'} />}</Skeleton></div>
            <div id="c12"><Skeleton loading={loading} className="mine" style={{ outline: '1px solid red' }}><div className="inner">x</div></Skeleton></div>
        </div>
    );
}

const q = (s: string) => document.querySelector(s) as HTMLElement | null;
const qa = (s: string) => Array.from(document.querySelectorAll(s)) as HTMLElement[];
const root = createRoot(document.getElementById('root')!);
flushSync(() => root.render(<App />));

// ---- loading state ----
check('c1 loading renders placeholder', q('#c1 .skx-loading') !== null);
check('c3 id only on first copy', qa('#c3 #only-once').length === 1 && qa('#c3 [data-testid]').length === 1, `ids=${qa('#c3 #only-once').length}`);
check('c3 three copies', qa('#c3 .skx-loading').length === 3);
check('c3 stagger delays', qa('#c3 .skx-loading').map(e => e.style.getPropertyValue('--skx-delay')).join() === '0s,0.1s,0.2s', qa('#c3 .skx-loading').map(e => e.style.getPropertyValue('--skx-delay')).join());
check('c3 inert + aria-busy, no aria-live', qa('#c3 .skx-loading').every(e => e.hasAttribute('inert') && e.getAttribute('aria-busy') === 'true' && !e.hasAttribute('aria-live')));
check('c4 no wrapper div, card is root', q('#c4 > .card.skx-loading') !== null && q('#c4 .skx-wrapper') === null, q('#c4')!.innerHTML);
check('c4 anchor root inert', q('#c4 > .card')!.hasAttribute('inert'));
check('c5 rows decorated inside tbody', qa('#c5 > tr.row.skx-loading').length === 2 && qa('#c5 div').length === 0, q('#c5')!.innerHTML);
check('c5 row delay var set', qa('#c5 > tr.row')[1]?.style.getPropertyValue('--skx-delay') === '0.1s');
check('c6 forwarded ref = host root', refs.fwd.current?.tagName === 'SECTION');
check('c7 forwarded ref works with render function', refs.fwdFn.current !== null, String(refs.fwdFn.current));
check('c8 child own ref kept', refs.child.current?.tagName === 'ARTICLE');
check('c9 text child gets an inline span root', q('#c9 > span.skx-loading') !== null);
check('c12 className/style on root while loading', q('#c12 .mine.skx-loading') !== null);

const w1 = q('#c2 .skx-loading')!.style.getPropertyValue('--skx-w1');
flushSync(() => setLoadingAll(true));
check('random width stable across re-render', q('#c2 .skx-loading')!.style.getPropertyValue('--skx-w1') === w1 && w1 !== '');

// ---- loaded state ----
flushSync(() => setLoadingAll(false));
setTimeout(() => {
    check('c1 object data does not crash', q('#c1 .item')?.textContent === 'obj', q('#c1')!.innerHTML);
    check('no skx classes left anywhere', qa('[class*="skx-"]').length === 0, qa('[class*="skx-"]').map(e => e.outerHTML.slice(0, 80)).join(' || '));
    check('no inert/aria-busy left', qa('[inert],[aria-busy]').length === 0);
    check('c2 loaded p has no wrapper', q('#c2 > p.p') !== null, q('#c2')!.innerHTML);
    check('c4 anchor mode cleaned up', q('#c4 .card')!.getAttribute('style') === null && q('#c4 .card')!.className === 'card', q('#c4')!.innerHTML);
    check('c5 rows cleaned', qa('#c5 tr.row').length === 1 && q('#c5 tr.row')!.className === 'row');
    check('c6 forwarded ref cleared', refs.fwd.current === null);
    check('c8 child ref points to real element', refs.child.current?.tagName === 'ARTICLE');
    check('c10 hook component survives toggle', q('#c10 .hooked')?.textContent === 'hooked');
    check('c11 loaded list rendered', qa('#c11 .card').map(e => e.textContent).join() === 'a,b');
    check('no React errors/warnings', errors.length === 0, errors.join(' || '));

    // toggle back to loading and again to loaded
    flushSync(() => setLoadingAll(true));
    check('back to loading re-decorates anchors', q('#c4 > .card.skx-loading') !== null);
    flushSync(() => setLoadingAll(false));
    check('second unload cleans again', qa('[class*="skx-"]').length === 0);

    results.push(`\n${results.length - fails}/${results.length} passed`);
    const pre = document.createElement('pre');
    pre.id = 'RESULT';
    pre.textContent = results.join('\n');
    document.body.appendChild(pre);
}, 300);
