"use strict";
/**
 * Helper functions for defining Connectors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineConnector = defineConnector;
exports.defineTool = defineTool;
exports.defineSyncTool = defineSyncTool;
exports.defineAsyncTool = defineAsyncTool;
exports.defineOAuth2 = defineOAuth2;
exports.defineAPIKey = defineAPIKey;
exports.defineCustomAuth = defineCustomAuth;
exports.textField = textField;
exports.passwordField = passwordField;
exports.textareaField = textareaField;
exports.numberField = numberField;
exports.integerField = integerField;
exports.booleanField = booleanField;
exports.dropdownField = dropdownField;
/**
 * Define a Connector
 */
function defineConnector(config) {
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
/**
 * Define a Tool
 */
function defineTool(config) {
    return { ...config };
}
/**
 * Define a Sync Tool (shortcut)
 */
function defineSyncTool(config) {
    return { ...config, kind: 'sync' };
}
/**
 * Define an Async Tool (shortcut)
 */
function defineAsyncTool(config) {
    return { ...config, kind: 'async' };
}
// ============================================================================
// Authentication Definitions
// ============================================================================
/**
 * Define OAuth2 authentication
 */
function defineOAuth2(config) {
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
function defineAPIKey(config) {
    return {
        type: 'api_key',
        ...config,
    };
}
/**
 * Define custom authentication
 */
function defineCustomAuth(config) {
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
function textField(config) {
    return { type: 'string', ...config };
}
/**
 * Define password field
 */
function passwordField(config) {
    return { type: 'password', ...config };
}
/**
 * Define textarea field
 */
function textareaField(config) {
    return { type: 'text', ...config };
}
/**
 * Define number field
 */
function numberField(config) {
    return { type: 'number', ...config };
}
/**
 * Define integer field
 */
function integerField(config) {
    return { type: 'integer', ...config };
}
/**
 * Define boolean field
 */
function booleanField(config) {
    return { type: 'boolean', ...config };
}
/**
 * Define dropdown field
 */
function dropdownField(config) {
    return { type: 'string', ...config };
}
