import js from '@eslint/js';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';
import jest from 'eslint-plugin-jest';
import playwright from 'eslint-plugin-playwright';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules/',
      'reports/',
      'playwright-report/',
      'test-results/',
      'coverage/',
      'logs/',
      '.vscode/',
    ],
  },
  js.configs.recommended,
  jsdoc.configs['flat/recommended'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'warn',
    },
  },
  {
    files: ['tests/unit/**/*.js', 'tests/integration/**/*.js'],
    ...jest.configs['flat/recommended'],
  },
  {
    files: ['tests/e2e/**/*.js'],
    ...playwright.configs['flat/recommended'],
  },
  eslintConfigPrettier,
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
      'space-before-function-paren': 'off',
      'arrow-body-style': 'off',
      'prefer-arrow-callback': 'off',
      'jsdoc/reject-function-type': 'off',
    },
  },
];
