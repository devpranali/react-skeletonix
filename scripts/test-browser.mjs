#!/usr/bin/env node
/**
 * Runs tests/browser/*.tsx in headless Chrome. These check what jsdom cannot:
 * the real stylesheet (computed colours, sizes, :has() matching) and
 * IntersectionObserver.
 *
 *   npm run test:browser            # against src/
 *   npm run test:browser -- --dist  # against the built dist/ (run build first)
 *
 * Chrome is looked up in the usual places; set CHROME_PATH to override.
 */
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const useDist = process.argv.includes('--dist');
const outRoot = join(root, '.browser-tests');

const chromeCandidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
].filter(Boolean);
const chrome = chromeCandidates.find((p) => existsSync(p));
if (!chrome) {
    console.error('No Chrome/Chromium found. Set CHROME_PATH.');
    process.exit(1);
}

const entry = useDist ? join(root, 'dist/react-skeletonix.js') : join(root, 'src/index.tsx');
if (useDist && !existsSync(entry)) {
    console.error('dist/ not found. Run `npm run build` first.');
    process.exit(1);
}

rmSync(outRoot, { recursive: true, force: true });
const cases = readdirSync(join(root, 'tests/browser')).filter((f) => f.endsWith('.tsx'));
let failed = 0;

for (const file of cases) {
    const name = file.replace(/\.tsx$/, '');
    const dir = join(outRoot, name);
    mkdirSync(dir, { recursive: true });

    await build({
        entryPoints: [join(root, 'tests/browser', file)],
        bundle: true,
        outdir: dir,
        entryNames: 'app',
        jsx: 'automatic',
        alias: { 'react-skeletonix': entry },
        define: { 'process.env.NODE_ENV': '"development"' },
        logLevel: 'error',
    });

    const styles = [];
    if (existsSync(join(dir, 'app.css'))) styles.push('app.css');
    if (useDist) {
        copyFileSync(join(root, 'dist/style.css'), join(dir, 'style.css'));
        styles.push('style.css');
    }
    writeFileSync(
        join(dir, 'index.html'),
        `<!doctype html><html><head><meta charset="utf-8">${styles.map((s) => `<link rel="stylesheet" href="${s}">`).join('')}</head>` +
        '<body><div id="root"></div><script src="app.js"></script></body></html>'
    );

    const dom = execFileSync(chrome, [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--virtual-time-budget=5000',
        '--window-size=1000,2600',
        '--dump-dom',
        pathToFileURL(join(dir, 'index.html')).href,
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 20 * 1024 * 1024 });

    const match = dom.match(/<pre id="RESULT">([\s\S]*?)<\/pre>/);
    const text = match
        ? match[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
        : 'FAIL no result (page crashed?)';
    const fails = text.split('\n').filter((l) => l.startsWith('FAIL'));
    failed += fails.length;
    console.log(`\n=== ${name}${useDist ? ' (dist)' : ''} ===`);
    console.log(fails.length ? text : text.split('\n').filter((l) => !l.startsWith('ok')).join('\n').trim());
}

console.log(failed ? `\n${failed} browser check(s) failed` : '\nAll browser checks passed');
process.exit(failed ? 1 : 0);
