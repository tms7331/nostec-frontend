"use client"

import { useState, useEffect } from "react"
import { LogOut, MessageSquare } from "lucide-react"
import { Navbar } from "@/components/navbar" // Import Navbar
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Import Tabs
import { Button } from "@/components/ui/button"
import { PostForm } from "@/components/post-form"
import { EventFeed } from "@/components/event-feed"
import { AztecBackground } from "@/components/aztec-background" // Import AztecBackground
import type { NostrEvent } from "@/types/nostr"
import * as secp256k1 from "@noble/secp256k1"
import { createSignedEvent } from "@/lib/nostr/crypto"
import { createPost, getAllPosts } from "@/lib/services/posts"
import { generateEncryptionKey, encryptContent } from "@/lib/crypto/encryption"
import { createENSSubname, checkUsernameAvailability } from "@/lib/services/namespace"


export default function NostrClient() {
  // State
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginKey, setLoginKey] = useState("") // New state for login private key input
  const [connected, setConnected] = useState(false)
  const [pubkey, setPubkey] = useState("")
  const [privkey, setPrivkey] = useState("") // Store the private key
  const [events, setEvents] = useState<NostrEvent[]>([])
  const [decryptedContents, setDecryptedContents] = useState<Map<string, string>>(new Map())
  const [decryptionFailures, setDecryptionFailures] = useState<Set<string>>(new Set())
  const [isLoadingPosts, setIsLoadingPosts] = useState(false)
  const [isSubmittingPost, setIsSubmittingPost] = useState(false)
  const [lastEncryptionKey, setLastEncryptionKey] = useState<string | null>(null)
  const [desiredUsername, setDesiredUsername] = useState("")
  const [aztecAddress, setAztecAddress] = useState("")
  const [ensUsername, setEnsUsername] = useState<string | null>(null)
  const [isCreatingAccount, setIsCreatingAccount] = useState(false)

  const createPrivateKey = () => {
    // Generate a random 32-byte private key using browser crypto API
    const privateKeyBytes = new Uint8Array(32)
    crypto.getRandomValues(privateKeyBytes)
    const privateKeyHex = Array.from(privateKeyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Derive the public key from the private key
    const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes)
    const publicKeyHex = Array.from(publicKeyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(2) // Remove the '04' prefix for uncompressed key

    console.log("[Nostec] Generated new keypair")
    return { privateKey: privateKeyHex, publicKey: publicKeyHex }
  }

  const handleCreateAccount = async () => {
    if (!desiredUsername.trim()) {
      alert("Please enter a username")
      return
    }

    if (!aztecAddress.trim()) {
      alert("Please enter your Aztec address")
      return
    }

    // Validate username format
    const isValid = await checkUsernameAvailability(desiredUsername)
    if (!isValid) {
      alert("Invalid username. Use 3-20 lowercase letters, numbers, or hyphens.")
      return
    }

    setIsCreatingAccount(true)

    try {
      // Generate keypair
      const { privateKey, publicKey } = createPrivateKey()

      // Create ENS subname with Aztec address
      const result = await createENSSubname({
        label: desiredUsername,
        aztecAddress: aztecAddress
      })

      if (result.success) {
        console.log("[Nostec] Account created with ENS name:", result.ensName)
        setPrivkey(privateKey)
        setPubkey(publicKey)
        setEnsUsername(result.ensName || null)
        setIsLoggedIn(true)
        setDesiredUsername("") // Clear inputs
        setAztecAddress("")
      } else {
        console.error("[Nostec] Failed to create ENS subname:", result.error)
        alert(`Failed to create ENS username: ${result.error}`)
      }
    } catch (error) {
      console.error("[Nostec] Error creating account:", error)
      alert("An error occurred while creating your account")
    } finally {
      setIsCreatingAccount(false)
    }
  }

  const handleLogin = () => {
    if (loginKey.trim()) {
      try {
        // Derive public key from the provided private key
        const privateKeyBytes = new Uint8Array(
          loginKey.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
        )
        const publicKeyBytes = secp256k1.getPublicKey(privateKeyBytes)
        const publicKeyHex = Array.from(publicKeyBytes)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .substring(2) // Remove the '04' prefix for uncompressed key

        setPrivkey(loginKey)
        setPubkey(publicKeyHex)
        setIsLoggedIn(true)
        setLoginKey("") // Clear input
        console.log("[Nostec] User logged in")
      } catch (error) {
        console.error("[Nostec] Invalid private key:", error)
        alert("Invalid private key format")
      }
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setPrivkey("")
    setPubkey("")
  }

  // Load initial state
  useEffect(() => {
    // Simulate connection
    const timer = setTimeout(() => {
      setConnected(true)
    }, 1000)

    // Load posts from Supabase
    loadPosts()

    return () => clearTimeout(timer)
  }, [])


  const handlePostSubmit = async (content: string, encrypted: boolean) => {
    if (!privkey) {
      alert("No private key available. Please create an account or login.")
      return
    }

    setIsSubmittingPost(true)
    setLastEncryptionKey(null) // Clear previous key

    try {
      let finalContent = content
      let encryptionKey: string | null = null

      // If encrypted, generate key and encrypt content
      if (encrypted) {
        encryptionKey = generateEncryptionKey()
        finalContent = await encryptContent(content, encryptionKey)
      }

      // Create the unsigned event
      const unsignedEvent = {
        pubkey: pubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: encrypted ? 4 : 1,
        tags: [] as string[][],
        content: finalContent,
      }

      // Sign the event
      const signedEvent = await createSignedEvent(unsignedEvent, privkey)

      // Save to Supabase
      const result = await createPost(signedEvent)

      if (result.success) {
        console.log("[Nostec] Post created successfully:", result.event)

        // Save encryption key to show to user
        if (encryptionKey) {
          setLastEncryptionKey(encryptionKey)
        }

        // Reload posts to include the new one
        await loadPosts()
      } else {
        console.error("[Nostec] Failed to create post:", result.error)
        alert(`Failed to create post: ${result.error}`)
      }
    } catch (error) {
      console.error("[Nostec] Error submitting post:", error)
      alert("An error occurred while submitting your post")
    } finally {
      setIsSubmittingPost(false)
    }
  }

  const loadPosts = async () => {
    setIsLoadingPosts(true)
    try {
      const result = await getAllPosts()
      if (result.success && result.posts) {
        setEvents(result.posts)
      } else {
        console.error("[Nostec] Failed to load posts:", result.error)
      }
    } catch (error) {
      console.error("[Nostec] Error loading posts:", error)
    } finally {
      setIsLoadingPosts(false)
    }
  }


  return (
    <div className="min-h-screen text-foreground antialiased selection:bg-primary/10 selection:text-primary pb-20 font-sans">
      <AztecBackground /> {/* Add the background component */}
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pt-1">
        <Tabs defaultValue="home" className="space-y-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="feed">View Feed</TabsTrigger>
          </TabsList>

          <TabsContent
            value="home"
            className="space-y-2 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500"
          >
            {!isLoggedIn ? (
              <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                  <div className="mx-auto h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center mb-2">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-3xl font-medium tracking-tight text-foreground sm:text-3xl">
                    Welcome to Nostec
                  </h2>
                  <p className="text-muted-foreground max-w-md text-base leading-relaxed">
                    A decentralized messaging prototype. <br />
                    Secure, encrypted, and censorship-resistant.
                  </p>
                </div>

                <div className="flex flex-col gap-4 w-full max-w-[320px] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                  <div className="space-y-3">
                    <div className="relative group">
                      <input
                        type="text"
                        value={loginKey}
                        onChange={(e) => setLoginKey(e.target.value)}
                        placeholder="Paste your private key (hex format)"
                        className="w-full rounded-lg border bg-card px-4 py-3 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all hover:border-ring/50"
                      />
                    </div>
                    <Button
                      size="lg"
                      onClick={handleLogin}
                      className="w-full h-11 font-medium transition-all shadow-sm hover:shadow-md"
                      disabled={!loginKey.trim()}
                    >
                      Login
                    </Button>
                  </div>

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/60" />
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-medium">
                      <span className="bg-background px-3 text-muted-foreground/60">Or Create Account</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="relative group">
                      <input
                        type="text"
                        value={desiredUsername}
                        onChange={(e) => setDesiredUsername(e.target.value.toLowerCase())}
                        placeholder="Choose your username"
                        className="w-full rounded-lg border bg-card px-4 py-3 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all hover:border-ring/50"
                        disabled={isCreatingAccount}
                      />
                      <div className="mt-1 text-xs text-muted-foreground text-center">
                        {desiredUsername && `${desiredUsername}.nostec.eth`}
                      </div>
                    </div>
                    <div className="relative group">
                      <input
                        type="text"
                        value={aztecAddress}
                        onChange={(e) => setAztecAddress(e.target.value)}
                        placeholder="Enter your Aztec address"
                        className="w-full rounded-lg border bg-card px-4 py-3 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all hover:border-ring/50"
                        disabled={isCreatingAccount}
                      />
                    </div>
                    <Button
                      size="lg"
                      onClick={handleCreateAccount}
                      disabled={!desiredUsername.trim() || !aztecAddress.trim() || isCreatingAccount}
                      className="w-full h-11 font-medium transition-all shadow-sm hover:shadow-md"
                    >
                      {isCreatingAccount ? "Creating Account..." : "Create Account"}
                    </Button>
                  </div>
                </div>

              </div>
            ) : (
              <>
                <header className="flex flex-col gap-6 pb-6 border-b border-border/40">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-col gap-1 text-center md:text-left">
                      <h1 className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl">Home</h1>
                      <p className="text-muted-foreground text-base">Manage your keys and secure messages.</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleLogout}
                      className="self-center md:self-start text-muted-foreground hover:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {ensUsername && (
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          ENS Username
                        </label>
                        <div className="font-mono text-sm text-foreground bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 flex items-center gap-2 px-3 py-2 rounded-md">
                          <span className="text-blue-600 dark:text-blue-400">✨</span>
                          {ensUsername}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Public Key
                      </label>
                      <div className="font-mono text-xs text-foreground bg-secondary/50 border border-border/50 flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-secondary/80 break-all">
                        {pubkey}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Private Key
                      </label>
                      <div className="font-mono text-xs text-foreground bg-secondary/50 border border-border/50 flex items-center gap-2 px-3 py-2 rounded-md transition-colors hover:bg-secondary/80 break-all">
                        {privkey}
                      </div>
                    </div>
                  </div>
                </header>

                <section>
                  <PostForm onSubmit={handlePostSubmit} connected={connected} isSubmitting={isSubmittingPost} />
                </section>

                {lastEncryptionKey && (
                  <section className="rounded-xl border border-purple-500/50 bg-purple-50 dark:bg-purple-950/20 p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                          🔐 Encryption Key
                        </h3>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                          Save this key to decrypt your encrypted post. Share it only with people you want to read this message.
                        </p>
                        <div className="font-mono text-xs bg-white dark:bg-black p-3 rounded border border-purple-200 dark:border-purple-800 break-all select-all">
                          {lastEncryptionKey}
                        </div>
                      </div>
                      <button
                        onClick={() => setLastEncryptionKey(null)}
                        className="text-purple-500 hover:text-purple-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  </section>
                )}

              </>
            )}
          </TabsContent>

          <TabsContent value="feed" className="space-y-6 outline-none">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Global Feed</h2>
                <span className="text-sm text-muted-foreground">{events.length} events</span>
              </div>
              <EventFeed
                events={events}
                decryptedContents={decryptedContents}
                decryptionFailures={decryptionFailures}
              />
            </section>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
