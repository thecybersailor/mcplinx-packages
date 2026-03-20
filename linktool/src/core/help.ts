import chalk from 'chalk';
import { exec } from 'child_process';
import { copyFile, mkdir, unlink } from 'fs/promises';
import { createWriteStream, existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import https from 'https';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

const DOCS_URL = 'https://github.com/thecybersailor/remote-connector-docs/archive/refs/heads/main.zip';
const EXAMPLES_URL = 'https://github.com/thecybersailor/remote-connector-examples/archive/refs/heads/main.zip';

export type HelpCommandContext = {
    cwd: string;
    logger?: Pick<typeof console, 'log' | 'error'>;
};

export function createHelpCommandContext(input: HelpCommandContext): HelpCommandContext {
    return {
        logger: console,
        ...input,
    };
}

export async function getDocsCommandRunner(ctx: HelpCommandContext): Promise<void> {
    await runDownloadAndExtract({
        ...ctx,
        archiveUrl: DOCS_URL,
        outputDir: '.linktool/docs',
        tempZipName: 'docs-temp.zip',
        tempExtractDirName: 'docs-temp-extract',
        title: 'documentation',
        summaryLabel: 'Documentation',
        locationLabel: 'Documentation is now available at',
    });
}

export async function getExamplesCommandRunner(ctx: HelpCommandContext): Promise<void> {
    await runDownloadAndExtract({
        ...ctx,
        archiveUrl: EXAMPLES_URL,
        outputDir: '.linktool/examples',
        tempZipName: 'examples-temp.zip',
        tempExtractDirName: 'examples-temp-extract',
        title: 'examples',
        summaryLabel: 'Examples',
        locationLabel: 'Examples are now available at',
    });
}

type DownloadAndExtractContext = HelpCommandContext & {
    archiveUrl: string;
    outputDir: string;
    tempZipName: string;
    tempExtractDirName: string;
    title: string;
    summaryLabel: string;
    locationLabel: string;
};

async function runDownloadAndExtract(ctx: DownloadAndExtractContext): Promise<void> {
    const logger = ctx.logger ?? console;
    const targetPath = join(ctx.cwd, ctx.outputDir);
    const tempZipPath = join(ctx.cwd, '.linktool', ctx.tempZipName);

    try {
        logger.log(chalk.blue(`📥 Downloading ${ctx.title}...`));
        logger.log(chalk.gray(`URL: ${ctx.archiveUrl}`));

        const linktoolDir = join(ctx.cwd, '.linktool');
        if (!existsSync(linktoolDir)) {
            mkdirSync(linktoolDir, { recursive: true });
        }

        await downloadFile(ctx.archiveUrl, tempZipPath);

        logger.log(chalk.green('✓ Download complete'));
        logger.log(chalk.blue(`📦 Extracting ${ctx.title}...`));

        if (!existsSync(targetPath)) {
            mkdirSync(targetPath, { recursive: true });
        }

        await extractZip(tempZipPath, targetPath, ctx.tempExtractDirName);
        await unlink(tempZipPath);

        logger.log(chalk.green(`✓ ${ctx.summaryLabel} extracted to ${ctx.outputDir}`));
        logger.log(chalk.cyan(`\n${ctx.locationLabel}: ${targetPath}`));
    } catch (error: any) {
        logger.error(chalk.red(`Error downloading ${ctx.title}:`), error.message);
        throw error;
    }
}

async function downloadFile(url: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = createWriteStream(destPath);

        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                return downloadFile(response.headers.location!, destPath)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                file.close();
                reject(new Error(`Failed to download: ${response.statusCode} ${response.statusMessage}`));
                return;
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            file.close();
            reject(err);
        });
    });
}

async function extractZip(zipPath: string, destPath: string, tempExtractDirName: string): Promise<void> {
    const isWindows = process.platform === 'win32';
    const tempExtractPath = join(destPath, '..', tempExtractDirName);

    try {
        await mkdir(tempExtractPath, { recursive: true });

        if (isWindows) {
            await execAsync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempExtractPath}' -Force"`);
        } else {
            await execAsync(`unzip -q "${zipPath}" -d "${tempExtractPath}"`);
        }

        const extractedDirs = readdirSync(tempExtractPath);
        if (extractedDirs.length > 0) {
            const extractedDir = join(tempExtractPath, extractedDirs[0]);
            await copyRecursive(extractedDir, destPath);
        }

        rmSync(tempExtractPath, { recursive: true, force: true });
    } catch (error: any) {
        throw new Error(`Failed to extract zip file: ${error.message}. Please ensure 'unzip' (macOS/Linux) or PowerShell (Windows) is available.`);
    }
}

async function copyRecursive(src: string, dest: string): Promise<void> {
    const entries = readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);

        if (entry.isDirectory()) {
            await mkdir(destPath, { recursive: true });
            await copyRecursive(srcPath, destPath);
        } else {
            await copyFile(srcPath, destPath);
        }
    }
}
