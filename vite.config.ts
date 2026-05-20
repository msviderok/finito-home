import { defineConfig } from 'vite-plus';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nitro } from 'nitro/vite';
import { tanstackOxlintConfig } from './src/lib/tanstack-eslint-plugin.ts';

const config = defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  lint: {
    ...tanstackOxlintConfig,
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    endOfLine: 'lf',
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
    printWidth: 120,
    sortTailwindcss: {
      stylesheet: 'src/styles.css',
      functions: ['cn', 'cva'],
    },
    sortPackageJson: false,
    ignorePatterns: ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock'],
  },
  plugins: [nitro(), tailwindcss(), tanstackStart(), viteReact()],
  resolve: {
    tsconfigPaths: true,
  },
});

export default config;
