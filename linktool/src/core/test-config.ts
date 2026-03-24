import chalk from 'chalk';
import inquirer from 'inquirer';
import type { LinktoolCoreContext } from './types.js';
import { buildBundle } from '../lib/bundle-builder.js';
import { loadConnector } from '../lib/connector-loader.js';
import { createMockCtx } from '../lib/runtime.js';
import { LinktoolStorage } from '../lib/storage.js';

type PromptImpl = (questions: unknown[]) => Promise<Record<string, unknown>>;

type TestConfigDeps = {
    prompt?: PromptImpl;
};

export async function runTestConfig(
    ctx: LinktoolCoreContext,
    toolKey: string,
    deps: TestConfigDeps = {},
): Promise<void> {
    const logger = ctx.logger ?? console;
    const prompt = deps.prompt ?? ((questions) => inquirer.prompt(questions as any) as Promise<Record<string, unknown>>);
    const storage = new LinktoolStorage(ctx.cwd, ctx.projectDataDirName);
    const connector = await loadConnector(ctx.cwd);

    const tool = connector.tools?.[toolKey];
    if (!tool) {
        throw new Error(`Tool '${toolKey}' not found.`);
    }

    logger.log(chalk.cyan(`🔧 Configuring: ${tool.name}`));
    if (tool.description) {
        logger.log(chalk.gray(tool.description));
    }
    logger.log('');

    const authData = storage.loadAuth() || {};
    if (!storage.hasAuth() && connector.authentication) {
        logger.warn?.(chalk.yellow('⚠ No auth found. Run `npx linktool auth` first.\n'));
    }

    const config: Record<string, unknown> = {};
    for (const field of tool.inputFields || []) {
        const value = await promptField(field, config, {
            connector,
            authData,
            z: createMockCtx(),
            cwd: ctx.cwd,
            prompt,
        });
        config[field.key] = value;
    }

    const configPath = storage.saveToolConfig(toolKey, config);

    logger.log('');
    logger.log(chalk.green(`✓ Configuration saved to ${configPath}`));
    logger.log(chalk.gray('\nYou can now run:'));
    logger.log(chalk.cyan(`  npx linktool run ${toolKey}`));
}

async function promptField(
    field: any,
    currentConfig: Record<string, unknown>,
    context: {
        connector: any;
        authData: any;
        z: any;
        cwd: string;
        prompt: PromptImpl;
    },
): Promise<unknown> {
    const { connector, authData, z, cwd, prompt } = context;

    let choices = field.choices;
    if (field.dynamic) {
        choices = await resolveDynamicChoices(field.dynamic, currentConfig, { connector, authData, z, cwd });
    }

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
            ? choices.map((choice) => typeof choice === 'string' ? choice : { name: choice.label, value: choice.value })
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

    const answer = await prompt([question]);
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
    currentConfig: Record<string, unknown>,
    context: { connector: any; authData: any; z: any; cwd: string },
): Promise<Array<{ label: string; value: string }>> {
    const parts = dynamic.split('.');
    if (parts.length < 2) {
        throw new Error(`Invalid dynamic format: ${dynamic}. Expected format: "tool_key.value_path.label_path"`);
    }

    const toolKey = parts[0];
    const valuePath = parts[1];
    const labelPath = parts[2] || valuePath;

    const tool = context.connector.tools?.[toolKey];
    if (!tool) {
        throw new Error(`Dynamic tool '${toolKey}' not found`);
    }

    const bundle = buildBundle(context.cwd, {
        authData: context.authData,
        inputData: currentConfig,
    });

    const zWithAuth = createMockCtx(context.connector, bundle);
    let result = await tool.perform(zWithAuth, bundle);

    if (!Array.isArray(result)) {
        result = [result];
    }

    return result.map((item: any) => ({
        value: getNestedValue(item, valuePath),
        label: getNestedValue(item, labelPath),
    }));
}

function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
}
