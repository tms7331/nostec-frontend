"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { AztecBackground } from "@/components/aztec-background"
import { Button } from "@/components/ui/button"
import { fetchENSSubname, type FetchENSResult } from "@/lib/services/ens-fetch"
import { getObsidianSdk } from "@/lib/obsidian/sdk"
import { createSubscription } from "@/lib/services/subscriptions"

export default function SubscribePage() {
  const params = useParams()
  const username = params.username as string

  // ENS state
  const [ensData, setEnsData] = useState<FetchENSResult | null>(null)
  const [isLoadingENS, setIsLoadingENS] = useState(true)
  const [aztecAddress, setAztecAddress] = useState<string | null>(null)

  // Obsidion wallet state
  const [obsidianAccount, setObsidianAccount] = useState<any>(null)
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)

  // Subscribe state
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [subscribeResult, setSubscribeResult] = useState<string | null>(null)

  // Load ENS info on mount
  useEffect(() => {
    const loadENSInfo = async () => {
      setIsLoadingENS(true)
      try {
        // Extract just the username part (remove .nostec.eth if present)
        const label = username.replace('.nostec.eth', '')
        const result = await fetchENSSubname(label)
        setEnsData(result)

        // Extract Aztec address from texts if available
        if (result.success && result.data?.texts) {
          // texts is an object, not an array
          const aztecAddr = result.data.texts.aztec_address || result.data.texts.aztecAddress
          setAztecAddress(aztecAddr || null)
          console.log('[Nostec] Extracted Aztec address:', aztecAddr)
        }
      } catch (error) {
        console.error('[Nostec] Error loading ENS info:', error)
        setEnsData({
          success: false,
          error: 'Failed to load ENS information'
        })
      } finally {
        setIsLoadingENS(false)
      }
    }

    loadENSInfo()
  }, [username])

  const handleConnectWallet = async () => {
    setIsConnectingWallet(true)
    try {
      const sdk = getObsidianSdk()
      if (!sdk) {
        throw new Error("SDK not initialized")
      }
      const account = await sdk.connect("obsidion")
      setObsidianAccount(account)
      const aztecAddress = account.getAddress().toString()
      console.log("[Obsidion] Connected to wallet:", aztecAddress)

      // Store Aztec address in localStorage
      localStorage.setItem('nostec_aztec_address', aztecAddress)
    } catch (error) {
      console.error("[Obsidion] Failed to connect:", error)
      alert("Failed to connect to Obsidion wallet. Make sure the wallet is open.")
    } finally {
      setIsConnectingWallet(false)
    }
  }

  const handleSubscribe = async () => {
    if (!obsidianAccount) {
      alert("Please connect your Obsidion wallet first")
      return
    }

    if (!aztecAddress) {
      alert("No Aztec address found for this user")
      return
    }

    // Get nostr pubkey from localStorage
    const nostrPubkey = localStorage.getItem('nostec_pubkey')
    if (!nostrPubkey) {
      alert("No Nostr public key found. Please log in to the main page first.")
      return
    }

    setIsSubscribing(true)
    setSubscribeResult(null)

    try {
      const fromAddress = obsidianAccount.getAddress().toString()
      const result = await createSubscription(fromAddress, nostrPubkey, aztecAddress)

      if (result.success) {
        console.log('[Nostec] Subscription created:', result.subscription)
        setSubscribeResult(`Successfully subscribed to ${username}!`)
      } else {
        console.error('[Nostec] Failed to create subscription:', result.error)
        setSubscribeResult(`Failed to subscribe: ${result.error}`)
      }
    } catch (error) {
      console.error('[Nostec] Error creating subscription:', error)
      setSubscribeResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubscribing(false)
    }
  }

  const handleSubscribeHacky = async () => {
    if (!aztecAddress) {
      alert("No Aztec address found for this user")
      return
    }

    // Get nostr pubkey from localStorage
    const nostrPubkey = localStorage.getItem('nostec_pubkey')
    if (!nostrPubkey) {
      alert("No Nostr public key found. Please log in to the main page first.")
      return
    }

    setIsSubscribing(true)
    setSubscribeResult(null)

    try {
      // Use "0x" as a placeholder for from_aztec_key
      const result = await createSubscription("0x", nostrPubkey, aztecAddress)

      if (result.success) {
        console.log('[Nostec] Hacky subscription created:', result.subscription)
        setSubscribeResult(`Successfully subscribed to ${username} (hacky mode)!`)
      } else {
        console.error('[Nostec] Failed to create subscription:', result.error)
        setSubscribeResult(`Failed to subscribe: ${result.error}`)
      }
    } catch (error) {
      console.error('[Nostec] Error creating subscription:', error)
      setSubscribeResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <div className="min-h-screen text-foreground antialiased selection:bg-primary/10 selection:text-primary pb-20 font-sans">
      <AztecBackground />
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pt-8">
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-medium tracking-tight text-foreground">
              Subscribe to {username}
            </h1>
            <p className="text-muted-foreground text-base">
              View encrypted content from this user
            </p>
          </div>

          {/* User Info Section */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
                <div className="flex-1">
                  <p className="font-mono text-sm text-foreground">{username}</p>
                  <p className="text-xs text-muted-foreground">ENS Username</p>
                </div>
              </div>

              {isLoadingENS ? (
                <div className="text-sm text-muted-foreground">Loading user info...</div>
              ) : ensData?.success && aztecAddress ? (
                <div className="pt-4 border-t space-y-2">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                      Aztec Address
                    </label>
                    <div className="font-mono text-xs bg-secondary/50 border border-border/50 px-3 py-2 rounded-md break-all">
                      {aztecAddress}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-4 border-t">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {ensData?.error || 'No Aztec address found for this user'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Obsidion Wallet Section */}
          <section className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                🔮 Connect Your Wallet
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Connect your Obsidion wallet to subscribe to this user
              </p>
            </div>

            {!obsidianAccount ? (
              <Button
                onClick={handleConnectWallet}
                disabled={isConnectingWallet}
                className="w-full font-medium"
              >
                {isConnectingWallet ? "Connecting..." : "Connect Obsidion Wallet"}
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-3 py-2 rounded-md">
                <span>✓</span>
                <span>Connected: {obsidianAccount.getAddress().toString().substring(0, 20)}...</span>
              </div>
            )}
          </section>

          {/* Subscribe Section */}
          <section className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
            <Button
              onClick={handleSubscribe}
              disabled={isSubscribing || !aztecAddress || !obsidianAccount}
              className="w-full font-medium"
            >
              {isSubscribing ? "Subscribing..." : "Subscribe"}
            </Button>

            <Button
              onClick={handleSubscribeHacky}
              disabled={isSubscribing || !aztecAddress}
              variant="outline"
              className="w-full font-medium"
            >
              {isSubscribing ? "Subscribing..." : "Subscribe Hacky"}
            </Button>

            {subscribeResult && (
              <div className={`p-3 rounded-md text-sm ${
                subscribeResult.includes("Successfully")
                  ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                  : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
              }`}>
                {subscribeResult}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
