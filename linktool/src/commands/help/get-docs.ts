import { Command } from 'commander';
import { createHelpCommandContext, getDocsCommandRunner } from '../../core/help.js';

export function getDocsCommand() {
    return new Command('get-docs')
        .description('Download and extract connector documentation')
        .action(async () => {
            try {
                await getDocsCommandRunner(createHelpCommandContext({
                    cwd: process.cwd(),
                }));
            } catch (error: any) {
                console.error(error.message);
                process.exit(1);
            }
        });
}
