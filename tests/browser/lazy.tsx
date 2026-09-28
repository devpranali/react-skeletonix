import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import * as Lib from 'react-skeletonix';

const Skeleton: any = (Lib as any).default;
const { SkeletonTheme } = Lib as any;
const results: string[] = [];
let fails = 0;
const check = (name: string, ok: boolean, info = '') => {
    if (!ok) fails++;
    results.push(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ' | ' + info}`);
};
const Card = ({ id }: { id: string }) => <div className="card" id={id}>card</div>;

function App() {
    return (
        <div style={{ width: 400 }}>
            <div id="fn-top"><Skeleton loading lazy>{() => <p id="fn-p">in view</p>}</Skeleton></div>
            <div id="wrap-top"><Skeleton loading lazy><Card id="wrap-card" /></Skeleton></div>
            <div id="anchor-top"><Skeleton loading lazy showWrapper={false}><Card id="anchor-card" /></Skeleton></div>
            <div style={{ height: 3000 }} />
            <div id="far"><Skeleton loading lazy>{() => <p id="far-p">far away</p>}</Skeleton></div>

            <SkeletonTheme variant="pulse" count={2} colorScheme="dark" stagger={0.5}>
                <div id="themed"><Skeleton loading><p className="tp">themed</p></Skeleton></div>
                <SkeletonTheme baseColor="rgb(10, 20, 30)">
                    <div id="nested"><Skeleton loading><p className="np">nested</p></Skeleton></div>
                    <div id="override"><Skeleton loading count={1} variant="none"><p className="op">override</p></Skeleton></div>
                </SkeletonTheme>
            </SkeletonTheme>
            <div id="auto"><Skeleton loading colorScheme="auto" animate={false}><p id="auto-p">auto</p></Skeleton></div>
        </div>
    );
}

const q = (s: string) => document.querySelector(s) as HTMLElement;
const qa = (s: string) => Array.from(document.querySelectorAll(s)) as HTMLElement[];
const animating = (sel: string) => q(sel)?.closest('.skx-loading')?.classList.contains('skx-animate') ?? false;
const root = createRoot(document.getElementById('root')!);
flushSync(() => root.render(<App />));

setTimeout(() => {
    check('lazy + render function animates in view', animating('#fn-p'));
    check('lazy + wrapper animates in view', animating('#wrap-card'));
    check('lazy + showWrapper=false animates in view', animating('#anchor-card'));
    check('lazy offscreen does not animate', !animating('#far-p'));
    check('theme count=2 applied', qa('#themed .tp').length === 2);
    check('theme variant applied', q('#themed .tp').classList.contains('skx-v-pulse'));
    check('theme stagger applied', qa('#themed .tp')[1].style.getPropertyValue('--skx-delay') === '0.5s');
    check('theme colorScheme=dark colours', getComputedStyle(q('#themed .tp')).backgroundColor === 'rgb(42, 42, 46)', getComputedStyle(q('#themed .tp')).backgroundColor);
    check('nested theme inherits parent + overrides', qa('#nested .np').length === 2 && getComputedStyle(q('#nested .np')).backgroundColor === 'rgb(10, 20, 30)' && q('#nested .np').classList.contains('skx-v-pulse'));
    check('props override theme', qa('#override .op').length === 1 && q('#override .op').classList.contains('skx-v-none'));
    const dark = matchMedia('(prefers-color-scheme: dark)').matches;
    check(`colorScheme=auto follows OS (dark=${dark})`, getComputedStyle(q('#auto-p')).backgroundColor === (dark ? 'rgb(42, 42, 46)' : 'rgb(235, 235, 235)'), getComputedStyle(q('#auto-p')).backgroundColor);
    // Scrolling in/out is covered by tests/unit (mocked IntersectionObserver):
    // headless Chrome with a virtual time budget does not deliver observer
    // callbacks after a programmatic scroll.
    results.push(`\n${results.length - fails}/${results.length} passed`);
    const pre = document.createElement('pre');
    pre.id = 'RESULT';
    pre.textContent = results.join('\n');
    document.body.appendChild(pre);
}, 400);
