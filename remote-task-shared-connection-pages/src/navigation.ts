export function navigateTo(url: string) {
  if (typeof window === 'undefined') return
  window.location.href = url
}
