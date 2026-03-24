#!/usr/bin/env node

import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const program = new Command();

    program
        .name('create-cybersailor-connector')
        .description('Scaffold a new mcplinx connector project')
        .argument('[name]', 'Project name (default: connector)')
        .parse(process.argv);

    const args = program.args;
    const projectName = args[0] || 'connector';
    const projectPath = path.join(process.cwd(), projectName);

    if (fs.existsSync(projectPath)) {
        console.error(chalk.red(`Error: Directory ${projectName} already exists.`));
        process.exit(1);
    }

    console.log(chalk.blue(`Creating project in ${projectPath}...`));
    fs.mkdirSync(projectPath, { recursive: true });

    // Copy templates
    // In production (installed/built), templates are in ../templates relative to this file (dist/index.js)
    // In dev (ts-node), they might remain in src/templates
    // We configured build to cp src/templates to dist/templates
    // So if we run from dist/index.js, templates are in ../templates

    // However, since we are using tsc to build to dist/, and we want the bin/index.js to require dist/index.js
    // Let's adjust the structure.
    // If this file is src/index.ts, it compiles to dist/index.js.
    // The templates are copied to dist/templates.
    // So from dist/index.js, templates are in ./templates.

    const templateDir = path.resolve(__dirname, 'templates');

    if (!fs.existsSync(templateDir)) {
        console.error(chalk.red(`Error: Templates not found at ${templateDir}`));
        process.exit(1);
    }

    // Main files to create
    const filesToCreate = [
        { src: 'index.ts.template', dest: 'src/index.ts' },
        { src: 'package.json.template', dest: 'package.json' },
        { src: 'tsconfig.json.template', dest: 'tsconfig.json' },
        { src: '.gitignore.template', dest: '.gitignore' }
    ];

    // Create src directory in the new project
    fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true });

    for (const file of filesToCreate) {
        const srcPath = path.join(templateDir, file.src);
        const destPath = path.join(projectPath, file.dest);

        let content = fs.readFileSync(srcPath, 'utf-8');

        // Replace placeholders
        content = content.replace(/{{PROJECT_NAME}}/g, projectName);

        fs.writeFileSync(destPath, content);
    }

    console.log(chalk.green(`\n✓ Success! Created ${projectName}`));
    console.log('\nNext steps:');
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan('  npm install'));
    console.log(chalk.cyan('  npx linktool login'));
    console.log(chalk.cyan('  npx linktool publish'));
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
