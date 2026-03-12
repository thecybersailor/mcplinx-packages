import { Command } from 'commander';
import chalk from 'chalk';
import { CredentialsManager } from '../lib/credentials.js';

export function whoamiCommand() {
    return new Command('whoami')
        .description('Display the currently logged in user')
        .action(async () => {
            const credsMgr = new CredentialsManager();
            const creds = credsMgr.loadCredentials();

            if (creds && creds.token) {
                console.log(`Logged in as ${chalk.green(creds.email)}`);
            } else {
                console.log(chalk.red('Not logged in.'));
                process.exit(1);
            }
        });
}
