"use client"

import { ArrowUpRight } from "lucide-react"
import { MODES, type ModeId } from "@/lib/agent-config"
import { AgentOrb } from "./agent-orb"

export function EmptyState({ mode, onPick }: { mode: ModeId; onPick: (prompt: string) => void }) {
  const current = MODES.find((m) => m.id === mode) ?? MODES[0]
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-4 py-10">
      <AgentOrb size="lg" state="idle" />
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-signal">
          {current.label} mode · online
        </p>
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">
          What should we accomplish?
        </h1>
        <p className="max-w-lg text-pretty text-muted-foreground">
          Float plans multi-step tasks, calls live tools, reasons out loud, and listens to your voice.
        </p>
      </div>
      <ul className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {current.suggestions.map((s) => (
          <li key={s.title}>
            <button
              type="button"
              onClick={() => onPick(s.prompt)}
              className="group flex h-full w-full flex-col gap-1 rounded-xl border bg-card/50 p-4 text-left transition-colors hover:border-signal/40 hover:bg-card"
            >
              <span className="flex items-center justify-between text-sm font-medium">
                {s.title}
                <ArrowUpRight
                  className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal"
                  aria-hidden="true"
                />
              </span>
              <span className="line-clamp-2 text-xs text-muted-foreground">{s.prompt}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
