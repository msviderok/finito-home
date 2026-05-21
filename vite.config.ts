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
    ignorePatterns: ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'src/routeTree.gen.ts'],
  },
  plugins: [nitro(), tailwindcss(), tanstackStart({}), viteReact(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts', './src/test/mock-trpc.ts'],
    include: ['src/test/**/*.{test,spec}.{ts,tsx}'],
    server: {
      deps: {
        inline: ['react', 'react-dom', '@base-ui/react'],
      },
    },
  },
});

export default config;
