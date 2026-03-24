import { Command } from 'commander';

// Authentication Commands
import { loginCommand } from './commands/login.js';
import { logoutCommand } from './commands/logout.js';
import { whoamiCommand } from './commands/whoami.js';

// Local Development Commands
import { toolsCommand } from './commands/tools.js';
import { buildCommand } from './commands/build.js';
import { deployCommand } from './commands/deploy.js';

// Subcommand Groups
import { testCommand } from './commands/test/index.js';
import { remoteCommand } from './commands/remote/index.js';
import { helpCommand } from './commands/help/index.js';

// Package info injected at build time
const pkg = {
    version: process.env.PKG_VERSION || '0.0.0',
    description: process.env.PKG_DESCRIPTION || 'DevKit for MCPLINX Connectors',
    name: process.env.PKG_NAME || '@mcplinx/linktool',
};

const program = new Command();

program
    .name('syntool')
    .description(pkg.description)
    .version(pkg.version);

// Custom help configuration
program.configureHelp({
    formatHelp: (cmd, helper) => {
        const termWidth = helper.padWidth(cmd, helper);
        const helpWidth = helper.helpWidth || 80;

        let output = '';

        // Usage
        output += `Usage: ${helper.commandUsage(cmd)}\n\n`;

        // Description
        if (cmd.description()) {
            output += `${cmd.description()}\n\n`;
        }

        // Options
        const globalOptions = [
            '  -V, --version              output the version number',
            '  -h, --help                 display help for command'
        ];
        output += 'Options:\n';
        output += globalOptions.join('\n') + '\n\n';

        // Authentication Commands
        output += 'Authentication Commands:\n';
        output += '  login [options]            Login to mcplinx\n';
        output += '  logout                     Log out and clear credentials\n';
        output += '  whoami                     Display the currently logged in user\n\n';

        // Development Commands
        output += 'Development Commands:\n';
        output += '  tools                      List tools in current connector\n';
        output += '  build                      Build connector for publishing\n';
        output += '  deploy                     Deploy connector to remote registry (build, upload, register)\n\n';

        // Testing Commands
        output += 'Testing Commands:\n';
        output += '  test run <tool-key>        Run a tool locally\n';
        output += '  test config <tool-key>     Configure a tool interactively\n';
        output += '  test auth                  Start OAuth flow for a connector\n\n';

        // Registry Commands
        output += 'Registry Commands:\n';
        output += '  remote list                List my published connectors\n';
        output += '  remote info <pkg-id>       View connector package details\n';
        output += '  remote use <pkg-id> <ver>  Set active version for a package\n';
        output += '  remote delete <pkg-id>     Delete a connector package or version\n\n';

        // Help Commands
        output += 'Help Commands:\n';
        output += '  help get-docs              Download and extract connector documentation to .syntool/docs/\n';
        output += '  help get-examples          Download and extract connector examples to .syntool/examples/\n\n';

        // Footer
        output += 'Run \'syntool <command> --help\' for more information on a command.\n';

        return output;
    }
});

// Authentication
program.addCommand(loginCommand());
program.addCommand(logoutCommand());
program.addCommand(whoamiCommand());

// Local Development
program.addCommand(toolsCommand());
program.addCommand(buildCommand());
program.addCommand(deployCommand());

// Command Groups
program.addCommand(testCommand());
program.addCommand(remoteCommand());
program.addCommand(helpCommand());

// Add error handling for missing current working directory
try {
    process.cwd();
} catch (error: any) {
    if (error.code === 'ENOENT') {
        console.error('Error: Current working directory does not exist.');
        console.error('Please navigate to a valid directory and try again.');
        process.exit(1);
    }
    throw error;
}

program.parse();
