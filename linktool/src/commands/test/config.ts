import { Command } from 'commander';
import chalk from 'chalk';
import { runTestConfig } from '../../core/test-config.js';

export function configCommand() {
    return new Command('config')
        .description('Configure a tool interactively')
        .argument('<tool-key>', 'Tool key to configure')
        .action(async (toolKey) => {
            try {
                await runTestConfig({
                    cwd: process.cwd(),
                }, toolKey);
            } catch (e: any) {
                console.error(chalk.red('Configuration failed:'), e.message);
                if (e.stack) console.error(chalk.gray(e.stack));
                process.exit(1);
            }
        });
}
