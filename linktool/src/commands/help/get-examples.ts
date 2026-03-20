import { Command } from 'commander';
import { createHelpCommandContext, getExamplesCommandRunner } from '../../core/help.js';

export function getExamplesCommand() {
    return new Command('get-examples')
        .description('Download and extract connector examples')
        .action(async () => {
            try {
                await getExamplesCommandRunner(createHelpCommandContext({
                    cwd: process.cwd(),
                }));
            } catch (error: any) {
                console.error(error.message);
                process.exit(1);
            }
        });
}
