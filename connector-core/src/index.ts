/**
 * @mcplinx/connector-core
 * 
 * Core types and utilities for the Remote Task system
 */

// Export types
export * from './types';

// Export helpers
export * from './helpers';

// Export RuntimeContext and utilities
export {
    createRuntimeContext,
    resolveTemplate,
    ConnectorError,
    HaltedError,
    ExpiredAuthError,
    RefreshAuthError,
} from './runtime-context';

export type { RuntimeContextOptions } from './runtime-context';

// Export context utilities (legacy z.ts)
export {
    createRuntimeContext as createRuntimeContextFromContext,
    includeBearerToken,
    includeApiKeyHeader,
    includeBasicAuth,
} from './context';

export type { CreateRuntimeContextOptions } from './context';

// Export connector loader
export { loadConnectorFromCode } from './loader';
