import { Command } from 'commander';
import chalk from 'chalk';
import { loadConnector } from '../lib/connector-loader.js';

export function toolsCommand() {
    return new Command('tools')
        .description('List tools in current connector')
        .action(async () => {
            try {
                const connector = await loadConnector(process.cwd());
                console.log(chalk.bold.cyan('Connector loaded successfully'));

                // Tools
                if (connector.tools && Object.keys(connector.tools).length > 0) {
                    console.log(chalk.bold('\nTools:'));
                    for (const [key, t] of Object.entries(connector.tools)) {
                        const tool = t as any;
                        console.log(`  ${chalk.green(key)}: ${tool.name}`);
                        if (tool.description) {
                            console.log(`    ${chalk.gray(tool.description)}`);
                        }
                        console.log(`    ${chalk.gray(`Type: ${tool.kind}`)}`);
                    }
                } else {
                    console.log(chalk.gray('\nNo tools defined.'));
                }

                console.log();
            } catch (e: any) {
                console.error(chalk.red('Error listing tools:'), e.message);
                process.exit(1);
            }
        });
}
