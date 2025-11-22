import { NextRequest, NextResponse } from 'next/server'

const NAMESPACE_API_URL = 'https://offchain-manager.namespace.ninja/api/v1/subnames'
const PARENT_DOMAIN = 'nostec.eth'

export async function POST(request: NextRequest) {
  try {
    const { label, aztecAddress } = await request.json()

    const apiKey = process.env.NAMESPACE_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Namespace API key not configured' },
        { status: 500 }
      )
    }

    // Validate inputs
    if (!label) {
      return NextResponse.json(
        { error: 'Missing required field: label' },
        { status: 400 }
      )
    }

    if (!aztecAddress) {
      return NextResponse.json(
        { error: 'Missing required field: aztecAddress' },
        { status: 400 }
      )
    }

    // Build texts array with aztec_address
    const texts = [
      {
        key: 'aztec_address',
        value: aztecAddress
      }
    ]

    // Prepare request body (only required fields + texts)
    const requestBody = {
      label,
      parentName: PARENT_DOMAIN,
      texts
    }

    console.log('[Nostec API] Creating ENS subname:', {
      label,
      parentName: PARENT_DOMAIN,
      textsCount: texts.length
    })

    console.log('[Nostec API] Request body:', JSON.stringify(requestBody, null, 2))

    // Call Namespace API
    const response = await fetch(NAMESPACE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': apiKey
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('[Nostec API] Namespace API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      return NextResponse.json(
        {
          error: errorData.message || errorData.error || `API error: ${response.status}`,
          details: errorData
        },
        { status: response.status }
      )
    }

    // Success! (201 Created)
    console.log('[Nostec API] Successfully created ENS subname')

    // Try to parse response body, but it might be empty
    let data = {}
    try {
      const text = await response.text()
      if (text) {
        data = JSON.parse(text)
      }
    } catch (e) {
      console.log('[Nostec API] No response body or invalid JSON (this is OK)')
    }

    const ensName = `${label}.${PARENT_DOMAIN}`

    return NextResponse.json({
      success: true,
      ensName,
      data
    })
  } catch (error) {
    console.error('[Nostec API] Error creating ENS subname:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
