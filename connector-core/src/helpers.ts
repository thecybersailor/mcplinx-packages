/**
 * Helper functions for defining Connectors
 */

import {
    Connector,
    Tool,
    OAuth2Authentication,
    APIKeyAuthentication,
    CustomAuthentication,
    InputField,
} from './types';

// ============================================================================
// Connector Definition
// ============================================================================

export interface ConnectorDefinition extends Omit<Connector, 'tools'> {
    tools: Record<string, Tool>;
}

/**
 * Define a Connector
 */
export function defineConnector(config: ConnectorDefinition): Connector {
    return {
        id: config.id,
        name: config.name,
        description: config.description,
        icon: config.icon,
        version: config.version,
        authentication: config.authentication,
        beforeRequest: config.beforeRequest || [],
        afterResponse: config.afterResponse || [],
        tools: config.tools,
    };
}

// ============================================================================
// Tool Definition
// ============================================================================

export interface ToolDefinition extends Omit<Tool, 'key'> {
    key: string;
}

/**
 * Define a Tool
 */
export function defineTool(config: ToolDefinition): Tool {
    return { ...config };
}

/**
 * Define a Sync Tool (shortcut)
 */
export function defineSyncTool(config: Omit<ToolDefinition, 'kind'>): Tool {
    return { ...config, kind: 'sync' };
}

/**
 * Define an Async Tool (shortcut)
 */
export function defineAsyncTool(config: Omit<ToolDefinition, 'kind'>): Tool {
    return { ...config, kind: 'async' };
}

// ============================================================================
// Authentication Definitions
// ============================================================================

/**
 * Define OAuth2 authentication
 */
export function defineOAuth2(
    config: Omit<OAuth2Authentication, 'type'>
): OAuth2Authentication {
    return {
        type: 'oauth2',
        ...config,
        oauth2Config: {
            autoRefresh: true,
            ...config.oauth2Config,
        },
    };
}

/**
 * Define API Key authentication
 */
export function defineAPIKey(
    config: Omit<APIKeyAuthentication, 'type'>
): APIKeyAuthentication {
    return {
        type: 'api_key',
        ...config,
    };
}

/**
 * Define custom authentication
 */
export function defineCustomAuth(
    config: Omit<CustomAuthentication, 'type'>
): CustomAuthentication {
    return {
        type: 'custom',
        ...config,
    };
}

// ============================================================================
// Input Field Helpers
// ============================================================================

/**
 * Define text field
 */
export function textField(config: Omit<InputField, 'type'>): InputField {
    return { type: 'string', ...config };
}

/**
 * Define password field
 */
export function passwordField(config: Omit<InputField, 'type'>): InputField {
    return { type: 'password', ...config };
}

/**
 * Define textarea field
 */
export function textareaField(config: Omit<InputField, 'type'>): InputField {
    return { type: 'text', ...config };
}

/**
 * Define number field
 */
export function numberField(config: Omit<InputField, 'type'>): InputField {
    return { type: 'number', ...config };
}

/**
 * Define integer field
 */
export function integerField(config: Omit<InputField, 'type'>): InputField {
    return { type: 'integer', ...config };
}

/**
 * Define boolean field
 */
export function booleanField(config: Omit<InputField, 'type'>): InputField {
    return { type: 'boolean', ...config };
}

/**
 * Define dropdown field
 */
export function dropdownField(
    config: Omit<InputField, 'type'> & { choices: InputField['choices'] }
): InputField {
    return { type: 'string', ...config };
}
