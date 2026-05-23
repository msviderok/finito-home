import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';
import { playwright } from 'vite-plus/test/browser/providers/playwright';
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
    setupFiles: ['./src/test/mock-trpc.ts'],
    server: {
      deps: {
        inline: ['react', 'react-dom', '@base-ui/react'],
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./src/test/setup.ts'],
          include: ['src/test/**/*.{test,spec}.{ts,tsx}'],
          exclude: ['src/test/**/*.browser.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          setupFiles: ['./src/test/browser-setup.ts'],
          include: ['src/test/**/*.browser.test.{ts,tsx}'],
          browser: {
            enabled: true,
            headless: true,
            screenshotFailures: false,
            provider: playwright(),
            instances: [{ browser: 'chromium', headless: true }],
          },
        },
      },
    ],
  },
});

export default config;
