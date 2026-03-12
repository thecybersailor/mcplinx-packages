import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@mcplinx/api-client-user': fileURLToPath(new URL('../api-client-user/api.ts', import.meta.url)),
      '@mcplinx/api-client-admin': fileURLToPath(new URL('../api-client-admin/api.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/__tests__/*.spec.ts'],
  },
})
