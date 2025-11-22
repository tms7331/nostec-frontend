"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff, KeyRound, LogOut, MessageSquare } from "lucide-react"
import { Navbar } from "@/components/navbar" // Import Navbar
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Import Tabs
import { Button } from "@/components/ui/button"
import { PostForm } from "@/components/post-form"
import { EventFeed } from "@/components/event-feed"
import { AztecBackground } from "@/components/aztec-background" // Import AztecBackground
import type { NostrEvent } from "@/types/nostr"
import * as secp256k1 from "@noble/secp256k1"

export default function NostrClient() {
  // State
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginKey, setLoginKey] = useState("") // New state for login private key input
  const [connected, setConnected] = useState(false)
  const [passphrase, setPassphrase] = useState("")
  const [showPassphrase, setShowPassphrase] = useState(false)
  const [pubkey, setPubkey] = useState("")
  const [privkey, setPrivkey] = useState("") // Store the private key
  const [events, setEvents] = useState<NostrEvent[]>([])
  const [decryptedContents, setDecryptedContents] = useState<Map<string, string>>(new Map())
  const [decryptionFailures, setDecryptionFailures] = useState<Set<string>>(new Set())

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

  const handleCreateAccount = () => {
    const { privateKey, publicKey } = createPrivateKey()
    console.log("[Nostec] Account created")
    setPrivkey(privateKey)
    setPubkey(publicKey)
    setIsLoggedIn(true)
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
    setPassphrase("") // Clear sensitive data on logout
    setPrivkey("")
    setPubkey("")
  }

  // Load initial state
  useEffect(() => {
    // Load stored passphrase
    const storedPassphrase = localStorage.getItem("nostr-passphrase") || ""
    setPassphrase(storedPassphrase)

    // Simulate connection
    const timer = setTimeout(() => {
      setConnected(true)
    }, 1000)

    // Add some dummy events for the prototype
    const dummyEvents: NostrEvent[] = [
      {
        id: "1",
        pubkey: "a1b2c3d4e5f678901234567890abcdef12345678",
        created_at: Date.now() / 1000 - 3600,
        kind: 1,
        tags: [],
        content: "Hello world! This is a plaintext message on the Nostr network.",
        sig: "dummy_sig_1",
      },
      {
        id: "2",
        pubkey: "bb223344556677889900aabbccddeeff11223344",
        created_at: Date.now() / 1000 - 1800,
        kind: 4,
        tags: [],
        content: "U2FsdGVkX1+...", // Dummy encrypted content
        sig: "dummy_sig_2",
      },
    ]
    setEvents(dummyEvents)

    return () => clearTimeout(timer)
  }, [])

  // Handle passphrase changes
  const handlePassphraseChange = (newPassphrase: string) => {
    setPassphrase(newPassphrase)
    localStorage.setItem("nostr-passphrase", newPassphrase)
  }

  // Effect to re-try decryption when passphrase changes
  useEffect(() => {
    const newDecrypted = new Map<string, string>()
    const newFailures = new Set<string>()

    events.forEach((event) => {
      if (event.kind === 4) {
        // This is where actual decryption logic would go
        // For prototype, we'll simulate successful decryption if passphrase is "secret"
        if (passphrase === "secret") {
          newDecrypted.set(event.id, "This is a secret message! (Decrypted successfully)")
        } else if (passphrase) {
          newFailures.add(event.id)
        }
      }
    })

    setDecryptedContents(newDecrypted)
    setDecryptionFailures(newFailures)
  }, [passphrase, events])

  const handlePostSubmit = (content: string, encrypted: boolean) => {
    const newEvent: NostrEvent = {
      id: Math.random().toString(36).substring(7),
      pubkey: pubkey,
      created_at: Date.now() / 1000,
      kind: encrypted ? 4 : 1,
      tags: [],
      content: encrypted ? "Encrypted content placeholder" : content,
      sig: "dummy_sig",
    }

    setEvents((prev) => [newEvent, ...prev])
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
                      <span className="bg-background px-3 text-muted-foreground/60">Or</span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    onClick={handleCreateAccount}
                    className="w-full h-11 font-medium transition-all shadow-sm hover:shadow-md"
                  >
                    Create Account
                  </Button>
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

                <section className="rounded-xl border bg-card/50 p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] backdrop-blur-sm md:p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="passphrase" className="text-sm font-medium text-foreground flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      Encryption Passphrase
                    </label>
                  </div>

                  <div className="relative group">
                    <input
                      id="passphrase"
                      type={showPassphrase ? "text" : "password"}
                      value={passphrase}
                      onChange={(e) => handlePassphraseChange(e.target.value)}
                      placeholder="Enter shared passphrase..."
                      className="w-full rounded-lg border bg-background/50 px-4 py-2.5 pl-4 pr-10 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/30 focus:ring-2 focus:ring-primary/10 outline-none transition-all hover:bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Try entering <strong>"secret"</strong> to decrypt the demo message.
                  </p>
                </section>

                <section>
                  <PostForm onSubmit={handlePostSubmit} connected={connected} passphrase={passphrase} />
                </section>
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
