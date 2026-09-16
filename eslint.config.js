import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { projectRules } from './tooling/eslint-rules.js';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'coverage',
      'test-results',
      'playwright-report',
    ],
  },
  {
    files: ['**/*.js'],
    languageOptions: { globals: globals.node },
    rules: { 'no-unused-vars': 'error', 'no-undef': 'error' },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': hooks, 'react-refresh': refresh },
    rules: {
      ...hooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'error',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { project: projectRules },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'project/boundaries': 'error',
      'project/file-name': 'error',
      'project/error-toast': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message: 'named export를 사용하세요.',
        },
        {
          selector:
            'VariableDeclarator[id.name=/^[A-Z][a-zA-Z0-9]*$/] > ArrowFunctionExpression',
          message: '컴포넌트는 function 선언을 사용하세요.',
        },
      ],
    },
  },
  {
    files: ['src/features/*/index.ts'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      'react-refresh/only-export-components': 'off',
      'no-restricted-syntax': 'off',
    },
  },
);
