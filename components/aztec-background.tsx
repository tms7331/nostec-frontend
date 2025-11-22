"use client"

import { useEffect, useState } from "react"

export function AztecBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none select-none bg-background">
      {/* Animated Gradient Blobs - Much softer for subtlety */}
      <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-indigo-500/5 blur-[100px] animate-blob mix-blend-multiply" />
      <div className="absolute top-[30%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-teal-500/5 blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply" />
      <div className="absolute bottom-[-10%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-rose-500/5 blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply" />

      {/* Complex Aztec Pattern - Drastically reduced opacity */}
      <div className="absolute inset-0 opacity-[0.04]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="aztec-complex"
              x="0"
              y="0"
              width="200"
              height="200"
              patternUnits="userSpaceOnUse"
              patternTransform="scale(0.6) rotate(0)"
            >
              {/* Complex Stepped Fret (Xicalcoliuhqui) & Spiral Motif */}
              <path
                d="M20 20v40h40v40h40v-40h40v-40h-40v20h-20v-20h-60z 
                   M180 180v-40h-40v-40h-40v40h-40v40h40v-20h20v20h60z
                   M20 180v-40h40v-40h-40v-20h60v20h20v40h-40v20h-20v20h-20z
                   M180 20v40h-40v40h40v20h-60v-20h-20v-40h40v-20h20v-20h20z"
                fill="currentColor"
                className="text-foreground"
              />
              {/* Inner geometric details */}
              <rect x="90" y="90" width="20" height="20" className="text-foreground" fill="currentColor" />
              <path
                d="M100 60l10 10l-10 10l-10-10z M100 140l10 10l-10 10l-10-10z M60 100l10 10l-10 10l-10-10z M140 100l10 10l-10 10l-10-10z"
                fill="currentColor"
                className="text-foreground"
              />
              {/* Interlocking lines */}
              <path
                d="M0 100h60 M140 100h60 M100 0v60 M100 140v60"
                stroke="currentColor"
                strokeWidth="2"
                className="text-foreground"
              />
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="4 4"
                className="text-foreground"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#aztec-complex)" />
        </svg>
      </div>

      {/* Subtle Grain Texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply">
        <svg className="w-full h-full">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>
    </div>
  )
}
