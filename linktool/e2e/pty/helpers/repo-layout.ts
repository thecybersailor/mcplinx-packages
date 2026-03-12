import { existsSync } from 'node:fs'
import path from 'node:path'

export type RepoLayout = {
  root: string
  linktoolEntrypoint: string
  connectorExampleApiKeyDir: string
  localIssuerEntrypoint: string | null
}

function firstExisting(candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }
  return null
}

export function resolveRepoLayout(): RepoLayout | null {
  const roots = [path.resolve(process.cwd(), '../..'), path.resolve(process.cwd(), '..')]

  for (const root of roots) {
    const linktoolEntrypoint = firstExisting([
      path.join(root, 'packages/linktool/src/index.ts'),
      path.join(root, 'linktool/src/index.ts'),
    ])
    if (!linktoolEntrypoint) {
      continue
    }

    const connectorExampleApiKeyDir =
      firstExisting([
        path.join(root, 'packages/remote-connector-examples/connector-example-api-key'),
        path.join(root, 'remote-connector-examples/connector-example-api-key'),
      ]) ?? ''

    return {
      root,
      linktoolEntrypoint,
      connectorExampleApiKeyDir,
      localIssuerEntrypoint: firstExisting([
        path.join(root, 'tools/local-issuer/src/server.ts'),
      ]),
    }
  }

  return null
}
