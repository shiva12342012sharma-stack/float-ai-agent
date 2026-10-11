"use client"

import dynamic from "next/dynamic"
import { AgentOrb } from "./agent-orb"

export const WorkspaceLoader = dynamic(() => import("./agent-workspace").then((m) => m.AgentWorkspace), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh items-center justify-center bg-background">
      <AgentOrb size="md" state="thinking" />
      <span className="sr-only">Loading Float</span>
    </div>
  ),
})
