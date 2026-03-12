import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@mcplinx/connector-core': fileURLToPath(new URL('../connector-core/src/index.ts', import.meta.url)),
        },
    },
    test: {
        globals: true,
        environment: 'node',
    },
});
