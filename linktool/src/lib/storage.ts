import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const LINKTOOL_DIR = '.linktool';
const CONNECTION_FILE = 'connection.json';
const CONFIG_FILE = 'config.json';

export interface Connection {
    name: string;
    authData: any;
}

export class LinktoolStorage {
    private cwd: string;
    private linktoolPath: string;

    constructor(cwd: string) {
        this.cwd = cwd;
        this.linktoolPath = join(cwd, LINKTOOL_DIR);
        this.ensureDir();
    }

    private ensureDir() {
        if (!existsSync(this.linktoolPath)) {
            mkdirSync(this.linktoolPath, { recursive: true });
        }
    }

    // Connection management (name + authData)
    saveConnection(connection: Connection): string {
        const path = join(this.linktoolPath, CONNECTION_FILE);
        writeFileSync(path, JSON.stringify(connection, null, 2));
        return path;
    }

    loadConnection(): Connection | null {
        const path = join(this.linktoolPath, CONNECTION_FILE);
        if (!existsSync(path)) return null;
        return JSON.parse(readFileSync(path, 'utf-8'));
    }

    hasConnection(): boolean {
        return existsSync(join(this.linktoolPath, CONNECTION_FILE));
    }

    // Backward compatibility: auth-only methods
    saveAuth(authData: any): string {
        // For backward compatibility, wrap in connection format
        const connection: Connection = {
            name: 'Unknown',
            authData
        };
        return this.saveConnection(connection);
    }

    loadAuth(): any | null {
        const connection = this.loadConnection();
        return connection?.authData || null;
    }

    hasAuth(): boolean {
        return this.hasConnection();
    }

    // Config management
    saveToolConfig(toolKey: string, config: any): string {
        const path = join(this.linktoolPath, CONFIG_FILE);
        let allConfigs: Record<string, any> = {};

        if (existsSync(path)) {
            allConfigs = JSON.parse(readFileSync(path, 'utf-8'));
        }

        allConfigs[toolKey] = config;
        writeFileSync(path, JSON.stringify(allConfigs, null, 2));
        return path;
    }

    loadToolConfig(toolKey: string): any | null {
        const path = join(this.linktoolPath, CONFIG_FILE);
        if (!existsSync(path)) return null;

        const allConfigs = JSON.parse(readFileSync(path, 'utf-8'));
        return allConfigs[toolKey] || null;
    }

    loadAllConfigs(): Record<string, any> {
        const path = join(this.linktoolPath, CONFIG_FILE);
        if (!existsSync(path)) return {};
        return JSON.parse(readFileSync(path, 'utf-8'));
    }

    hasToolConfig(toolKey: string): boolean {
        const config = this.loadToolConfig(toolKey);
        return config !== null;
    }
}
