export function cn(...inputs: Array<unknown>) {
  return inputs.filter(Boolean).join(' ')
}
