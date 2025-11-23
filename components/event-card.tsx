"use client"

import { useState, useEffect } from "react"
import { Lock, Unlock } from "lucide-react"
import Link from "next/link"
import type { NostrEvent } from "../types/nostr"
import { decryptContent, decryptKeyFromSender } from "@/lib/crypto/encryption"

interface EventCardProps {
  event: NostrEvent
  decryptedContent?: string
  decryptionFailed?: boolean
}

export function EventCard({ event, decryptedContent: initialDecryptedContent, decryptionFailed }: EventCardProps) {
  const [decryptedContent, setDecryptedContent] = useState(initialDecryptedContent)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [isSubscriber, setIsSubscriber] = useState(false)
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

  // Auto-decrypt for subscribers
  useEffect(() => {
    const autoDecrypt = async () => {
      if (!isEncrypted || decryptedContent) return

      // Get user's keys from localStorage
      const userPubkey = localStorage.getItem('nostec_pubkey')
      const userPrivkey = localStorage.getItem('nostec_privkey')

      if (!userPubkey || !userPrivkey) return

      // Check if user's pubkey is in the tags
      if (!event.tags || event.tags.length === 0) return

      // Find tag with user's pubkey
      const userTag = event.tags.find(tag => tag[0] === 'e' && tag[1] === userPubkey)

      if (!userTag || !userTag[2]) {
        console.log("[Nostec] User not subscribed to this post")
        return
      }

      // User is a subscriber! Decrypt the key
      setIsSubscriber(true)
      setIsDecrypting(true)

      try {
        const encryptedKey = userTag[2]
        console.log("[Nostec] Found encrypted key for user, decrypting...")

        // Decrypt the encryption key using sender's pubkey and user's privkey
        const decryptionKey = await decryptKeyFromSender(encryptedKey, event.pubkey, userPrivkey)
        console.log("[Nostec] Decrypted encryption key successfully")

        // Use the decrypted key to decrypt the content
        const decrypted = await decryptContent(event.content, decryptionKey)
        setDecryptedContent(decrypted)
        console.log("[Nostec] Auto-decrypted post content")
      } catch (error) {
        console.error("[Nostec] Auto-decryption failed:", error)
      } finally {
        setIsDecrypting(false)
      }
    }

    autoDecrypt()
  }, [event, isEncrypted, decryptedContent])

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
                  {isSubscriber ? "Auto-decrypted (Subscriber)" : "Decrypted"}
                </div>
                <p>{decryptedContent}</p>
              </>
            ) : isDecrypting ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Lock className="h-4 w-4 animate-pulse" />
                <span>Decrypting...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Lock className="h-4 w-4" />
                  <span>Encrypted content - subscribers only</span>
                </div>
                {event.ens_username && (
                  <Link href={`/subscribe/${event.ens_username}`}>
                    <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                      Subscribe to view
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
