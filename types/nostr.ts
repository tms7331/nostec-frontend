export interface NostrEvent {
  id: string
  pubkey: string
  created_at: number
  kind: number // 1 = plaintext, 4 = encrypted
  tags: string[][]
  content: string
  sig: string
}

export type NostrEventType = "plaintext" | "encrypted"
