import { supabase } from '@/lib/supabase/client'
import type { NostrEvent } from '@/types/nostr'

export interface CreatePostResult {
  success: boolean
  error?: string
  event?: NostrEvent
}

export interface GetPostsResult {
  success: boolean
  error?: string
  posts?: NostrEvent[]
}

/**
 * Create a new post in Supabase
 */
export async function createPost(event: NostrEvent): Promise<CreatePostResult> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        id: event.id,
        pubkey: event.pubkey,
        created_at: event.created_at,
        kind: event.kind,
        tags: event.tags,
        content: event.content,
        sig: event.sig
      }])
      .select()
      .single()

    if (error) {
      console.error('[Nostec] Failed to create post:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      event: data as NostrEvent
    }
  } catch (error) {
    console.error('[Nostec] Unexpected error creating post:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all posts from Supabase, ordered by created_at descending
 */
export async function getAllPosts(): Promise<GetPostsResult> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Nostec] Failed to fetch posts:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      posts: data as NostrEvent[]
    }
  } catch (error) {
    console.error('[Nostec] Unexpected error fetching posts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get posts by a specific public key
 */
export async function getPostsByPubkey(pubkey: string): Promise<GetPostsResult> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('pubkey', pubkey)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Nostec] Failed to fetch posts by pubkey:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      posts: data as NostrEvent[]
    }
  } catch (error) {
    console.error('[Nostec] Unexpected error fetching posts by pubkey:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Subscribe to real-time post updates
 */
export function subscribeToPosts(callback: (post: NostrEvent) => void) {
  const channel = supabase
    .channel('posts-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'posts'
      },
      (payload) => {
        callback(payload.new as NostrEvent)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
