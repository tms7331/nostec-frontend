import { supabase } from '@/lib/supabase/client'

export interface Subscription {
  id: number
  from_aztec_key: string
  from_nostr_pubkey: string
  to_aztec_key: string
  created_at: string
}

export interface CreateSubscriptionResult {
  success: boolean
  error?: string
  subscription?: Subscription
}

export interface GetSubscriptionsResult {
  success: boolean
  error?: string
  subscriptions?: Subscription[]
}

/**
 * Create a new subscription
 */
export async function createSubscription(
  fromAztecKey: string,
  fromNostrPubkey: string,
  toAztecKey: string
): Promise<CreateSubscriptionResult> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{
        from_aztec_key: fromAztecKey,
        from_nostr_pubkey: fromNostrPubkey,
        to_aztec_key: toAztecKey
      }])
      .select()
      .single()

    if (error) {
      console.error('[Nostec] Failed to create subscription:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      subscription: data as Subscription
    }
  } catch (error) {
    console.error('[Nostec] Unexpected error creating subscription:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all subscriptions for a user (where they are the subscriber)
 */
export async function getSubscriptionsFrom(fromAztecKey: string): Promise<GetSubscriptionsResult> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('from_aztec_key', fromAztecKey)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Nostec] Failed to fetch subscriptions:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      subscriptions: data as Subscription[]
    }
  } catch (error) {
    console.error('[Nostec] Unexpected error fetching subscriptions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get all subscriptions to a user (where they are being subscribed to)
 */
export async function getSubscriptionsTo(toAztecKey: string): Promise<GetSubscriptionsResult> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('to_aztec_key', toAztecKey)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Nostec] Failed to fetch subscriptions:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      subscriptions: data as Subscription[]
    }
  } catch (error) {
    console.error('[Nostec] Unexpected error fetching subscriptions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if a subscription exists
 */
export async function checkSubscriptionExists(
  fromAztecKey: string,
  toAztecKey: string
): Promise<{ exists: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('from_aztec_key', fromAztecKey)
      .eq('to_aztec_key', toAztecKey)
      .maybeSingle()

    if (error) {
      console.error('[Nostec] Failed to check subscription:', error)
      return {
        exists: false,
        error: error.message
      }
    }

    return {
      exists: !!data
    }
  } catch (error) {
    console.error('[Nostec] Unexpected error checking subscription:', error)
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
