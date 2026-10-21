import * as React from "react"

import { cn } from "@/lib/utils"
import { GridBackdrop } from "@/components/GridBackdrop"

interface PageShellProps {
  children: React.ReactNode
  className?: string
  contentClassName?: string
}

/**
 * Page chrome: canvas, backdrop and the stacking context. Every route uses this
 * so the background and base typography can never drift between pages.
 */
export function PageShell({ children, className, contentClassName }: PageShellProps) {
  return (
    <main
      id="main"
      tabIndex={-1}
      className={cn(
        "relative flex w-full flex-1 flex-col overflow-hidden bg-canvas text-fg focus:outline-none",
        className
      )}
    >
      <GridBackdrop />
      <div className={cn("relative z-10 flex w-full flex-1 flex-col", contentClassName)}>
        {children}
      </div>
    </main>
  )
}
