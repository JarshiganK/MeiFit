import { fileURLToPath } from 'node:url'
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      alias: {
        'virtual:pwa-register/react': fileURLToPath(
          new URL('./src/test/pwaRegisterStub.ts', import.meta.url),
        ),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.ts'],
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/test/**',
          'src/dev/**',
          'src/main.tsx',
          'src/**/*.d.ts',
        ],
        reporter: ['text-summary', 'json-summary', 'html'],
        thresholds: {
          lines: 70,
          'src/domain/**': { lines: 90 },
        },
      },
    },
  }),
)
