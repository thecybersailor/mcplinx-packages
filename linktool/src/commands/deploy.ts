import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import axios from 'axios';
import { createDeveloperApiClient, ApiError } from '../lib/api-client.js';

export function deployCommand() {
    return new Command('deploy')
        .description('Deploy connector to Registry (build, upload, and deploy to instance)')
        .option('--build-only', 'Only build, do not upload or deploy', false)
        .option('--publish-only', 'Skip build, only upload and deploy (requires pre-built dist/)', false)
        .option('--instance <id>', 'Deploy to specific instance (optional, auto-selects if not provided)')
        .action(async (options) => {
            const cwd = process.cwd();
            const distDir = join(cwd, 'dist');
            const manifestPath = join(distDir, 'manifest.json');
            const bundlePath = join(distDir, 'bundle.js');  // Use .js extension

            // Read package.json to get name and version
            const pkgJsonPath = join(cwd, 'package.json');
            if (!existsSync(pkgJsonPath)) {
                console.error(chalk.red('Error: package.json not found'));
                process.exit(1);
            }

            const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
            const packageName = pkgJson.name;

            if (!packageName) {
                console.error(chalk.red('Error: package.json must have a \"name\" field'));
                process.exit(1);
            }

            console.log(chalk.blue('🚀 Deploying connector...'));
            console.log(chalk.gray(`Package: ${packageName}`));

            // Phase 1: Build (unless --publish-only)
            if (!options.publishOnly) {
                const needsBuild = !existsSync(manifestPath) || !existsSync(bundlePath);

                if (needsBuild) {
                    console.log(chalk.blue('\n📦 Building connector...'));
                    await runBuild(cwd);
                } else {
                    console.log(chalk.gray('✓ Build artifacts found, skipping build'));
                }

                if (options.buildOnly) {
                    console.log(chalk.green('\n✓ Build complete! (--build-only flag set)'));
                    return;
                }
            } else {
                // --publish-only: Validate that build artifacts exist
                if (!existsSync(manifestPath) || !existsSync(bundlePath)) {
                    console.error(chalk.red('Error: Build artifacts not found. Please run \"syntool build\" first.'));
                    process.exit(1);
                }
            }

            // Phase 2: Upload (unless --build-only)
            if (!options.buildOnly) {
                console.log(chalk.blue('\n📤 Uploading to R2...'));

                const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
                const bundle = readFileSync(bundlePath); // Buffer

                try {
                    const api = createDeveloperApiClient();

                    // Get Upload URLs
                    console.log('Requesting upload URLs...');
                    const files = ['bundle.js', 'manifest.json'];  // Use .js extension

                    const uploadInfo = await api.developer.registryUploadUrlCreate({
                        name: packageName,
                        files
                    });

                    if (!uploadInfo || !uploadInfo.upload_urls) {
                        console.error(chalk.red('Failed to get upload URLs'));
                        process.exit(1);
                    }

                    // Upload to R2
                    try {
                        // Upload Bundle
                        console.log('Uploading bundle.js...');
                        await axios.put(uploadInfo.upload_urls['bundle.js'], bundle, {
                            headers: {
                                'Content-Type': 'application/javascript'
                            }
                        });
                        console.log(chalk.green('✓ Uploaded bundle.js'));

                        // Upload Manifest
                        console.log('Uploading manifest.json...');
                        await axios.put(uploadInfo.upload_urls['manifest.json'], JSON.stringify(manifest), {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        console.log(chalk.green('✓ Uploaded manifest.json'));

                    } catch (e: any) {
                        console.error(chalk.red('Upload failed:'), e.message);
                        if (e.response) {
                            console.error(chalk.red('Response:'), e.response.status, e.response.data);
                        }
                        process.exit(1);
                    }

                    // Phase 3: Publish (backend generates revision)
                    console.log(chalk.blue('\n📝 Publishing...'));

                    const publishRequest: any = {
                        name: packageName,
                    };

                    const publishResult = await api.developer.registryPublishCreate(publishRequest);
                    const generatedVersion = publishResult.version;
                    console.log(chalk.green(`✓ Published with version: ${generatedVersion}`));

                    // Phase 4: Deploy
                    console.log(chalk.blue('\n🚀 Deploying...'));
                    const deployResult = await api.developer.registryDeployCreate({
                        name: packageName,
                        version: generatedVersion,
                        instance_id: options.instance
                    });

                    if (deployResult.needs_selection) {
                        console.log(chalk.yellow('\n⚠️  Multiple instances found. Please select one:'));
                        console.log(chalk.gray('   Available instances:'));
                        (deployResult.available_instances || []).forEach((inst: any, idx: number) => {
                            console.log(chalk.gray(`   ${idx + 1}. ${inst.name} (${inst.id}) - ${inst.visibility} - version ${inst.version}`));
                        });
                        console.log(chalk.yellow('\n   Run: syntool deploy --instance <instance-id>'));
                        process.exit(0);
                    }

                    console.log(chalk.green('\n✅ Deployment successful!'));
                    console.log(`   Instance: ${deployResult.instance_name} (${deployResult.instance_id})`);
                    console.log(`   Version: ${deployResult.version}`);
                    if (deployResult.message) {
                        console.log(chalk.gray(`   ${deployResult.message}`));
                    }

                } catch (error: any) {
                    if (error instanceof ApiError) {
                        console.error(chalk.red('API Error:'), error.message);
                        if (error.statusCode === 401) {
                            console.error(chalk.yellow('Your session may have expired. Please run: syntool login'));
                        }
                    } else {
                        console.error(chalk.red('Deploy failed:'), error.message);
                    }
                    process.exit(1);
                }
            }
        });
}

async function runBuild(cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Import build command and execute it programmatically
        // Since build is a command, we'll spawn it as a subprocess
        const buildProcess = spawn('npx', ['syntool', 'build'], {
            cwd,
            stdio: 'inherit',
            shell: true
        });

        buildProcess.on('exit', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Build failed with exit code ${code}`));
            }
        });

        buildProcess.on('error', (err) => {
            reject(err);
        });
    });
}
