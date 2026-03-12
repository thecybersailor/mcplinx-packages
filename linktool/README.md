# LinkTool

DevKit for developing RemoteTask connectors locally with fixed OAuth callback URLs.

## Prerequisites

1. **Deploy Tunnel Worker**:
   Deploy the edge worker to Cloudflare Workers.
   ```bash
   cd ../../edge-worker
   npm install
   npm run deploy
   ```
   Configure your domain `tun.dev.mcplinx.com` to point to the deployed worker.

2. **Configuration**:
   Create a `.config.yml` file in your connector project with OAuth Client ID/Secret:
   ```yaml
   vars:
     CLIENT_ID: your_oauth_client_id
   secrets:
     CLIENT_SECRET: your_oauth_client_secret
   ```
   
   **Important**: Configuration must be in `.config.yml` format with explicit `vars` and `secrets` sections. This ensures developers understand that:
   - Variables are accessed via `bundle.vars.KEY` (not `process.env.KEY`)
   - Secrets are accessed via `bundle.secrets.KEY` (not `process.env.KEY`)

## Key Features

### 🔒 Fixed Callback URL
Your OAuth callback URL is **predictable and fixed**, based on your package name:
```
https://tun.dev.mcplinx.com/{package-name}/callback
```

Example:
- Package: `@myorg/github-connector` 
- Callback: `https://tun.dev.mcplinx.com/myorg-github-connector/callback`

This means you **configure OAuth once** in the provider's developer portal, not every debug session.

## Usage

All commands automatically derive the package name from your `package.json`.

### 1. Authentication (OAuth)

Starts a tunnel, opens the OAuth flow, captures the callback, and saves credentials.

```bash
npx linktool auth
```

**Output:**
```
📋 Configure this Callback URL in your OAuth App:
   https://tun.dev.mcplinx.com/my-connector/callback

Opening browser...
✓ Received callback!
✓ Token exchanged successfully!
Credentials saved to .linktool/connection.json
```

### 2. Configure Tool

Interactive configuration for a tool with dynamic field support.

```bash
npx linktool config <tool-key>
```

Example:
```bash
npx linktool config list_issues
```

This will:
- Load dynamic fields (e.g., fetch repositories from API)
- Show dropdown choices for enum fields
- Save configuration to `.linktool/config.json`

### 3. List Tools

List all tools in the connector.

```bash
npx linktool list
```

### 4. Run Tool

Execute a tool locally using saved credentials and configuration.

```bash
npx linktool run <tool-key>
```

Options:
- `--input <json-or-file>`: Override input data (JSON string or file path)
- `--async`: Enable webhook waiting mode

Example:
```bash
# Simple run (uses saved config)
npx linktool run list_issues

# Override specific fields
npx linktool run list_issues --input '{"filter": "created"}'

# With async webhook
npx linktool run create_issue_webhook --async
```

### 5. Tunnel Mode

Manually start a tunnel to inspect incoming webhooks.

```bash
npx linktool tunnel
```

## How It Works

1. **Package Name Derivation**:
   - Reads `package.json` `name` field
   - Sanitizes for URL safety (`@myorg/connector` → `myorg-connector`)
   - Falls back to directory name if no package.json

2. **Durable Objects**:
   - Each package name maps to a unique Cloudflare DO instance
   - WebSocket from CLI connects to your DO
   - HTTP webhooks route to the same DO
   - DO forwards requests to your CLI via WebSocket

3. **OAuth Flow**:
   ```
   CLI → Opens Browser → OAuth Provider → Redirects to Tunnel
   Tunnel (DO) → WebSocket → CLI → Exchanges Token → Saves .linktool/connection.json
   ```

4. **Configuration Storage**:
   - `.linktool/connection.json` - Authentication credentials
   - `.linktool/config.json` - Tool configurations (all tools)

## Complete Workflow Example

```bash
cd my-connector

# 1. Authenticate once
npx linktool auth

# 2. Configure a tool interactively
npx linktool config create_issue
# → Prompts for dynamic repo selection
# → Prompts for title, body, labels, etc.

# 3. Run (uses saved auth + config)
npx linktool run create_issue

# 4. Override specific fields
npx linktool run create_issue --input '{"title": "New bug"}'
```

## Troubleshooting

**Q: Tunnel not connecting?**  
A: Verify the worker is deployed and `tun.dev.mcplinx.com` points to it.

**Q: OAuth callback fails?**  
A: Ensure the callback URL in your OAuth app settings exactly matches:  
`https://tun.dev.mcplinx.com/{your-package-name}/callback`

**Q: Package name collision?**  
A: Use scoped packages (`@yourname/connector`) or unique names in `package.json`.

**Q: `npx linktool` not working?**
A: Make sure you're in the connector directory and run `npm install` first, or use `npx tsx src/index.ts` directly for development.
