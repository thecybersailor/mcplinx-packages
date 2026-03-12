/**
 * Unwrap Pin framework response format
 * 
 * Pin framework returns responses in format: { data: T, trace_id?: string }
 * This function extracts the data field.
 */
export function unwrapPinResponse<T>(response: any): T {
  // If response is already the data (not wrapped), return it
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data as T;
  }
  // If response is not wrapped, return it as-is
  return response as T;
}

