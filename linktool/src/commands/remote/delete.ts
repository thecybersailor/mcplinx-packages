import { Command } from 'commander';
import chalk from 'chalk';
import { createDeveloperApiClient, ApiError } from '../../lib/api-client.js';
import * as readline from 'readline';

export function deleteCommand() {
    return new Command('delete')
        .description('Delete a connector package or specific version')
        .argument('<pkg-id>', 'Connector package ID')
        .argument('[version]', 'Specific version to delete (omit to delete entire package)')
        .option('-y, --yes', 'Skip confirmation prompt', false)
        .action(async (pkgId, version, options) => {
            try {
                const api = createDeveloperApiClient();

                // Confirm deletion
                if (!options.yes) {
                    const confirmMsg = version
                        ? `Delete version '${version}' of connector '${pkgId}'?`
                        : `Delete entire connector package '${pkgId}' and all its versions?`;

                    const confirmed = await confirm(chalk.yellow(`⚠️  ${confirmMsg} (y/N): `));
                    if (!confirmed) {
                        console.log(chalk.gray('Cancelled.'));
                        process.exit(0);
                    }
                }

                const target = version ? `${pkgId}@${version}` : pkgId;
                console.log(chalk.blue(`🗑️  Deleting ${target}...`));

                // Delete using SDK
                if (version) {
                    await api.developer.registryConnectorsVersionsDelete(pkgId, version);
                } else {
                    await api.developer.registryConnectorsDelete(pkgId);
                }

                console.log(chalk.green(`\n✓ Successfully deleted ${target}`));

            } catch (error: any) {
                if (error instanceof ApiError) {
                    console.error(chalk.red('API Error:'), error.message);
                    if (error.statusCode === 404) {
                        console.error(chalk.yellow(`Connector or version not found.`));
                    } else if (error.statusCode === 401) {
                        console.error(chalk.yellow('Your session may have expired. Please run: linktool login'));
                    }
                } else {
                    console.error(chalk.red('Failed to delete:'), error.message);
                }
                process.exit(1);
            }
        });
}

async function confirm(question: string): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
        });
    });
}
