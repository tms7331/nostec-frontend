import { Lock, Unlock, ShieldAlert } from "lucide-react"
import type { NostrEvent } from "../types/nostr"

interface EventCardProps {
  event: NostrEvent
  decryptedContent?: string
  decryptionFailed?: boolean
}

export function EventCard({ event, decryptedContent, decryptionFailed }: EventCardProps) {
  const isEncrypted = event.kind === 4
  const formattedDate = new Date(event.created_at * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  })

  // Shorten pubkey
  const shortPubkey = `${event.pubkey.slice(0, 8)}...`

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
          <span className="font-mono text-xs text-muted-foreground" title={event.pubkey}>
            {shortPubkey}
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
              <div className="flex items-center gap-2 text-muted-foreground italic">
                {decryptionFailed ? (
                  <>
                    <ShieldAlert className="h-4 w-4" />
                    <span>Encrypted (cannot decrypt with current passphrase)</span>
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    <span>Encrypted content</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
