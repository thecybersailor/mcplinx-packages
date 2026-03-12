import { Command } from 'commander';
import { getDocsCommand } from './get-docs.js';
import { getExamplesCommand } from './get-examples.js';

export function helpCommand() {
    const cmd = new Command('help')
        .description('Help and documentation commands');

    cmd.addCommand(getDocsCommand());
    cmd.addCommand(getExamplesCommand());

    return cmd;
}
