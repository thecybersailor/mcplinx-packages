import { Command } from 'commander';
import chalk from 'chalk';
import { CredentialsManager } from '../lib/credentials.js';

export function logoutCommand() {
    return new Command('logout')
        .description('Log out and clear credentials')
        .action(async () => {
            const credsMgr = new CredentialsManager();
            credsMgr.clearCredentials();
            console.log(chalk.green('Logged out successfully.'));
        });
}
