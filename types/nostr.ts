export interface NostrEvent {
  id: string
  pubkey: string
  created_at: number
  kind: number // 1 = plaintext, 4 = encrypted
  tags: string[][]
  content: string
  sig: string
  ens_username?: string // Optional ENS username
}

export type NostrEventType = "plaintext" | "encrypted"
