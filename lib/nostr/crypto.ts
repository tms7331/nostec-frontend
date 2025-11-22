import type { NostrEvent } from '@/types/nostr'

/**
 * Create a complete signed Nostr event (PLACEHOLDER - not cryptographically secure)
 */
export async function createSignedEvent(
  event: Omit<NostrEvent, 'id' | 'sig'>,
  privateKeyHex: string
): Promise<NostrEvent> {
  // Simple placeholder ID - just a random string for now
  const id = Math.random().toString(36).substring(2) + Date.now().toString(36)

  // Placeholder signature - empty for now
  const sig = ''

  return {
    ...event,
    id,
    sig
  }
}
