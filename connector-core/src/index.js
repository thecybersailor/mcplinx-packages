"use strict";
/**
 * @mcplinx/connector-core
 *
 * Core types and utilities for the Remote Task system
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConnectorFromCode = exports.includeBasicAuth = exports.includeApiKeyHeader = exports.includeBearerToken = exports.createRuntimeContextFromContext = exports.RefreshAuthError = exports.ExpiredAuthError = exports.HaltedError = exports.ConnectorError = exports.resolveTemplate = exports.createRuntimeContext = void 0;
// Export types
__exportStar(require("./types"), exports);
// Export helpers
__exportStar(require("./helpers"), exports);
// Export RuntimeContext and utilities
var runtime_context_1 = require("./runtime-context");
Object.defineProperty(exports, "createRuntimeContext", { enumerable: true, get: function () { return runtime_context_1.createRuntimeContext; } });
Object.defineProperty(exports, "resolveTemplate", { enumerable: true, get: function () { return runtime_context_1.resolveTemplate; } });
Object.defineProperty(exports, "ConnectorError", { enumerable: true, get: function () { return runtime_context_1.ConnectorError; } });
Object.defineProperty(exports, "HaltedError", { enumerable: true, get: function () { return runtime_context_1.HaltedError; } });
Object.defineProperty(exports, "ExpiredAuthError", { enumerable: true, get: function () { return runtime_context_1.ExpiredAuthError; } });
Object.defineProperty(exports, "RefreshAuthError", { enumerable: true, get: function () { return runtime_context_1.RefreshAuthError; } });
// Export context utilities (legacy z.ts)
var context_1 = require("./context");
Object.defineProperty(exports, "createRuntimeContextFromContext", { enumerable: true, get: function () { return context_1.createRuntimeContext; } });
Object.defineProperty(exports, "includeBearerToken", { enumerable: true, get: function () { return context_1.includeBearerToken; } });
Object.defineProperty(exports, "includeApiKeyHeader", { enumerable: true, get: function () { return context_1.includeApiKeyHeader; } });
Object.defineProperty(exports, "includeBasicAuth", { enumerable: true, get: function () { return context_1.includeBasicAuth; } });
// Export connector loader
var loader_1 = require("./loader");
Object.defineProperty(exports, "loadConnectorFromCode", { enumerable: true, get: function () { return loader_1.loadConnectorFromCode; } });
