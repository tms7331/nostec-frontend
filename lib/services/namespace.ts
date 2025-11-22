/**
 * Namespace API service for creating ENS subnames
 * Calls our Next.js API route to avoid CORS issues
 */

export interface CreateSubnameParams {
  label: string // Username (e.g., "alice" for "alice.nostec.eth")
  aztecAddress: string // Aztec address
}

export interface CreateSubnameResult {
  success: boolean
  error?: string
  ensName?: string // Full ENS name (e.g., "alice.nostec.eth")
}

/**
 * Create an ENS subname for a user via our API route
 */
export async function createENSSubname(params: CreateSubnameParams): Promise<CreateSubnameResult> {
  try {
    const response = await fetch('/api/ens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        label: params.label,
        aztecAddress: params.aztecAddress
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[Nostec] Failed to create ENS subname:', data)
      return {
        success: false,
        error: data.error || `API error: ${response.status}`
      }
    }

    console.log('[Nostec] ENS subname created:', data.ensName)

    return {
      success: true,
      ensName: data.ensName
    }
  } catch (error) {
    console.error('[Nostec] Error creating ENS subname:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Check if a username is available
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  // For now, just validate the format
  // TODO: Could add API call to check if subname already exists
  const usernameRegex = /^[a-z0-9-]{3,20}$/
  return usernameRegex.test(username)
}
