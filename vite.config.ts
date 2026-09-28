import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
    plugins: [
        react(),
        dts({
            insertTypesEntry: true,
        }),
    ],
    build: {
        lib: {
            entry: 'src/index.tsx',
            name: 'ReactSkeletonix',
            fileName: (format) => `react-skeletonix.${format}.js`,
        },
        rollupOptions: {
            external: ['react', 'react-dom'],
            output: {
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
});
