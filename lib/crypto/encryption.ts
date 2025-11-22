/**
 * Encryption/Decryption utilities using Web Crypto API (AES-GCM)
 */

/**
 * Generate a random encryption key
 * Returns hex string
 */
export function generateEncryptionKey(): string {
  const key = new Uint8Array(32) // 256-bit key
  crypto.getRandomValues(key)
  return Array.from(key)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Encrypt content using AES-GCM
 * Returns base64 encoded: iv(12 bytes) + ciphertext + authTag(16 bytes)
 */
export async function encryptContent(content: string, keyHex: string): Promise<string> {
  // Convert hex key to bytes
  const keyBytes = new Uint8Array(
    keyHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  )

  // Import the key
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  )

  // Generate random IV (12 bytes for AES-GCM)
  const iv = new Uint8Array(12)
  crypto.getRandomValues(iv)

  // Encrypt the content
  const encoder = new TextEncoder()
  const data = encoder.encode(content)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  )

  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encrypted), iv.length)

  // Return as base64
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt content using AES-GCM
 * Expects base64 encoded: iv(12 bytes) + ciphertext + authTag(16 bytes)
 */
export async function decryptContent(encryptedBase64: string, keyHex: string): Promise<string> {
  try {
    // Convert hex key to bytes
    const keyBytes = new Uint8Array(
      keyHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    )

    // Import the key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )

    // Decode base64
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0))

    // Extract IV (first 12 bytes) and ciphertext (rest)
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    )

    // Convert to string
    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    console.error('[Nostec] Decryption failed:', error)
    throw new Error('Decryption failed - invalid key or corrupted data')
  }
}
