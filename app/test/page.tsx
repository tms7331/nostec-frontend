"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AztecBackground } from "@/components/aztec-background"
import { Navbar } from "@/components/navbar"
import { getObsidianSdk } from "@/lib/obsidian/sdk"
import { AztecAddress } from "@aztec/aztec.js/addresses"
import { CounterContract, CounterContractArtifact } from "@/lib/artifacts/Counter"
import { Contract } from "@nemi-fi/wallet-sdk/eip1193"
import { fetchENSSubname, type FetchENSResult } from "@/lib/services/ens-fetch"

class Counter extends Contract.fromAztec(CounterContract as any) { }

export default function TestPage() {
    // Obsidion wallet state
    const [obsidianAccount, setObsidianAccount] = useState<any>(null)
    const [isConnectingWallet, setIsConnectingWallet] = useState(false)
    const [contractAddress, setContractAddress] = useState("")
    const [followerAmount, setFollowerAmount] = useState("")
    const [followerOwner, setFollowerOwner] = useState("")
    const [isSubmittingTx, setIsSubmittingTx] = useState(false)
    const [txResult, setTxResult] = useState<string | null>(null)
    const [isFetchingPubkeys, setIsFetchingPubkeys] = useState(false)
    const [pubkeysResult, setPubkeysResult] = useState<string | null>(null)

    // ENS state
    const [ensFetchName, setEnsFetchName] = useState("")
    const [ensFetchResult, setEnsFetchResult] = useState<FetchENSResult | null>(null)
    const [isFetchingENS, setIsFetchingENS] = useState(false)

    // Obsidion wallet handlers
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

    const handleSubmitTransaction = async () => {
        if (!obsidianAccount) {
            alert("Please connect your Obsidion wallet first")
            return
        }

        if (!contractAddress.trim()) {
            alert("Please enter the contract address")
            return
        }

        if (!followerAmount.trim()) {
            alert("Please enter the follower amount")
            return
        }

        if (!followerOwner.trim()) {
            alert("Please enter the follower owner address")
            return
        }

        setIsSubmittingTx(true)
        setTxResult(null)

        try {
            // Connect to the Counter contract
            const counter = await Counter.at(
                AztecAddress.fromString(contractAddress),
                obsidianAccount
            )

            const obsidion = obsidianAccount.getAddress()
            console.log("[Obsidion] Obsidion address:", obsidion)

            // Submit the transaction
            console.log("[Obsidion] Submitting transaction...")
            const tx = counter.methods
                .add_follower_note_nocheck(
                    obsidianAccount.getAddress(),
                    AztecAddress.fromString(followerOwner),
                    {
                        registerContracts: [
                            {
                                address: counter.address,
                                instance: counter.instance,
                                artifact: CounterContractArtifact,
                            },
                        ],
                    }
                )
                .send()

            const receipt = await tx.wait({ timeout: 200000 })

            console.log("[Obsidion] Transaction successful:", receipt.txHash)
            setTxResult(`Transaction successful! Hash: ${receipt.txHash.toString()}`)

            // Clear form
            setFollowerAmount("")
            setFollowerOwner("")
        } catch (error) {
            console.error("[Obsidion] Transaction failed:", error)
            setTxResult(`Transaction failed: ${error instanceof Error ? error.message : "Unknown error"}`)
        } finally {
            setIsSubmittingTx(false)
        }
    }

    const handleGetNostrPubkeys = async () => {
        if (!obsidianAccount) {
            alert("Please connect your Obsidion wallet first")
            return
        }

        if (!contractAddress.trim()) {
            alert("Please enter the contract address")
            return
        }

        if (!followerOwner.trim()) {
            alert("Please enter the owner address")
            return
        }

        setIsFetchingPubkeys(true)
        setPubkeysResult(null)

        try {
            // Connect to the Counter contract
            const counter = await Counter.at(
                AztecAddress.fromString(contractAddress),
                obsidianAccount
            )

            // Call get_nostr_pubkeys offchain using simulate()
            // Pass registerSenders as second parameter to the method call (like balance_of_private in example)
            console.log("[Obsidion] Fetching nostr pubkeys...")
            const result = await counter.methods
                .get_nostr_pubkeys(
                    AztecAddress.fromString(followerOwner),
                    {
                        registerSenders: [obsidianAccount.getAddress()],
                    }
                )
                .simulate()

            console.log("[Obsidion] Nostr pubkeys result:", result)
            setPubkeysResult(`Nostr Pubkeys: ${JSON.stringify(result, null, 2)}`)
        } catch (error) {
            console.error("[Obsidion] Failed to fetch nostr pubkeys:", error)
            setPubkeysResult(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
        } finally {
            setIsFetchingPubkeys(false)
        }
    }

    const handleFetchENS = async () => {
        if (!ensFetchName.trim()) {
            alert("Please enter a username")
            return
        }

        setIsFetchingENS(true)
        setEnsFetchResult(null)

        try {
            const result = await fetchENSSubname(ensFetchName)
            setEnsFetchResult(result)

            if (!result.success) {
                console.error("[Nostec] Failed to fetch ENS:", result.error)
            }
        } catch (error) {
            console.error("[Nostec] Error fetching ENS:", error)
            setEnsFetchResult({
                success: false,
                error: "An error occurred while fetching ENS data"
            })
        } finally {
            setIsFetchingENS(false)
        }
    }

    return (
        <div className="min-h-screen text-foreground antialiased selection:bg-primary/10 selection:text-primary pb-20 font-sans">
            <AztecBackground />
            <Navbar />
            <main className="mx-auto max-w-4xl px-4 pt-1">
                <div className="space-y-6 py-6">
                    <header className="flex flex-col gap-6 pb-6 border-b border-border/40">
                        <div className="flex flex-col gap-1 text-center md:text-left">
                            <h1 className="text-2xl font-medium tracking-tight text-foreground sm:text-3xl">Test Functions</h1>
                            <p className="text-muted-foreground text-base">
                                Test Obsidion wallet integration and ENS functionality
                            </p>
                        </div>
                    </header>

                    {/* Obsidion Wallet Section */}
                    <section className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-2">
                                🔮 Obsidion Wallet - Counter Contract
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3">
                                Connect to Obsidion wallet and submit transactions to the Counter contract
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
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-3 py-2 rounded-md">
                                    <span>✓</span>
                                    <span>Connected: {obsidianAccount.getAddress().toString().substring(0, 20)}...</span>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                                            Contract Address
                                        </label>
                                        <input
                                            type="text"
                                            value={contractAddress}
                                            onChange={(e) => setContractAddress(e.target.value)}
                                            placeholder="Enter Counter contract address"
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all"
                                            disabled={isSubmittingTx}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                                            Follower Amount (Field)
                                        </label>
                                        <input
                                            type="text"
                                            value={followerAmount}
                                            onChange={(e) => setFollowerAmount(e.target.value)}
                                            placeholder="Enter amount (e.g., 42)"
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all"
                                            disabled={isSubmittingTx}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                                            Owner Address (AztecAddress)
                                        </label>
                                        <input
                                            type="text"
                                            value={followerOwner}
                                            onChange={(e) => setFollowerOwner(e.target.value)}
                                            placeholder="Enter Aztec address"
                                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all"
                                            disabled={isSubmittingTx}
                                        />
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleSubmitTransaction}
                                            disabled={isSubmittingTx || !contractAddress.trim() || !followerAmount.trim() || !followerOwner.trim()}
                                            className="flex-1 font-medium"
                                        >
                                            {isSubmittingTx ? "Submitting..." : "Submit Transaction"}
                                        </Button>
                                        <Button
                                            onClick={handleGetNostrPubkeys}
                                            disabled={isFetchingPubkeys || !contractAddress.trim() || !followerOwner.trim()}
                                            variant="outline"
                                            className="flex-1 font-medium"
                                        >
                                            {isFetchingPubkeys ? "Fetching..." : "Get Nostr Pubkeys"}
                                        </Button>
                                    </div>

                                    {txResult && (
                                        <div className={`mt-4 p-3 rounded-md text-xs ${txResult.includes("successful")
                                            ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                                            : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                                            }`}>
                                            {txResult}
                                        </div>
                                    )}

                                    {pubkeysResult && (
                                        <div className={`mt-4 p-3 rounded-md text-xs ${pubkeysResult.includes("Error")
                                            ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                                            : "bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                                            }`}>
                                            <pre className="whitespace-pre-wrap break-words text-xs">{pubkeysResult}</pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* ENS Fetch Section */}
                    <section className="rounded-xl border border-border/50 bg-card p-5 shadow-sm space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-foreground mb-2">
                                🔍 Fetch ENS Records
                            </h3>
                            <p className="text-xs text-muted-foreground mb-3">
                                Enter a username to fetch records from {"{username}"}.nostec.eth
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={ensFetchName}
                                onChange={(e) => setEnsFetchName(e.target.value)}
                                placeholder="Enter username"
                                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring transition-all"
                                disabled={isFetchingENS}
                            />
                            <Button
                                onClick={handleFetchENS}
                                disabled={!ensFetchName.trim() || isFetchingENS}
                                className="font-medium"
                            >
                                {isFetchingENS ? "Fetching..." : "Fetch"}
                            </Button>
                        </div>

                        {ensFetchResult && (
                            <div className="mt-4 space-y-3">
                                {ensFetchResult.success ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                            <span>✓</span>
                                            <span>Found: {ensFetchResult.ensName}</span>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Complete Response
                                            </label>
                                            <div className="font-mono text-xs bg-secondary/50 border border-border/50 px-3 py-2 rounded-md break-all overflow-auto max-h-96">
                                                <pre className="whitespace-pre-wrap">{JSON.stringify(ensFetchResult.data, null, 2)}</pre>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                        <span>✕</span>
                                        <span>Error: {ensFetchResult.error}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    )
}

