import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export const DEFAULT_HOME_DATA_DIR = '.linktool';
const CREDS_FILE = 'credentials.json';

export interface Credentials {
    token: string;
    refreshToken?: string;
    email: string;
    expiresAt?: string;
    host?: string;
    appId?: string;
}

type CredentialsManagerOptions = {
    homeDir?: string;
    dataDirName?: string;
};

export class CredentialsManager {
    private credsPath: string;

    constructor(options: CredentialsManagerOptions = {}) {
        const baseHome = options.homeDir || process.env.LINKTOOL_HOME || process.env.MCPLINX_LINKTOOL_HOME || homedir();
        const dataDirName = options.dataDirName || DEFAULT_HOME_DATA_DIR;
        this.credsPath = join(baseHome, dataDirName);
        this.ensureDir();
    }

    private ensureDir() {
        if (!existsSync(this.credsPath)) {
            mkdirSync(this.credsPath, { recursive: true });
        }
    }

    saveCredentials(creds: Credentials) {
        const path = join(this.credsPath, CREDS_FILE);
        writeFileSync(path, JSON.stringify(creds, null, 2));
        return path;
    }

    loadCredentials(): Credentials | null {
        const path = join(this.credsPath, CREDS_FILE);
        if (!existsSync(path)) return null;
        try {
            return JSON.parse(readFileSync(path, 'utf-8'));
        } catch (e) {
            return null;
        }
    }

    hasCredentials(): boolean {
        const creds = this.loadCredentials();
        return creds !== null && !!creds.token;
    }

    clearCredentials() {
        const path = join(this.credsPath, CREDS_FILE);
        if (existsSync(path)) {
            writeFileSync(path, '{}');
        }
    }
}
