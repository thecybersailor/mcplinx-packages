type BuildCliLoginUrlArgs = {
  webBaseUrl: string
  sessionId: string
  apiBaseUrl: string
}

export function buildCliLoginUrl(args: BuildCliLoginUrlArgs): string {
  const web = String(args.webBaseUrl || '').replace(/\/$/, '')
  const api = String(args.apiBaseUrl || '').replace(/\/$/, '')

  const u = new URL(`${web}/my/cli-login`)
  u.searchParams.set('cli_session', args.sessionId)
  u.searchParams.set('host', api)
  return u.toString()
}
