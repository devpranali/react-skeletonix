import React, { useState, memo, forwardRef, Component } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import * as Lib from 'react-skeletonix';

const Skeleton: any = (Lib as any).default;
const { SkeletonKeep, SkeletonIgnore, SkeletonUnite } = Lib as any;
const BASE = 'rgb(240, 240, 240)';
const T = 'rgba(0, 0, 0, 0)';
const results: string[] = [];
let fails = 0;
const check = (name: string, ok: boolean, info = '') => {
    if (!ok) fails++;
    results.push(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ' | ' + info}`);
};
const errors: string[] = [];
const warns: string[] = [];
const oe = console.error, ow = console.warn;
console.error = (...a: any[]) => { errors.push(a.map(String).join(' ').slice(0, 200)); oe(...a); };
console.warn = (...a: any[]) => { warns.push(a.map(String).join(' ').slice(0, 200)); ow(...a); };

function WithHook() { const [s] = useState('hook'); return <p id="hook">{s}</p>; }
class Klass extends Component { render() { return <p id="klass">class</p>; } }
const Memo = memo(() => <p id="memo">memo</p>);
const Fwd = forwardRef<HTMLParagraphElement>((_p, ref) => <p id="fwd" ref={ref}>fwd</p>);
const Toolbar = () => <div><button id="tb-btn" style={{ background: 'rgb(0, 0, 255)', color: 'rgb(255, 255, 255)' }}>Save</button><span id="tb-span">label</span></div>;

let setLoadingAll: (v: boolean) => void = () => { };
function App() {
    const [loading, setLoading] = useState(true);
    setLoadingAll = setLoading;
    return (
        <div style={{ width: 500 }}>
            <Skeleton loading={loading} useAST><div><WithHook /><Klass /><Memo /><Fwd /></div></Skeleton>
            <Skeleton loading={loading} exceptTags={['button']}><Toolbar /></Skeleton>
            <Skeleton loading={loading} exceptTagGroups={['MEDIA_TAGS']}><div><img id="media" width="20" height="20" src="data:image/gif;base64,R0lGODlhAQABAIAAAP8AAP///ywAAAAAAQABAAACAkQBADs=" /></div></Skeleton>
            <Skeleton loading={loading} excludeSelector=".badge"><div><span className="badge" id="badge1">NEW</span><span id="name1">Name</span></div></Skeleton>
            <Skeleton loading={loading}><div><span className="badge" id="badge2">NEW</span></div></Skeleton>
            <Skeleton loading={loading} excludeSelector="{{bad"><div><span id="bad">x</span></div></Skeleton>
            <Skeleton loading={loading}>
                <div>
                    <SkeletonKeep><div id="keep" style={{ background: 'rgb(0, 128, 0)' }}>kept text</div></SkeletonKeep>
                    <SkeletonIgnore><div id="ignore" style={{ height: 30 }}>ignored</div></SkeletonIgnore>
                    <SkeletonUnite><div id="unite" style={{ padding: 10 }}><p id="unite-p">a</p><p>b</p></div></SkeletonUnite>
                </div>
            </Skeleton>
        </div>
    );
}

const q = (s: string) => document.getElementById(s) as HTMLElement;
const cs = (s: string) => getComputedStyle(q(s));
const root = createRoot(document.getElementById('root')!);
flushSync(() => root.render(<App />));

setTimeout(() => {
    check('hook component masked', cs('hook').backgroundColor === BASE && cs('hook').color === T);
    check('class component masked', cs('klass').backgroundColor === BASE);
    check('memo component masked', cs('memo').backgroundColor === BASE && cs('memo').color === T);
    check('forwardRef component masked', cs('fwd').backgroundColor === BASE);
    check('exceptTags keeps button inside a component', cs('tb-btn').backgroundColor === 'rgb(0, 0, 255)' && cs('tb-btn').color === 'rgb(255, 255, 255)', cs('tb-btn').backgroundColor);
    check('exceptTags: other tags still masked', cs('tb-span').backgroundColor === BASE);
    check('exceptTagGroups keeps img pixels', cs('media').objectPosition !== '-99999px -99999px', cs('media').objectPosition);
    check('excludeSelector hides match, keeps space', cs('badge1').visibility === 'hidden' && q('badge1').getBoundingClientRect().width > 0);
    check('excludeSelector scoped to its own skeleton', cs('badge2').visibility === 'visible' && cs('badge2').backgroundColor === BASE);
    check('invalid selector warns, no crash', warns.some(w => w.includes('invalid selector')) && cs('bad').backgroundColor === BASE);
    check('useAST deprecation warned once', warns.filter(w => w.includes('useAST')).length === 1, String(warns.filter(w => w.includes('useAST')).length));
    check('SkeletonKeep visible with real colors', cs('keep').backgroundColor === 'rgb(0, 128, 0)' && cs('keep').color !== T, `${cs('keep').backgroundColor} ${cs('keep').color}`);
    check('SkeletonIgnore hidden, keeps height', cs('ignore').visibility === 'hidden' && Math.round(q('ignore').getBoundingClientRect().height) === 30);
    check('SkeletonUnite child is one solid block', cs('unite').backgroundColor === BASE && cs('unite-p').visibility === 'hidden');

    flushSync(() => setLoadingAll(false));
    setTimeout(() => {
        check('toggle off: hook component fine', q('hook')?.textContent === 'hook');
        check('marks removed after loading', document.querySelectorAll('[data-skeleton="keep"]:not(skx-keep),[data-skeleton="ignore"]:not(skx-ignore)').length === 0);
        check('loaded: badge visible', cs('badge1').visibility === 'visible');
        check('no React errors', errors.length === 0, errors.join(' || '));
        flushSync(() => setLoadingAll(true));
        check('toggle on again: marks re-applied', cs('badge1').visibility === 'hidden');
        results.push(`\n${results.length - fails}/${results.length} passed`);
        const pre = document.createElement('pre');
        pre.id = 'RESULT';
        pre.textContent = results.join('\n');
        document.body.appendChild(pre);
    }, 200);
}, 300);
