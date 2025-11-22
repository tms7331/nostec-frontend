import { keccak_256 } from '@noble/hashes/sha3'

/**
 * Convert a secp256k1 public key to an Ethereum address
 * @param publicKeyHex - 64-character hex public key (without 04 prefix)
 * @returns Ethereum address with 0x prefix
 */
export function publicKeyToEthereumAddress(publicKeyHex: string): string {
  // Remove 0x prefix if present
  const cleanKey = publicKeyHex.replace(/^0x/, '')

  // Convert hex to bytes
  const publicKeyBytes = new Uint8Array(
    cleanKey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  )

  // Hash the public key with Keccak-256
  const hash = keccak_256(publicKeyBytes)

  // Take the last 20 bytes and convert to hex
  const addressBytes = hash.slice(-20)
  const address = '0x' + Array.from(addressBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return address
}
