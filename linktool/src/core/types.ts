export type LinktoolCoreContext = {
  cwd: string
  tunnelBaseUrl?: string
  credentialsPath?: string
  logger?: Pick<typeof console, 'log' | 'error' | 'warn'>
}

export function createLinktoolCoreContext(input: LinktoolCoreContext): LinktoolCoreContext {
  return {
    logger: console,
    ...input,
  }
}
