import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { existsSync } from 'fs';
import { join } from 'path';
import { loadConnector } from '../../lib/connector-loader.js';
import { createMockCtx } from '../../lib/runtime.js';
import { LinktoolStorage } from '../../lib/storage.js';
import { buildBundle } from '../../lib/bundle-builder.js';

export function configCommand() {
    return new Command('config')
        .description('Configure a tool interactively')
        .argument('<tool-key>', 'Tool key to configure')
        .action(async (toolKey) => {
            const cwd = process.cwd();
            const storage = new LinktoolStorage(cwd);

            try {
                const connector = await loadConnector(cwd);

                // Find tool
                const tool = connector.tools?.[toolKey];
                if (!tool) {
                    console.error(chalk.red(`Tool '${toolKey}' not found.`));
                    process.exit(1);
                }

                console.log(chalk.cyan(`🔧 Configuring: ${tool.name}`));
                if (tool.description) {
                    console.log(chalk.gray(tool.description));
                }
                console.log();

                // Load auth
                const authData = storage.loadAuth() || {};
                if (!storage.hasAuth() && connector.authentication) {
                    console.warn(chalk.yellow('⚠ No auth found. Run `npx linktool auth` first.\n'));
                }

                // Collect input interactively
                const config: Record<string, any> = {};

                for (const field of tool.inputFields || []) {
                    const value = await promptField(field, config, {
                        connector,
                        authData,
                        z: createMockCtx()
                    });
                    config[field.key] = value;
                }

                // Save config
                const configPath = storage.saveToolConfig(toolKey, config);

                console.log();
                console.log(chalk.green(`✓ Configuration saved to ${configPath}`));
                console.log(chalk.gray('\nYou can now run:'));
                console.log(chalk.cyan(`  npx linktool run ${toolKey}`));

            } catch (e: any) {
                console.error(chalk.red('Configuration failed:'), e.message);
                if (e.stack) console.error(chalk.gray(e.stack));
                process.exit(1);
            }
        });
}

async function promptField(
    field: any,
    currentConfig: Record<string, any>,
    context: { connector: any; authData: any; z: any }
): Promise<any> {
    const { connector, authData, z } = context;

    // Handle dynamic choices
    let choices = field.choices;
    if (field.dynamic) {
        try {
            choices = await resolveDynamicChoices(field.dynamic, currentConfig, { connector, authData, z });
        } catch (e: any) {
            console.error(chalk.red(`Failed to load dynamic choices for ${field.key}: ${e.message}`));
            if (e.stack) console.error(chalk.gray(e.stack));
            throw e;
        }
    }

    // Build inquirer question
    const question: any = {
        type: getInquirerType(field, choices),
        name: field.key,
        message: field.label + (field.required ? chalk.red(' *') : ''),
    };

    if (field.helpText) {
        question.message += chalk.gray(`\n  ${field.helpText}`);
    }

    if (field.default !== undefined) {
        question.default = field.default;
    }

    if (field.placeholder) {
        question.default = field.placeholder;
    }

    if (choices) {
        question.choices = Array.isArray(choices)
            ? choices.map(c => typeof c === 'string' ? c : { name: c.label, value: c.value })
            : Object.entries(choices).map(([value, label]) => ({ name: label as string, value }));
    }

    if (field.required) {
        question.validate = (input: any) => {
            if (!input || (typeof input === 'string' && input.trim() === '')) {
                return 'This field is required';
            }
            return true;
        };
    }

    const answer = await inquirer.prompt([question]);
    return answer[field.key];
}

function getInquirerType(field: any, choices?: any): string {
    if (choices) {
        return field.list ? 'checkbox' : 'list';
    }

    switch (field.type) {
        case 'boolean':
            return 'confirm';
        case 'password':
            return 'password';
        case 'text':
            return 'editor';
        case 'integer':
        case 'number':
            return 'number';
        default:
            return 'input';
    }
}

async function resolveDynamicChoices(
    dynamic: string,
    currentConfig: Record<string, any>,
    context: { connector: any; authData: any; z: any }
): Promise<Array<{ label: string; value: string }>> {
    // Parse dynamic string: "tool_key.value_path.label_path"
    const parts = dynamic.split('.');
    if (parts.length < 2) {
        throw new Error(`Invalid dynamic format: ${dynamic}. Expected format: "tool_key.value_path.label_path"`);
    }

    const toolKey = parts[0];
    const valuePath = parts[1];
    const labelPath = parts[2] || valuePath;

    console.log(chalk.gray(`  Fetching options from ${toolKey}...`));
    console.log(chalk.gray(`  Dynamic config: tool=${toolKey}, value=${valuePath}, label=${labelPath}`));

    const tool = context.connector.tools?.[toolKey];
    if (!tool) {
        throw new Error(`Dynamic tool '${toolKey}' not found`);
    }

    // Execute tool
    const bundle = buildBundle(process.cwd(), {
        authData: context.authData,
        inputData: currentConfig
    });

    // Use createMockCtx with connector and bundle to apply beforeRequest interceptors (e.g. auth)
    const zWithAuth = createMockCtx(context.connector, bundle);
    let result = await tool.perform(zWithAuth, bundle);

    console.log(chalk.gray(`  Result type: ${typeof result}`));
    if (Array.isArray(result)) {
        console.log(chalk.gray(`  Result length: ${result.length}`));
        if (result.length > 0) {
            console.log(chalk.gray(`  First item keys: ${Object.keys(result[0]).join(', ')}`));
        }
    } else {
        console.log(chalk.gray(`  Result: ${JSON.stringify(result)}`));
    }

    // Handle array result
    if (!Array.isArray(result)) {
        result = [result];
    }

    // Extract choices
    return result.map((item: any) => {
        const value = getNestedValue(item, valuePath);
        const label = getNestedValue(item, labelPath);

        if (value === undefined) {
            console.warn(chalk.yellow(`  ⚠ Value undefined for path '${valuePath}' in item: ${JSON.stringify(item)}`));
        }

        return {
            value: value,
            label: label
        };
    });
}

function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}
