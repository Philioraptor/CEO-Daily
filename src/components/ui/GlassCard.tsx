import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function GlassCard({ className, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--color-bg-panel)]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
