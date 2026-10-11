"use client"

import { getToolName, isToolUIPart } from "ai"
import { useMemo } from "react"
import { MODELS, MODES, TOOL_META, type AgentSettings, type ToolName } from "@/lib/agent-config"
import type { AgentUIMessage } from "@/lib/agent-types"
import { cn } from "@/lib/utils"

type Props = {
  messages: AgentUIMessage[]
  settings: AgentSettings
  status: string
}

export function TelemetryPanel({ messages, settings, status }: Props) {
  const stats = useMemo(() => {
    let tokens = 0
    let latencyTotal = 0
    let responses = 0
    const toolUsage: Record<string, number> = {}
    const timeline: { name: string; state: string; id: string }[] = []
    for (const m of messages) {
      if (m.role !== "assistant") continue
      tokens += m.metadata?.totalTokens ?? 0
      if (m.metadata?.finishedAt && m.metadata.createdAt) {
        latencyTotal += m.metadata.finishedAt - m.metadata.createdAt
        responses++
      }
      for (const p of m.parts) {
        if (isToolUIPart(p)) {
          const name = getToolName(p)
          toolUsage[name] = (toolUsage[name] ?? 0) + 1
          timeline.push({ name, state: p.state, id: p.toolCallId })
        }
      }
    }
    return {
      tokens,
      avgLatency: responses ? latencyTotal / responses / 1000 : 0,
      toolCalls: timeline.length,
      toolUsage,
      timeline: timeline.slice(-8).reverse(),
    }
  }, [messages])

  const model = MODELS.find((m) => m.id === settings.model)
  const mode = MODES.find((m) => m.id === settings.mode)
  const busy = status === "submitted" || status === "streaming"

  return (
    <aside aria-label="Agent telemetry" className="scrollbar-thin flex h-full flex-col gap-6 overflow-y-auto bg-sidebar p-5">
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Status</h2>
        <div className="flex items-center gap-2.5">
          <span className="relative flex size-2.5">
            {busy && <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal opacity-75" />}
            <span className={cn("relative inline-flex size-2.5 rounded-full", busy ? "bg-signal" : "bg-signal/50")} />
          </span>
          <span className="text-sm">
            {status === "submitted" ? "Planning" : status === "streaming" ? "Executing" : status === "error" ? "Error" : "Standing by"}
          </span>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
          <dt className="text-muted-foreground">Model</dt>
          <dd className="truncate text-right font-mono">{model?.label}</dd>
          <dt className="text-muted-foreground">Mode</dt>
          <dd className="text-right font-mono">{mode?.label}</dd>
          <dt className="text-muted-foreground">Temp</dt>
          <dd className="text-right font-mono">{settings.temperature.toFixed(1)}</dd>
          <dt className="text-muted-foreground">Max steps</dt>
          <dd className="text-right font-mono">{settings.maxSteps}</dd>
        </dl>
      </section>

      <section className="grid grid-cols-2 gap-2">
        <Stat label="Tokens" value={stats.tokens.toLocaleString()} />
        <Stat label="Tool calls" value={String(stats.toolCalls)} />
        <Stat label="Avg latency" value={stats.avgLatency ? `${stats.avgLatency.toFixed(1)}s` : "—"} />
        <Stat label="Turns" value={String(messages.filter((m) => m.role === "user").length)} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Toolbelt</h2>
        <ul className="flex flex-col gap-2">
          {(Object.keys(TOOL_META) as ToolName[]).map((name) => {
            const enabled = settings.tools.includes(name)
            const count = stats.toolUsage[name] ?? 0
            return (
              <li key={name} className={cn("flex items-center gap-2 text-xs", !enabled && "opacity-40")}>
                <span className={cn("size-1.5 rounded-full", enabled ? "bg-signal" : "bg-muted-foreground")} />
                <span className="flex-1">{TOOL_META[name].label}</span>
                <span className="font-mono text-muted-foreground">{count}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Activity</h2>
        {stats.timeline.length === 0 ? (
          <p className="text-xs text-muted-foreground">No tool activity yet.</p>
        ) : (
          <ol className="relative flex flex-col gap-3 border-l border-border pl-4">
            {stats.timeline.map((t) => (
              <li key={t.id} className="relative text-xs">
                <span
                  className={cn(
                    "absolute top-1 -left-[19.5px] size-2 rounded-full border-2 border-sidebar",
                    t.state === "output-available" ? "bg-signal" : t.state === "output-error" ? "bg-destructive" : "animate-pulse bg-chart-3",
                  )}
                />
                <span className="font-medium">{TOOL_META[t.name as ToolName]?.label ?? t.name}</span>
                <span className="ml-2 font-mono text-[10px] text-muted-foreground">{t.state.replace("output-", "").replace("input-", "")}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </aside>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card/50 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg">{value}</p>
    </div>
  )
}
