import axios, { AxiosInstance } from 'axios';
import { CredentialsManager } from './credentials.js';
import chalk from 'chalk';

export class ApiClient {
    private client: AxiosInstance;
    private host: string;

    constructor() {
        const credsMgr = new CredentialsManager();
        const creds = credsMgr.loadCredentials();

        if (!creds || !creds.token) {
            console.error(chalk.red('Error: Not logged in. Please run "syntool login" first.'));
            process.exit(1);
        }

        this.host = creds.host || 'https://api.mcplinx.com';
        this.client = axios.create({
            baseURL: this.host,
            headers: {
                'Authorization': `Bearer ${creds.token}`,
                'Content-Type': 'application/json'
            }
        });
    }

    async getUploadUrls(connectorId: string, version: string, files: string[]) {
        try {
            const res = await this.client.post('/user/developer/registry/upload-url', {
                connector_id: connectorId,
                version,
                files
            });
            return res.data;
        } catch (e: any) {
            this.handleError(e);
        }
    }

    async registerConnector(connectorId: string, version: string) {
        try {
            const res = await this.client.post('/user/developer/registry/publish', {
                connector_id: connectorId,
                version
            });
            return res.data;
        } catch (e: any) {
            this.handleError(e);
        }
    }

    private handleError(e: any) {
        if (e.response) {
            console.error(chalk.red(`API Error (${e.response.status}):`), e.response.data);
        } else {
            console.error(chalk.red('Network Error:'), e.message);
        }
        process.exit(1);
    }
}
