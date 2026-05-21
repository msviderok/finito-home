import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { defineConfig } from 'vite-plus';
import babel from '@rolldown/plugin-babel';

const config = defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  lint: {
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
  plugins: [nitro(), tailwindcss(), tanstackStart({}), viteReact(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    tsconfigPaths: true,
  },
});

export default config;
