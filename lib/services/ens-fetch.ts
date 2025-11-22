/**
 * Fetch ENS subname information
 */

export interface FetchENSResult {
  success: boolean
  error?: string
  ensName?: string
  data?: {
    owner?: string
    texts?: Array<{ key: string; value: string }>
    addresses?: Array<{ chain: string; value: string }>
    [key: string]: any
  }
}

/**
 * Fetch an ENS subname's records
 */
export async function fetchENSSubname(label: string): Promise<FetchENSResult> {
  try {
    const response = await fetch(`/api/ens/fetch?label=${encodeURIComponent(label)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[Nostec] Failed to fetch ENS subname:', data)
      return {
        success: false,
        error: data.error || `API error: ${response.status}`
      }
    }

    console.log('[Nostec] ENS subname fetched:', data.ensName)

    return {
      success: true,
      ensName: data.ensName,
      data: data.data
    }
  } catch (error) {
    console.error('[Nostec] Error fetching ENS subname:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
