import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import * as Lib from 'react-skeletonix';

const Skeleton: any = (Lib as any).default;
const { SkeletonScope, useSkeleton, SkeletonKeep, SkeletonTheme } = Lib as any;
const BASE = 'rgb(240, 240, 240)';
const T = 'rgba(0, 0, 0, 0)';
const results: string[] = [];
let fails = 0;
const check = (name: string, ok: boolean, info = '') => {
    if (!ok) fails++;
    results.push(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ' | ' + info}`);
};
const errors: string[] = [];
const oe = console.error;
console.error = (...a: any[]) => { errors.push(a.map(String).join(' ').slice(0, 200)); oe(...a); };

const el = (id: string) => document.getElementById(id) as HTMLElement;
const cs = (id: string) => getComputedStyle(el(id));
const painted = (id: string) => cs(id).backgroundColor === BASE;
const covered = (id: string) => cs(id).outlineColor === BASE && parseFloat(cs(id).outlineOffset) < 0;

let mounts = 0;
function Stateful() {
    const [n] = useState(() => Math.random());
    useEffect(() => { mounts++; }, []);
    return <div id="stateful" data-n={n}>stateful</div>;
}
const seen: boolean[] = [];
function Reporter() {
    const { loading } = useSkeleton();
    seen.push(loading);
    return <p id="reporter">{loading ? 'placeholder' : 'real'}</p>;
}
function Menu() {
    return createPortal(<SkeletonScope><ul id="menu"><li id="menu-item">Portal item</li></ul></SkeletonScope>, document.getElementById('portal-root')!);
}
const Icon = ({ id }: { id?: string }) => <svg width="14" height="14" id={id}><circle cx="7" cy="7" r="6" /></svg>;

let setLoading: (v: boolean) => void = () => { };
function App() {
    const [loading, set] = useState(true);
    setLoading = set;
    return (
        <div style={{ width: 640, fontFamily: 'sans-serif' }}>
            <Skeleton loading={loading}><div><div id="mixed">12 items <Icon id="icon" /></div></div></Skeleton>
            <Skeleton loading={loading}><div><div id="price">$<b>9</b>.99 <span id="price-unit">/mo</span></div></div></Skeleton>
            <Skeleton loading={loading}><div><div id="loose">Loose title<p id="loose-p">para</p></div></div></Skeleton>
            <div id="inline-host">Name: <Skeleton loading={loading}>{'Amit Kumar'}</Skeleton></div>
            <Skeleton loading={loading}><div><h3 id="empty-h3"></h3><table><tbody><tr><td id="empty-td"></td></tr></tbody></table></div></Skeleton>
            <Skeleton loading={loading} fillEmpty={false}><div><h3 id="nofill-h3"></h3></div></Skeleton>
            <Skeleton loading={loading}><div><p id="multi" style={{ width: 200 }}>Line one of a long paragraph that wraps onto several lines for sure.</p></div></Skeleton>
            <Skeleton loading={loading}><div><canvas id="canvas" width="100" height="40" /><iframe id="iframe" title="f" style={{ width: 100, height: 40, border: 0 }} /></div></Skeleton>
            <Skeleton loading={loading}><div><input id="cb" type="checkbox" defaultChecked /><input id="range" type="range" /><progress id="progress" value={40} max={100} /></div></Skeleton>
            <Skeleton loading={loading}><div><label id="label"><input id="label-cb" type="checkbox" /> Remember me</label></div></Skeleton>
            <Skeleton loading={loading}><div><label id="field" style={{ display: 'flex', flexDirection: 'column' }}>Display name <input id="field-input" /></label></div></Skeleton>
            <Skeleton loading={loading}><div><video id="video" width="120" height="60" controls /></div></Skeleton>
            <Skeleton loading={loading}>
                <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
                    <div id="avatar" style={{ width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>DM</div>
                    <div id="tile" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📈</div>
                    <div id="stretched" style={{ width: 300 }}>Stretched name next to a tall avatar</div>
                </div>
            </Skeleton>
            {(['hidden', 'outlined', 'visible'] as const).map((mode) => (
                <Skeleton key={mode} loading={loading} surfaces={mode}>
                    <div id={`card-${mode}`} style={{ background: 'rgb(0, 0, 128)', border: '2px solid rgb(255, 0, 0)', boxShadow: '0 2px 6px rgb(0, 0, 0)', padding: 12 }}>
                        <p id={`card-${mode}-p`}>Card title</p>
                        <button id={`card-${mode}-btn`} style={{ border: '2px solid rgb(0, 255, 0)' }}>Action</button>
                    </div>
                </Skeleton>
            ))}
            <SkeletonTheme surfaces="visible"><Skeleton loading={loading}><div id="card-theme" style={{ background: 'rgb(0, 0, 128)' }}><p>Themed</p></div></Skeleton></SkeletonTheme>
            <Skeleton loading={loading}><table><tbody><tr><td id="padded-td" style={{ padding: 16 }}>Padded cell</td></tr></tbody></table></Skeleton>
            <Skeleton loading={loading}><div><img id="nosrc" alt="" style={{ width: 40, height: 40, borderRadius: '50%' }} /><img id="broken" alt="broken" src="does-not-exist.png" style={{ width: 40, height: 40 }} /></div></Skeleton>
            <Skeleton loading={loading}><div><label id="lbl-switch" style={{ display: 'flex', justifyContent: 'space-between' }}><span>Notifications</span><span id="sw" className="sk-pill" style={{ display: 'inline-block', width: 44, height: 24 }}><input type="checkbox" style={{ position: 'absolute', opacity: 0 }} /></span></label></div></Skeleton>
            <Skeleton loading={loading}><div className="user"><div id="empty-div"></div><span id="empty-span"></span><div id="sized-div" style={{ width: 30, height: 30 }} /></div></Skeleton>
            <Skeleton loading={loading}><div><button id="btn"><Icon id="btn-icon" /> 12</button></div></Skeleton>
            <Skeleton loading={loading}><div><div id="emoji">🎬 Movies</div></div></Skeleton>
            <Skeleton loading={loading}><section id="host"><Stateful /></section></Skeleton>
            <Skeleton loading={loading}><div><Reporter /></div></Skeleton>
            <Skeleton loading={loading}><div><Menu /></div></Skeleton>
            <Skeleton loading={loading}>
                <div>
                    <Skeleton loading={false}><p id="nested-inner">inner loaded</p></Skeleton>
                </div>
            </Skeleton>
            <Skeleton loading={loading}>
                <div className="toolbar"><h4 id="tb-title">Title</h4><SkeletonKeep><button id="kept-btn" style={{ color: 'rgb(0, 0, 255)' }}>Cancel</button></SkeletonKeep></div>
            </Skeleton>
        </div>
    );
}

// Many rows, to catch pathological slowness in the DOM passes.
function BigTable({ loading }: { loading: boolean }) {
    return (
        <table><tbody>
            <Skeleton loading={loading} count={300} showWrapper={false}>
                {() => <Row />}
            </Skeleton>
        </tbody></table>
    );
}
function Row() {
    return (
        <tr>
            <td><input type="checkbox" /></td>
            <td><img width="24" height="24" alt="" /> <span>Customer name</span></td>
            <td>12 items <Icon /></td>
            <td><span className="pill">Paid</span></td>
        </tr>
    );
}

const root = createRoot(document.getElementById('root')!);
flushSync(() => root.render(<App />));

setTimeout(() => {
    check('mixed text + icon is one text line', el('mixed').dataset.skx === 't' && painted('mixed'));
    check('icon inside that line not painted twice', cs('icon').backgroundColor === T);
    check('price with <b> and <span> is one line', painted('price') && cs('price-unit').backgroundColor === T);
    check('text next to block children not over-painted', el('loose').dataset.skx !== 't' && painted('loose-p'));
    const inline = el('inline-host').querySelector('.skx-loading') as HTMLElement;
    check('bare text child becomes an inline line', inline?.tagName === 'SPAN' && getComputedStyle(inline).backgroundColor === BASE);
    check('empty h3 still shows a line', el('empty-h3').getBoundingClientRect().height > 10 && painted('empty-h3'));
    check('empty td still shows a line', el('empty-td').getBoundingClientRect().height > 10);
    check('fillEmpty={false} leaves empty h3 empty', el('nofill-h3').getBoundingClientRect().height === 0);
    check('multi-line paragraph drawn as lines', cs('multi').maskImage.includes('repeating-linear-gradient') || (cs('multi') as any).webkitMaskImage?.includes('repeating'));
    check('canvas covered by a block', covered('canvas'));
    check('iframe covered by a block', covered('iframe'));
    check('checkbox covered', covered('cb'));
    check('range covered', covered('range'));
    check('progress covered', covered('progress'));
    const hl = (CSS as any).highlights?.get('skx-text');
    const highlighted = (id: string) => !!hl && Array.from(hl as Set<Range>).some((r) => el(id).contains(r.startContainer));
    check('checkbox in a label is its own block', covered('label-cb') && !painted('label'));
    check('label text next to a checkbox is highlighted', highlighted('label'));
    check('label wrapping an input: input is a block, label text highlighted', painted('field-input') && !painted('field') && highlighted('field'));
    check('text next to block children is highlighted', highlighted('loose'));
    check('video covered by a block (controls hidden)', covered('video'));
    const masked = (id: string) => cs(id).maskImage !== 'none' || ((cs(id) as any).webkitMaskImage ?? 'none') !== 'none';
    check('round avatar with initials is one solid shape', el('avatar').dataset.skx === 'b' && painted('avatar') && !masked('avatar') && cs('avatar').borderTopLeftRadius === '50%');
    check('square icon tile with emoji is one solid shape', el('tile').dataset.skx === 'b');
    check('wide stretched text stays a text line', el('stretched').dataset.skx === 't');
    check('padded table cell stays a text line', el('padded-td').dataset.skx === 't');
    check('multi-line paragraph stays text lines', el('multi').dataset.skx === 't');
    check('surfaces="hidden": card background and border hidden', cs('card-hidden').backgroundColor === T && cs('card-hidden').borderTopColor === T);
    check('surfaces="outlined": card border kept, background hidden', cs('card-outlined').borderTopColor === 'rgb(255, 0, 0)' && cs('card-outlined').backgroundColor === T && cs('card-outlined').boxShadow === 'none');
    check('surfaces="visible": card background, border and shadow kept', cs('card-visible').backgroundColor === 'rgb(0, 0, 128)' && cs('card-visible').borderTopColor === 'rgb(255, 0, 0)' && cs('card-visible').boxShadow !== 'none');
    check('surfaces: content inside is still a skeleton', painted('card-visible-p') && painted('card-outlined-p') && cs('card-visible-p').color === T);
    check('surfaces: painted blocks lose their own border', painted('card-visible-btn') && cs('card-visible-btn').borderTopColor === T && cs('card-outlined-btn').borderTopColor === T);
    check('surfaces works through SkeletonTheme', cs('card-theme').backgroundColor === 'rgb(0, 0, 128)');
    check('image without src: block without broken frame', el('nosrc').dataset.skx === 'i' && cs('nosrc').content.includes('url(') && painted('nosrc'));
    check('image that failed to load: block without broken icon', el('broken').dataset.skx === 'i' && cs('broken').content.includes('url('), String(el('broken').dataset.skx));
    check('label containing a switch shape is not one text block', el('lbl-switch').dataset.skx !== 't' && el('sw').dataset.skx === 'b');
    check('empty div (missing data) shows a line', el('empty-div').dataset.skx === 'f' && el('empty-div').getBoundingClientRect().height > 10);
    check('empty span (missing data) shows a line', el('empty-span').dataset.skx === 'f' && el('empty-span').getBoundingClientRect().width > 20);
    check('sized empty div stays a placeholder block', el('sized-div').dataset.skx === 'e' && painted('sized-div'));
    check('button with icon + count is one block', painted('btn') && cs('btn-icon').backgroundColor === T);
    check('emoji hidden', cs('emoji').color === T && painted('emoji'));
    check('useSkeleton() is true while loading', seen[seen.length - 1] === true && el('reporter').textContent === 'placeholder');
    check('SkeletonScope masks portal content', painted('menu-item'));
    check('nested loaded skeleton still masked by outer', painted('nested-inner'));
    check('SkeletonKeep button visible inside masked toolbar', cs('kept-btn').color === 'rgb(0, 0, 255)' && painted('tb-title'));

    const hostNode = el('host');
    const statefulN = el('stateful').dataset.n;
    const m0 = mounts;
    flushSync(() => setLoading(false));
    setTimeout(() => {
        check('single element child not remounted on load', el('host') === hostNode && el('stateful').dataset.n === statefulN && mounts === m0, `mounts +${mounts - m0}`);
        check('useSkeleton() is false after loading', el('reporter').textContent === 'real');
        check('portal content plain after loading', cs('menu-item').backgroundColor === T);
        check('loose-text highlights removed after loading', !(CSS as any).highlights?.get('skx-text'));
        check('text marks removed after loading', document.querySelectorAll('[data-skx], [data-skx-ready]').length === 0);
        check('inline text root gone after loading', el('inline-host').textContent === 'Name: Amit Kumar' && !el('inline-host').querySelector('span'));

        // Performance smoke test
        const perfRoot = createRoot(document.getElementById('perf')!);
        const t0 = performance.now();
        flushSync(() => perfRoot.render(<BigTable loading />));
        const t1 = performance.now();
        const rows = document.querySelectorAll('#perf tr.skx-loading').length;
        check('300-row table (anchor mode) renders and decorates', rows === 300 && t1 - t0 < 2000, `rows=${rows}`);
        const t2 = performance.now();
        flushSync(() => perfRoot.render(<BigTable loading={false} />));
        check('300-row table unloads cleanly', document.querySelectorAll('#perf .skx-loading, #perf [inert]').length === 0);

        check('no React errors', errors.length === 0, errors.join(' || '));
        results.push(`\n${results.length - fails}/${results.length} passed`);
        const pre = document.createElement('pre');
        pre.id = 'RESULT';
        pre.textContent = results.join('\n');
        document.body.appendChild(pre);
    }, 200);
}, 400);
