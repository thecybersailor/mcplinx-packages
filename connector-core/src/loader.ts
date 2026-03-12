/**
 * Connector Loader
 * Load and validate connector from bundle code
 */

import type { Connector } from './types';

/**
 * Load connector from CJS bundle code
 * Uses new Function() to execute the bundle in a controlled manner
 * 
 * Note: This is used for non-sandboxed execution (e.g., in linktool development mode)
 * For production sandboxed execution, use Sandbox class
 */
export function loadConnectorFromCode(code: string): Connector {
    try {
        // Create a mock module/exports environment for CJS
        const moduleExports: any = {};
        const moduleObj = { exports: moduleExports };

        // Execute the CJS bundle code
        // The bundle is in format: "use strict"; ... module.exports = connector;
        const fn = new Function('module', 'exports', 'require', code);

        // Provide a mock require function
        const mockRequire = (id: string) => {
            console.warn(`[loadConnectorFromCode] require() called for: ${id} - returning empty object`);
            return {};
        };

        fn(moduleObj, moduleExports, mockRequire);

        // Extract connector from exports
        const result = moduleObj.exports;
        const connector = result.connector || result.default || result;

        // Validate connector structure
        if (!connector || typeof connector !== 'object') {
            console.error('[loadConnectorFromCode] Invalid connector structure:', {
                hasResult: !!result,
                resultType: typeof result,
                resultKeys: result ? Object.keys(result) : null,
            });
            throw new Error('Invalid connector structure: expected object');
        }

        if (!connector.authentication) {
            console.error('[loadConnectorFromCode] Missing authentication:', {
                connectorKeys: Object.keys(connector),
            });
            throw new Error('Invalid connector structure: missing authentication');
        }

        console.log('[loadConnectorFromCode] Successfully loaded connector:', {
            hasAuthentication: !!connector.authentication,
            authType: connector.authentication?.type,
            hasTools: !!connector.tools,
            toolCount: connector.tools ? Object.keys(connector.tools).length : 0,
        });

        return connector as Connector;
    } catch (e: any) {
        console.error('[loadConnectorFromCode] Failed to load connector code:', e);
        throw new Error('Connector loading failed: ' + (e.message || 'unknown error'));
    }
}
