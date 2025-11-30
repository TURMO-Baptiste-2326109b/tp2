// ============================================================================
// Configuration ESLint - TP2 MongoDB Dashboard
// ============================================================================
// ESLint 9 utilise le nouveau format "flat config"
// Documentation : https://eslint.org/docs/latest/use/configure/configuration-files
// ============================================================================

import js from '@eslint/js';

export default [
    // Configuration recommandée de base
    js.configs.recommended,

    // Configuration globale
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                // Node.js globals
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                // ES2022 globals
                fetch: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
            },
        },
        rules: {
            // Bonnes pratiques
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            'no-console': 'off', // Autorisé pour un projet pédagogique
            'prefer-const': 'warn',
            'no-var': 'error',

            // Style de code
            'eqeqeq': ['error', 'always'],
            'curly': ['warn', 'multi-line'],
            'no-multiple-empty-lines': ['warn', { max: 2 }],

            // Async/await
            'no-async-promise-executor': 'error',
            'require-await': 'warn',
        },
    },

    // Configuration spécifique pour les tests
    {
        files: ['**/tests/**/*.js', '**/*.test.js'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                before: 'readonly',
                after: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': 'off',
        },
    },

    // Fichiers à ignorer
    {
        ignores: [
            'node_modules/',
            'dist/',
            'coverage/',
            '*.min.js',
            // Fichiers MongoDB Playground (syntaxe spéciale avec variables globales db, use)
            '**/*.mongodb.js',
        ],
    },
];
