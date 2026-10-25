import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y-x'

/** Dates must go through src/domain/date.ts (CLAUDE.md §5, plan §5). */
const noToISOString = {
  selector: "MemberExpression[property.name='toISOString']",
  message: 'toISOString() gives the UTC date. Use the helpers in src/domain/date.ts.',
}

/** Components use design tokens, never raw colours or pixel values (CLAUDE.md §7). */
const noRawHex = {
  selector: 'Literal[value=/#[0-9a-fA-F]{3,8}\\b/]',
  message: 'Use a colour token from src/ui/theme.css instead of a raw hex value.',
}
const noRawHexTemplate = {
  selector: 'TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]',
  message: noRawHex.message,
}
const noArbitraryPx = {
  selector: 'Literal[value=/-\\[\\d+(\\.\\d+)?px\\]/]',
  message: 'Use a spacing or size token instead of an arbitrary pixel value.',
}

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dev-dist',
      'coverage',
      'playwright-report',
      'test-results',
      'public',
      'node_modules',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.js', 'scripts/*.mjs'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-restricted-syntax': ['error', noToISOString],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs['recommended-latest'].rules,
      'react-refresh/only-export-components': ['error', { allowConstantExport: true }],
      'no-restricted-syntax': ['error', noToISOString, noRawHex, noRawHexTemplate, noArbitraryPx],
    },
  },
  {
    files: ['src/**/*.tsx'],
    ...jsxA11y.configs.strict,
  },
  {
    // Domain logic is deterministic: "now" is always passed in.
    files: ['src/domain/**/*.ts'],
    ignores: ['src/domain/**/*.test.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        noToISOString,
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Domain code never reads the clock. Take "now" as an argument.',
        },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Domain code never reads the clock. Take "now" as an argument.',
        },
        {
          selector: "CallExpression[callee.name='dayjs'][arguments.length=0]",
          message: 'Domain code never reads the clock. Take "now" as an argument.',
        },
      ],
      'no-restricted-imports': [
        'error',
        { patterns: ['react', 'react-*', 'dexie', 'dexie-*', '@/db/*', '../db/*'] },
      ],
    },
  },
  {
    // The single place allowed to format dates as ISO strings.
    files: ['src/domain/date.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**', 'tests/**', 'e2e/**'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'no-restricted-syntax': ['error', noToISOString],
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['*.config.ts', 'config/**', 'scripts/**', 'eslint.config.js'],
    languageOptions: { globals: globals.node },
  },
)
