import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CredentialsManager } from '../lib/credentials.js';

function createTempDir(prefix: string): string {
    return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('credentials manager', () => {
    const tempDirs: string[] = [];

    afterEach(() => {
        while (tempDirs.length > 0) {
            const dir = tempDirs.pop();
            if (dir) fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('stores credentials inside injected home data dir instead of ~/.linktool', () => {
        const homeDir = createTempDir('linktool-creds-home-');
        tempDirs.push(homeDir);

        const manager = new CredentialsManager({
            homeDir,
            dataDirName: '.syntool',
        });

        manager.saveCredentials({
            token: 'token_1',
            email: 'demo@example.com',
        });

        expect(fs.existsSync(path.join(homeDir, '.syntool', 'credentials.json'))).toBe(true);
        expect(fs.existsSync(path.join(homeDir, '.linktool', 'credentials.json'))).toBe(false);
    });
});
