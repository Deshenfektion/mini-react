import { defineConfig } from 'vitest/config'

function local(path: string): string {
  return new URL(path, import.meta.url).pathname
}

export default defineConfig({
  resolve: {
    alias: [
      { find: 'mini-react/jsx-runtime', replacement: local('./src/jsx-runtime.ts') },
      {
        find: 'mini-react/jsx-dev-runtime',
        replacement: local('./src/jsx-dev-runtime.ts'),
      },
      { find: 'mini-react', replacement: local('./src/index.ts') },
    ],
  },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**'],
    },
  },
})
