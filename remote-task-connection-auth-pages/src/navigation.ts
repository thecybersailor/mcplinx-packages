export function replaceLocation(url: string) {
  if (typeof window === 'undefined') return
  window.location.replace(url)
}
