import { MessageSquareOff } from "lucide-react"
import type { NostrEvent } from "../types/nostr"
import { EventCard } from "./event-card"

interface EventFeedProps {
  events: NostrEvent[]
  decryptedContents: Map<string, string>
  decryptionFailures: Set<string>
}

export function EventFeed({ events, decryptedContents, decryptionFailures }: EventFeedProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-foreground">Feed ({events.length} posts)</h3>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 py-12 text-center">
          <div className="rounded-full bg-muted p-3">
            <MessageSquareOff className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              decryptedContent={decryptedContents.get(event.id)}
              decryptionFailed={decryptionFailures.has(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
