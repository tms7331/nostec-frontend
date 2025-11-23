"use client"

import { useState } from "react"
import { Lock, Unlock, ShieldAlert, Key } from "lucide-react"
import Link from "next/link"
import type { NostrEvent } from "../types/nostr"
import { decryptContent } from "@/lib/crypto/encryption"

interface EventCardProps {
  event: NostrEvent
  decryptedContent?: string
  decryptionFailed?: boolean
}

export function EventCard({ event, decryptedContent: initialDecryptedContent, decryptionFailed }: EventCardProps) {
  const [decryptKey, setDecryptKey] = useState("")
  const [decryptedContent, setDecryptedContent] = useState(initialDecryptedContent)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptError, setDecryptError] = useState<string | null>(null)
  const isEncrypted = event.kind === 4
  const formattedDate = new Date(event.created_at * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  })

  // Display full ENS name if available, otherwise full public key
  const displayName = event.ens_username || event.pubkey

  const handleDecrypt = async () => {
    if (!decryptKey.trim()) return

    setIsDecrypting(true)
    setDecryptError(null)

    try {
      const decrypted = await decryptContent(event.content, decryptKey)
      setDecryptedContent(decrypted)
      setDecryptKey("") // Clear the key input
    } catch (error) {
      setDecryptError("Invalid key or corrupted data")
      console.error("[Nostec] Decryption failed:", error)
    } finally {
      setIsDecrypting(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all hover:shadow-md md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isEncrypted
                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            }`}
          >
            {isEncrypted ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            {isEncrypted ? "Encrypted" : "Plaintext"}
          </span>
          <span className="font-mono text-xs text-muted-foreground break-all" title={event.pubkey}>
            {displayName}
          </span>
        </div>
        <span className="whitespace-nowrap text-xs text-muted-foreground">{formattedDate}</span>
      </div>

      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground break-words">
        {!isEncrypted ? (
          event.content
        ) : (
          <div className="flex flex-col gap-2">
            {decryptedContent ? (
              <>
                <div className="flex items-center gap-2 text-xs font-medium text-green-600 dark:text-green-400">
                  <Unlock className="h-3.5 w-3.5" />
                  Decrypted
                </div>
                <p>{decryptedContent}</p>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Lock className="h-4 w-4" />
                    <span>Encrypted content - enter key to decrypt</span>
                  </div>
                  {event.ens_username && (
                    <Link href={`/subscribe/${event.ens_username}`}>
                      <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                        Subscribe
                      </button>
                    </Link>
                  )}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={decryptKey}
                      onChange={(e) => setDecryptKey(e.target.value)}
                      placeholder="Paste decryption key..."
                      className="w-full rounded-lg border bg-background pl-10 pr-4 py-2 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
                      disabled={isDecrypting}
                    />
                  </div>
                  <button
                    onClick={handleDecrypt}
                    disabled={!decryptKey.trim() || isDecrypting}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isDecrypting ? "Decrypting..." : "Decrypt"}
                  </button>
                </div>
                {decryptError && (
                  <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    {decryptError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
