import { MessageSquare } from "lucide-react"

export function Navbar() {
  return (
    <nav className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50 supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5 opacity-90 hover:opacity-100 transition-opacity cursor-pointer">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <h1 className="font-medium text-sm tracking-tight text-foreground/90">Nostec</h1>
        </div>
      </div>
    </nav>
  )
}
