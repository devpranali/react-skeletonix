import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import * as Lib from 'react-skeletonix';

const Skeleton: any = (Lib as any).default;
const BASE = 'rgb(240, 240, 240)';
const T = 'rgba(0, 0, 0, 0)';

type Check = [string, string, (s: CSSStyleDeclaration, r: DOMRect, el: HTMLElement) => boolean | string];
const checks: Check[] = [];
const expect = (id: string, what: string, fn: Check[2]) => checks.push([id, what, fn]);
const painted = (s: CSSStyleDeclaration) => s.backgroundColor === BASE;

function Cases() {
    return (
        <div style={{ width: 500, fontFamily: 'sans-serif' }}>
            <Skeleton loading animate={false}><h4 id="a">User uploaded a project</h4></Skeleton>
            <Skeleton loading animate={false}><div className="card"><div id="b">John Doe</div></div></Skeleton>
            <Skeleton loading animate={false}><div><img id="c" width="80" height="80" src="data:image/gif;base64,R0lGODlhAQABAIAAAP8AAP///ywAAAAAAQABAAACAkQBADs=" /></div></Skeleton>
            <Skeleton loading animate={false}><div><img id="c2" width="60" height="60" alt="broken" src="nope.png" /></div></Skeleton>
            <Skeleton loading animate={false} useAST><div><p id="d">AST text</p></div></Skeleton>
            <Skeleton loading animate={false}><ul><li id="e">item</li></ul></Skeleton>
            <Skeleton loading animate={false}><div><div id="g" style={{ height: 8 }} /></div></Skeleton>
            <Skeleton loading animate={false}><div><span className="icon" id="h" style={{ borderRadius: 2 }}>i</span></div></Skeleton>
            <Skeleton loading animate={false} randomWidth={[30, 30]}><div><p id="i">text</p></div></Skeleton>
            <Skeleton loading animate={false} randomWidth={[30, 30]}><p id="j">text</p></Skeleton>
            <Skeleton loading animate={false}><div><div className="not-skeleton"><span id="k" style={{ color: 'red' }}>keep</span></div></div></Skeleton>
            <Skeleton loading animate={false}><div><a id="l" href="#">link text</a></div></Skeleton>
            <table><tbody><Skeleton loading animate={false}><tr><td id="m" style={{ padding: 10 }}>cell</td></tr></Skeleton></tbody></table>
            <Skeleton loading animate={false}><div><div id="n">Hello <b id="n-b">World</b></div></div></Skeleton>
            <Skeleton loading animate={false}><div><button id="o"><svg id="o-svg" width="10" height="10"><rect width="10" height="10" /></svg> Go</button></div></Skeleton>
            <Skeleton loading animate={false} container><div id="p" style={{ height: 40 }}><span id="p-in">inner</span></div></Skeleton>
            <Skeleton loading animate={false}><div id="q" style={{ padding: 16, background: 'navy', border: '1px solid red' }}><p id="q-p">para</p></div></Skeleton>
            <Skeleton loading animate={false}><div><input id="r" defaultValue="value" /></div></Skeleton>
            <Skeleton loading animate={false}><p id="s">Hi <span id="s-span">there</span></p></Skeleton>
            <Skeleton loading animate={false}><div><div data-skeleton="ignore" id="t">ignored</div></div></Skeleton>
            <Skeleton loading animate={false}><div><svg id="u" width="24" height="24"><circle id="u-c" cx="12" cy="12" r="10" /></svg></div></Skeleton>
            <Skeleton loading animate={false}><div><div className="avatar" id="v" style={{ width: 40, height: 40, borderRadius: '50%' }}>DM</div></div></Skeleton>
            <Skeleton loading animate={false}><div style={{ display: 'flex' }}><span id="w1">A</span><span id="w2">B</span></div></Skeleton>
            <div style={{ color: 'rgb(0, 128, 0)' }}><Skeleton loading animate={false}><div><div data-skeleton="keep"><span id="k2">inherited keep</span></div><p id="k3">masked sibling</p></div></Skeleton></div>
            <Skeleton loading><div><p id="x">shimmer on</p></div></Skeleton>
            <Skeleton loading={false}><p id="y" style={{ color: 'rgb(1, 2, 3)' }}>loaded</p></Skeleton>
        </div>
    );
}

expect('a', 'single host h4 painted', (s) => painted(s) && s.color === T);
expect('b', 'text in div painted', (s) => painted(s) && s.color === T);
expect('c', 'img painted & visible', (s) => painted(s) && s.visibility === 'visible');
expect('c2', 'broken img painted', (s) => painted(s));
expect('d', 'AST p painted', (s) => painted(s));
expect('e', 'li keeps list-item display', (s) => s.display === 'list-item' && painted(s));
expect('g', 'spacer keeps its 8px height', (_s, r) => Math.round(r.height) === 8);
expect('h', '.icon keeps author radius', (s) => s.borderTopLeftRadius === '2px');
expect('i', 'randomWidth nested p = 30%', (_s, r) => Math.round(r.width) === 150);
expect('j', 'randomWidth single p = 30%', (_s, r) => Math.round(r.width) === 150);
expect('k', 'not-skeleton child keeps color', (s) => s.color === 'rgb(255, 0, 0)');
expect('k2', 'keep inherits real color', (s) => s.color === 'rgb(0, 128, 0)' && (s as any).webkitTextFillColor === 'rgb(0, 128, 0)');
expect('k3', 'sibling of keep still masked', (s) => painted(s) && s.color === T);
expect('l', 'link painted', (s) => painted(s));
expect('m', 'td painted, content-box', (s) => painted(s) && s.backgroundClip === 'content-box');
expect('n', 'mixed text div painted', (s) => painted(s));
expect('n-b', 'inner <b> not double painted', (s) => s.backgroundColor === T);
expect('o', 'button painted', (s) => painted(s));
expect('o-svg', 'svg inside button not painted', (s) => s.backgroundColor === T);
expect('p', 'container child painted', (s) => painted(s));
expect('p-in', 'container inner hidden', (s) => s.visibility === 'hidden');
expect('q', 'card bg/border hidden', (s) => s.backgroundColor === T && s.borderTopColor === T);
expect('q-p', 'card paragraph painted', (s) => painted(s));
expect('r', 'input painted, text hidden', (s) => painted(s) && s.color === T);
expect('s', 'p painted', (s) => painted(s));
expect('s-span', 'span inside p not painted', (s) => s.backgroundColor === T);
expect('t', 'ignore is invisible, keeps space', (s, r) => s.visibility === 'hidden' && r.height > 0);
expect('u', 'svg painted', (s) => painted(s));
expect('u-c', 'svg shapes hidden', (s) => s.visibility === 'hidden');
expect('v', 'avatar painted, keeps circle', (s) => painted(s) && s.borderTopLeftRadius === '50%');
expect('w1', 'flex chip A painted separately', (s) => painted(s));
expect('x', 'shimmer animates', (s) => s.animationName === 'skx-shimmer');
expect('y', 'loaded content untouched', (s) => s.color === 'rgb(1, 2, 3)' && s.backgroundColor === T);

const root = createRoot(document.getElementById('root')!);
flushSync(() => root.render(<Cases />));

setTimeout(() => {
    const lines: string[] = [];
    let fail = 0;
    for (const [id, what, fn] of checks) {
        const el = document.getElementById(id) as HTMLElement | null;
        if (!el) { lines.push(`FAIL ${id} ${what}: element not found`); fail++; continue; }
        const s = getComputedStyle(el);
        const ok = fn(s, el.getBoundingClientRect(), el);
        if (ok !== true) {
            fail++;
            lines.push(`FAIL ${id} ${what} | bg=${s.backgroundColor} color=${s.color} vis=${s.visibility} disp=${s.display} w=${Math.round(el.getBoundingClientRect().width)} h=${Math.round(el.getBoundingClientRect().height)} radius=${s.borderTopLeftRadius} clip=${s.backgroundClip}`);
        } else lines.push(`ok   ${id} ${what}`);
    }
    lines.push(`\n${checks.length - fail}/${checks.length} passed`);
    const pre = document.createElement('pre');
    pre.id = 'RESULT';
    pre.textContent = lines.join('\n');
    document.body.appendChild(pre);
}, 600);
