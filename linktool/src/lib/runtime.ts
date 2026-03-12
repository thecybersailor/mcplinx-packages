import chalk from 'chalk';
import { createRuntimeContext } from '@mcplinx/connector-core';

/**
 * Create mock RuntimeContext for linktool development
 * Now uses the unified createRuntimeContext from connector-core
 */
export function createMockCtx(connector?: any, bundle?: any) {
    // Use the unified RuntimeContext from connector-core
    const baseContext = createRuntimeContext({
        bundle: bundle || {},
        connector: connector,
    });

    // Wrap the request method to add chalk logging for linktool
    const originalRequest = baseContext.request;
    baseContext.request = async (options: any) => {
        const url = typeof options === 'string' ? options : options.url;
        const method = options.method || 'GET';

        console.log(chalk.gray(`[ctx] ${method} ${url}`));

        try {
            const response = await originalRequest(options);
            return response;
        } catch (e: any) {
            console.error(chalk.red(`[ctx] Request Failed: ${e.message}`));
            throw e;
        }
    };

    return baseContext;
}
