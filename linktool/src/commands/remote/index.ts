import { Command } from 'commander';
import { listCommand } from './list.js';
import { infoCommand } from './info.js';
import { useCommand } from './use.js';
import { deleteCommand } from './delete.js';

export function remoteCommand() {
    const cmd = new Command('remote')
        .description('Remote registry management');

    cmd.addCommand(listCommand());
    cmd.addCommand(infoCommand());
    cmd.addCommand(useCommand());
    cmd.addCommand(deleteCommand());

    return cmd;
}
