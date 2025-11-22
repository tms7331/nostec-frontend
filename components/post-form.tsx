"use client"

import type React from "react"
import { useState } from "react"
import { Lock, Unlock, Send } from "lucide-react"

interface PostFormProps {
  onSubmit: (content: string, encrypted: boolean) => void
  connected: boolean
  passphrase: string
  isSubmitting?: boolean
}

export function PostForm({ onSubmit, connected, passphrase, isSubmitting = false }: PostFormProps) {
  const [content, setContent] = useState("")
  const [encrypt, setEncrypt] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    if (encrypt && !passphrase) return

    onSubmit(content, encrypt)
    setContent("")
  }

  const isSubmitDisabled = !connected || !content.trim() || (encrypt && !passphrase) || isSubmitting

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm transition-all md:p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">New Post</h2>
      </div>

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="min-h-[120px] w-full resize-none rounded-lg border bg-background p-3 text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
          disabled={!connected || isSubmitting}
        />
        <div className="mt-2 flex justify-end text-xs text-muted-foreground">{content.length} / 2000 characters</div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground select-none">
          <input
            type="checkbox"
            checked={encrypt}
            onChange={(e) => setEncrypt(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={!connected}
          />
          <span className="flex items-center gap-1.5">
            {encrypt ? <Lock className="h-4 w-4 text-purple-600" /> : <Unlock className="h-4 w-4 text-green-600" />}
            Encrypt this post
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className={`flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 font-medium text-white transition-all ${
            isSubmitDisabled
              ? "cursor-not-allowed bg-gray-400 dark:bg-gray-700"
              : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-sm hover:shadow-md"
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {connected ? "Submit Post" : "Not Connected"}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
