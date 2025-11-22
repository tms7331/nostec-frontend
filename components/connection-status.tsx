interface ConnectionStatusProps {
  connected: boolean
}

export function ConnectionStatus({ connected }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors">
      <div className={`h-3 w-3 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
      <span className="font-medium text-foreground">{connected ? "Connected" : "Disconnected"}</span>
    </div>
  )
}
