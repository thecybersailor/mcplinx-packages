import { Command } from 'commander';
import { runCommand } from './run.js';
import { configCommand } from './config.js';
import { authCommand } from './auth.js';

export function testCommand() {
    const cmd = new Command('test')
        .description('Local testing commands');

    cmd.addCommand(runCommand());
    cmd.addCommand(configCommand());
    cmd.addCommand(authCommand());

    return cmd;
}
