import { Command } from 'commander';
import chalk from 'chalk';
import { runBuild } from '../core/project.js';

export function buildCommand() {
    return new Command('build')
        .description('Build connector for publishing')
        .action(async () => {
            try {
                await runBuild({
                    cwd: process.cwd(),
                });
            } catch (e: any) {
                console.error(chalk.red('Build error:'), e.message);
                process.exit(1);
            }
        });
}
