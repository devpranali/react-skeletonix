import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist', 'node_modules', '.browser-tests'] },
    {
        files: ['**/*.{ts,tsx}'],
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        languageOptions: {
            ecmaVersion: 2021,
            globals: globals.browser,
        },
        plugins: { 'react-hooks': reactHooks },
        rules: {
            ...reactHooks.configs.recommended.rules,
            // Generic component typings (Skeleton<T = any>) need `any`.
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
    {
        files: ['tests/**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },
    {
        files: ['scripts/**/*.mjs'],
        extends: [js.configs.recommended],
        languageOptions: { globals: globals.node },
    }
);
