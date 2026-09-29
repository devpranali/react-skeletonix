/// <reference types="vitest/config" />
import { copyFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

const fileNames: Record<string, string> = {
    es: 'react-skeletonix.js',
    cjs: 'react-skeletonix.cjs',
    umd: 'react-skeletonix.umd.js',
};

export default defineConfig({
    plugins: [
        dts({
            include: ['src'],
            // One bundled declaration file, plus a copy for CommonJS consumers.
            rollupTypes: true,
            afterBuild: () => copyFileSync('dist/index.d.ts', 'dist/index.d.cts'),
        }),
    ],
    // Classic runtime: the bundle only needs `React`, so it works on every
    // React version in the peer range and never bundles react/jsx-runtime.
    esbuild: {
        jsx: 'transform',
        jsxFactory: 'React.createElement',
        jsxFragment: 'React.Fragment',
    },
    build: {
        target: 'es2019',
        sourcemap: false,
        lib: {
            entry: 'src/index.tsx',
            name: 'ReactSkeletonix',
            formats: ['es', 'cjs', 'umd'],
            fileName: (format) => fileNames[format],
            cssFileName: 'style',
        },
        rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime'],
            output: {
                exports: 'named',
                // Marks the bundle as a Client Component for React Server
                // Components (Next.js App Router). Rollup drops source directives.
                banner: "'use client';",
                globals: {
                    react: 'React',
                    'react-dom': 'ReactDOM',
                },
            },
        },
    },
    test: {
        environment: 'jsdom',
        include: ['tests/unit/**/*.test.{ts,tsx}'],
        css: false,
    },
});
