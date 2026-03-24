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

    it('stores credentials inside the injected home data dir', () => {
        const homeDir = createTempDir('linktool-creds-home-');
        tempDirs.push(homeDir);
        const dataDirName = '.custom-linktool-home';

        const manager = new CredentialsManager({
            homeDir,
            dataDirName,
        });

        manager.saveCredentials({
            token: 'token_1',
            email: 'demo@example.com',
        });

        expect(fs.existsSync(path.join(homeDir, dataDirName, 'credentials.json'))).toBe(true);
    });
});
