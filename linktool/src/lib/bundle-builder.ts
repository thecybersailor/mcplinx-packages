import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';

/**
 * Load config schema from manifest.json
 */
export function loadConfigSchema(cwd: string): { env_keys: string[], secret_keys: string[] } {
    let configSchema: { env_keys: string[], secret_keys: string[] } = { env_keys: [], secret_keys: [] };
    const manifestPath = join(cwd, 'dist', 'manifest.json');
    if (existsSync(manifestPath)) {
        try {
            const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
            configSchema = manifest.config_schema || { env_keys: [], secret_keys: [] };
        } catch (e) {
            // Ignore manifest parse errors
        }
    }
    return configSchema;
}

/**
 * Load vars and secrets from .config.yml
 * Expected format:
 *   vars:
 *     CLIENT_ID: value
 *   secrets:
 *     CLIENT_SECRET: value
 */
export function loadConfigFromYaml(cwd: string): {
    vars: Record<string, any>;
    secrets: Record<string, any>;
} {
    const configPath = join(cwd, '.config.yml');
    
    if (!existsSync(configPath)) {
        return { vars: {}, secrets: {} };
    }

    try {
        const content = readFileSync(configPath, 'utf-8');
        const config = parseYaml(content);
        
        return {
            vars: config?.vars || {},
            secrets: config?.secrets || {}
        };
    } catch (e: any) {
        throw new Error(`Failed to parse .config.yml: ${e.message}`);
    }
}

/**
 * Build a bundle object with vars and secrets properly injected
 */
export function buildBundle(cwd: string, overrides: {
    authData?: Record<string, any>;
    inputData?: Record<string, any>;
    [key: string]: any;
} = {}): any {
    const { vars, secrets } = loadConfigFromYaml(cwd);
    
    return {
        authData: overrides.authData || {},
        inputData: overrides.inputData || {},
        vars,
        secrets,
        ...overrides
    };
}

