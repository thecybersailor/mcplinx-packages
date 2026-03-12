/**
 * Extract user hashid (user_id) from JWT token
 */
export function getUserHashIdFromToken(token: string): string | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const decoded = atob(padded);
        const payload = JSON.parse(decoded);

        // Extract user_id from app_metadata
        if (payload.app_metadata?.user_id) {
            return payload.app_metadata.user_id;
        }

        return null;
    } catch (error) {
        return null;
    }
}
