import { NextRequest, NextResponse } from 'next/server'

const OFFCHAIN_MANAGER_URL = 'https://offchain-manager.namespace.ninja/api/v1/subnames'
const PARENT_DOMAIN = 'nostec.eth'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const label = searchParams.get('label')

    if (!label) {
      return NextResponse.json(
        { error: 'Missing label parameter' },
        { status: 400 }
      )
    }

    const fullName = `${label}.${PARENT_DOMAIN}`

    console.log('[Nostec API] Fetching ENS subname:', fullName)

    // Fetch the subname details from Namespace Offchain Manager API
    const response = await fetch(`${OFFCHAIN_MANAGER_URL}/${fullName}`, {
      method: 'GET'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Nostec API] Namespace API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })

      if (response.status === 404) {
        return NextResponse.json(
          { error: `ENS name ${fullName} not found` },
          { status: 404 }
        )
      }

      return NextResponse.json(
        {
          error: errorData.message || errorData.error || `API error: ${response.status}`,
          details: errorData
        },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      ensName: fullName,
      data
    })
  } catch (error) {
    console.error('[Nostec API] Error fetching ENS subname:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
