"use client"

import { MessageSquare, Plus, Settings2, Trash2 } from "lucide-react"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
import { AgentOrb } from "./agent-orb"

export type SessionSummary = { id: string; title: string; messageCount: number }

type Props = {
  sessions: SessionSummary[]
  activeId: string
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onOpenSettings: () => void
  onOpenPalette: () => void
}

export function SessionSidebar({ sessions, activeId, onSelect, onNew, onDelete, onOpenSettings, onOpenPalette }: Props) {
  return (
    <nav aria-label="Sessions" className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <AgentOrb size="xs" />
        <span className="text-sm font-semibold tracking-tight">Float</span>
        <span className="rounded-full border border-signal/30 px-1.5 py-px font-mono text-[9px] uppercase tracking-wider text-signal">
          Agent
        </span>
      </div>

      <div className="flex flex-col gap-1.5 px-3">
        <button
          type="button"
          onClick={onNew}
          className="flex items-center gap-2 rounded-lg border bg-card/60 px-3 py-2 text-sm transition-colors hover:border-signal/40"
        >
          <Plus className="size-4 text-signal" aria-hidden="true" />
          New session
        </button>
        <button
          type="button"
          onClick={onOpenPalette}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          Command palette
          <Kbd className="ml-auto">{"⌘K"}</Kbd>
        </button>
      </div>

      <p className="px-5 pt-5 pb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Sessions</p>
      <ul className="scrollbar-thin flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        {sessions.map((s) => (
          <li key={s.id} className="group relative">
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              aria-current={s.id === activeId ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 pr-9 text-left text-sm transition-colors",
                s.id === activeId
                  ? "bg-sidebar-accent text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <MessageSquare
                className={cn("size-3.5 shrink-0", s.id === activeId && "text-signal")}
                aria-hidden="true"
              />
              <span className="truncate">{s.title}</span>
            </button>
            {sessions.length > 1 && (
              <button
                type="button"
                onClick={() => onDelete(s.id)}
                aria-label={`Delete ${s.title}`}
                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-0 hover:bg-muted hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="border-t p-3">
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <Settings2 className="size-4" aria-hidden="true" />
          Agent settings
        </button>
      </div>
    </nav>
  )
}
