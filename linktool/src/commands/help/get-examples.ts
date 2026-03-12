import { Command } from 'commander';
import chalk from 'chalk';
import { mkdirSync, existsSync, createWriteStream, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import https from 'https';
import { promisify } from 'util';
import { exec } from 'child_process';
import { copyFile, mkdir, unlink } from 'fs/promises';

const execAsync = promisify(exec);

const EXAMPLES_URL = 'https://github.com/thecybersailor/remote-connector-examples/archive/refs/heads/main.zip';
const EXAMPLES_DIR = '.linktool/examples';

export function getExamplesCommand() {
    return new Command('get-examples')
        .description('Download and extract connector examples')
        .action(async () => {
            const cwd = process.cwd();
            const examplesPath = join(cwd, EXAMPLES_DIR);
            const tempZipPath = join(cwd, '.linktool', 'examples-temp.zip');

            try {
                console.log(chalk.blue('📥 Downloading examples...'));
                console.log(chalk.gray(`URL: ${EXAMPLES_URL}`));

                // Create .linktool directory if it doesn't exist
                const linktoolDir = join(cwd, '.linktool');
                if (!existsSync(linktoolDir)) {
                    mkdirSync(linktoolDir, { recursive: true });
                }

                // Download the zip file
                await downloadFile(EXAMPLES_URL, tempZipPath);

                console.log(chalk.green('✓ Download complete'));

                // Extract zip file
                console.log(chalk.blue('📦 Extracting examples...'));

                // Create examples directory
                if (!existsSync(examplesPath)) {
                    mkdirSync(examplesPath, { recursive: true });
                }

                // Extract zip
                await extractZip(tempZipPath, examplesPath);

                // Remove temp zip file
                await unlink(tempZipPath);

                console.log(chalk.green(`✓ Examples extracted to ${EXAMPLES_DIR}`));
                console.log(chalk.cyan(`\nExamples are now available at: ${examplesPath}`));
            } catch (error: any) {
                console.error(chalk.red('Error downloading examples:'), error.message);
                process.exit(1);
            }
        });
}

async function downloadFile(url: string, destPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const file = createWriteStream(destPath);
        
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Handle redirect
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

async function extractZip(zipPath: string, destPath: string): Promise<void> {
    // Try to use unzip command first (available on macOS and Linux)
    // On Windows, try PowerShell's Expand-Archive
    const isWindows = process.platform === 'win32';
    
    try {
        if (isWindows) {
            // Use PowerShell Expand-Archive on Windows
            const tempExtractPath = join(destPath, '..', 'examples-temp-extract');
            await mkdir(tempExtractPath, { recursive: true });
            
            await execAsync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempExtractPath}' -Force"`);
            
            // Move contents from extracted folder
            const extractedDirs = readdirSync(tempExtractPath);
            if (extractedDirs.length > 0) {
                const extractedDir = join(tempExtractPath, extractedDirs[0]);
                await copyRecursive(extractedDir, destPath);
            }
            
            // Clean up temp directory
            rmSync(tempExtractPath, { recursive: true, force: true });
        } else {
            // Use unzip command on macOS/Linux
            const tempExtractPath = join(destPath, '..', 'examples-temp-extract');
            await mkdir(tempExtractPath, { recursive: true });
            
            await execAsync(`unzip -q "${zipPath}" -d "${tempExtractPath}"`);
            
            // Move contents from extracted folder
            const extractedDirs = readdirSync(tempExtractPath);
            if (extractedDirs.length > 0) {
                const extractedDir = join(tempExtractPath, extractedDirs[0]);
                await copyRecursive(extractedDir, destPath);
            }
            
            // Clean up temp directory
            rmSync(tempExtractPath, { recursive: true, force: true });
        }
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
