/**
 * Encryption/Decryption utilities using Web Crypto API (AES-GCM)
 */

import * as secp256k1 from '@noble/secp256k1'

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

/**
 * Encrypt an encryption key for a specific recipient using ECDH
 * Similar to NIP-04 style encryption
 * @param encryptionKey - The encryption key to share (hex string)
 * @param recipientPubkey - Recipient's Nostr public key (hex string)
 * @param senderPrivkey - Sender's Nostr private key (hex string)
 * @returns Encrypted key as base64 string
 */
export async function encryptKeyForRecipient(
  encryptionKey: string,
  recipientPubkey: string,
  senderPrivkey: string
): Promise<string> {
  try {
    // Convert keys to bytes
    const privkeyBytes = new Uint8Array(
      senderPrivkey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    )
    const pubkeyBytes = new Uint8Array(
      ('02' + recipientPubkey).match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    )

    // Derive shared secret using ECDH
    const sharedPoint = secp256k1.getSharedSecret(privkeyBytes, pubkeyBytes)
    const sharedSecret = sharedPoint.slice(1, 33) // Take x-coordinate

    // Use shared secret to encrypt the encryption key
    const encrypted = await encryptContent(encryptionKey, Array.from(sharedSecret).map(b => b.toString(16).padStart(2, '0')).join(''))

    return encrypted
  } catch (error) {
    console.error('[Nostec] Key encryption failed:', error)
    throw new Error('Failed to encrypt key for recipient')
  }
}

/**
 * Decrypt an encryption key from a sender using ECDH
 * @param encryptedKey - The encrypted key (base64 string)
 * @param senderPubkey - Sender's Nostr public key (hex string)
 * @param recipientPrivkey - Recipient's Nostr private key (hex string)
 * @returns Decrypted encryption key as hex string
 */
export async function decryptKeyFromSender(
  encryptedKey: string,
  senderPubkey: string,
  recipientPrivkey: string
): Promise<string> {
  try {
    // Convert keys to bytes
    const privkeyBytes = new Uint8Array(
      recipientPrivkey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    )
    const pubkeyBytes = new Uint8Array(
      ('02' + senderPubkey).match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
    )

    // Derive same shared secret using ECDH
    const sharedPoint = secp256k1.getSharedSecret(privkeyBytes, pubkeyBytes)
    const sharedSecret = sharedPoint.slice(1, 33) // Take x-coordinate

    // Use shared secret to decrypt the encryption key
    const decrypted = await decryptContent(encryptedKey, Array.from(sharedSecret).map(b => b.toString(16).padStart(2, '0')).join(''))

    return decrypted
  } catch (error) {
    console.error('[Nostec] Key decryption failed:', error)
    throw new Error('Failed to decrypt key from sender')
  }
}
