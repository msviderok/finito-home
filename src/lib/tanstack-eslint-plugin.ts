/**
 * This one is purely AI-generated.
 * It’s intended to transform the @tanstack/eslint-config config to the oxlint-compatible format.
 */

import { tanstackConfig } from '@tanstack/eslint-config';
import type { ExternalPluginEntry, OxlintConfig, OxlintOverride } from 'vite-plus/lint';

const jsPlugins = [
  '@stylistic/eslint-plugin',
  { name: 'import-x-js', specifier: 'eslint-plugin-import-x' },
  { name: 'n', specifier: 'eslint-plugin-n' },
] satisfies Array<ExternalPluginEntry>;

const jsPluginRules: Record<string, string> = {
  'import/newline-after-import': 'import-x-js/newline-after-import',
  'import/order': 'import-x-js/order',
  'node/prefer-node-protocol': 'n/prefer-node-protocol',
};

// Oxlint has no native rule yet, and the JS plugin needs @typescript-eslint/parser type info.
const unsupportedRules = new Set(['no-octal', 'typescript/method-signature-style', 'typescript/naming-convention']);

function toOxlintRuleName(rule: string) {
  if (rule.startsWith('@typescript-eslint/')) {
    return `typescript/${rule.slice('@typescript-eslint/'.length)}`;
  }
  return rule;
}

function toOxlintRules(rules: Record<string, unknown>) {
  const oxlintRules: Record<string, unknown> = {};
  for (const [rule, value] of Object.entries(rules)) {
    const oxlintRule = toOxlintRuleName(rule);
    if (unsupportedRules.has(oxlintRule)) continue;
    oxlintRules[jsPluginRules[oxlintRule] ?? oxlintRule] = value;
  }
  return oxlintRules;
}

function toOxlintOverride(config: (typeof tanstackConfig)[number]): OxlintOverride | null {
  if (!('rules' in config) || !config.rules || !('files' in config) || !config.files) {
    return null;
  }
  return {
    files: config.files as OxlintOverride['files'],
    rules: toOxlintRules(config.rules as Record<string, unknown>) as OxlintOverride['rules'],
    plugins: ['typescript', 'import', 'node'],
    jsPlugins,
    env: {
      es2020: true,
      browser: true,
    },
  };
}

const ignorePatterns = tanstackConfig.flatMap((config) =>
  'ignores' in config && config.ignores ? [...config.ignores] : [],
);

export const tanstackOxlintConfig = {
  categories: { correctness: 'off' },
  ignorePatterns,
  overrides: tanstackConfig.map(toOxlintOverride).filter((override): override is OxlintOverride => override !== null),
} satisfies OxlintConfig;
