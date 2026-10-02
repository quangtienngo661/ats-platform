import nextEslintPluginNext from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { plugins: { '@next/next': nextEslintPluginNext } },
  ...baseConfig,
  ...nx.configs['flat/react-typescript'],
  {
    files: ['**/*.{js,jsx,ts,tsx,mjs,mts}'],
    plugins: { 'jsx-a11y': jsxA11y, 'react-hooks': reactHooks },
    settings: { next: { rootDir: 'apps/web/' } },
    rules: {
      ...nextEslintPluginNext.configs.recommended.rules,
      ...nextEslintPluginNext.configs['core-web-vitals'].rules,
      ...jsxA11y.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    ignores: [
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/next-env.d.ts',
      '**/test-results/**',
      '**/playwright-report/**',
    ],
  },
];
