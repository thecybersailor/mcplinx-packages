import { Command } from 'commander';
import chalk from 'chalk';
import { createDeveloperApiClient, ApiError } from '../../lib/api-client.js';

export function listCommand() {
    return new Command('list')
        .description('List my published connectors')
        .action(async () => {
            try {
                const api = createDeveloperApiClient();

                console.log(chalk.blue('📦 Fetching your connectors...'));

                // Fetch connectors using SDK
                const connectors = await api.developer.registryConnectorsList();

                if (connectors.length === 0) {
                    console.log(chalk.yellow('\nNo connectors found. Publish your first connector with:'));
                    console.log(chalk.gray('  syntool build'));
                    console.log(chalk.gray('  syntool remote publish'));
                    process.exit(0);
                }

                console.log(chalk.green(`\n✓ Found ${connectors.length} connector(s):\n`));

                // Display connectors with correct field names (camelCase from SDK)
                for (const conn of connectors) {
                    console.log(chalk.cyan(`  ${conn.id}`));
                    console.log(chalk.gray(`    Name: ${conn.name}`));
                    console.log(chalk.gray(`    Active Version: ${conn.activeVersion || 'none'}`));
                    console.log(chalk.gray(`    Visibility: ${conn.visibility || 'private'}`));
                    console.log(chalk.gray(`    Status: ${conn.status || 'active'}`));
                    if (conn.description) {
                        console.log(chalk.gray(`    Description: ${conn.description}`));
                    }
                    console.log('');
                }

                console.log(chalk.gray(`Run 'syntool remote info <pkg-id>' for more details.`));

            } catch (error: any) {
                if (error instanceof ApiError) {
                    console.error(chalk.red('API Error:'), error.message);
                    console.error(chalk.gray('Error details:'), JSON.stringify({
                        statusCode: error.statusCode,
                        key: error.key,
                        traceId: error.traceId
                    }, null, 2));
                    if (error.statusCode === 401) {
                        console.error(chalk.yellow('Your session may have expired. Please run: syntool login'));
                    }
                } else {
                    console.error(chalk.red('Failed to list connectors:'), error.message);
                    console.error(chalk.gray('Error stack:'), error.stack);
                }
                process.exit(1);
            }
        });
}
