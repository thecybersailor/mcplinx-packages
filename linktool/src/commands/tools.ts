import { Command } from 'commander';
import { runTools } from '../core/project.js';

export function toolsCommand() {
    return new Command('tools')
        .description('List tools in current connector')
        .action(async () => {
            try {
                await runTools({
                    cwd: process.cwd(),
                });
            } catch (e: any) {
                console.error(e.message);
                process.exit(1);
            }
        });
}
