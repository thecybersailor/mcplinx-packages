export function bestEffortCloseWindow() {
  if (typeof window === 'undefined' || typeof window.close !== 'function') return
  try {
    window.close()
  } catch {
    // Browsers may reject closing tabs they did not open.
  }
}
