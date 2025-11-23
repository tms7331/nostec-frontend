"use client"

import { AztecWalletSdk, obsidion } from "@nemi-fi/wallet-sdk"

// Initialize Obsidian SDK
const NODE_URL = "https://devnet.aztec-labs.com"
const WALLET_URL = "https://app.obsidion.xyz"

let sdk: AztecWalletSdk | null = null

export function getObsidianSdk() {
  if (!sdk && typeof window !== 'undefined') {
    sdk = new AztecWalletSdk({
      aztecNode: NODE_URL,
      connectors: [obsidion({ walletUrl: WALLET_URL })]
    })
  }
  return sdk
}
