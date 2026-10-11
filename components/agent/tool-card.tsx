"use client"

import {
  BookOpen,
  Calculator,
  ChevronDown,
  CircleAlert,
  Clock,
  CloudSun,
  Globe,
  ListChecks,
  Loader2,
  type LucideIcon,
} from "lucide-react"
import { useState } from "react"
import { TOOL_META, type ToolName } from "@/lib/agent-config"
import { cn } from "@/lib/utils"

const ICONS: Record<ToolName, LucideIcon> = {
  createPlan: ListChecks,
  getWeather: CloudSun,
  calculate: Calculator,
  getTime: Clock,
  searchWikipedia: BookOpen,
  readWebpage: Globe,
}

type ToolState = "input-streaming" | "input-available" | "output-available" | "output-error" | string

type Props = {
  name: string
  state: ToolState
  input: unknown
  output: unknown
  errorText?: string
}

type AnyRecord = Record<string, unknown>

function summarizeInput(name: string, input: unknown) {
  const i = (input ?? {}) as AnyRecord
  switch (name) {
    case "getWeather":
      return i.location as string
    case "calculate":
      return i.expression as string
    case "getTime":
      return i.timezone as string
    case "searchWikipedia":
      return i.query as string
    case "readWebpage":
      return i.url as string
    case "createPlan":
      return i.goal as string
    default:
      return undefined
  }
}

function ToolOutput({ name, output }: { name: string; output: AnyRecord }) {
  if (typeof output.error === "string") {
    return (
      <p className="flex items-center gap-2 text-sm text-destructive">
        <CircleAlert className="size-4" aria-hidden="true" />
        {output.error}
      </p>
    )
  }

  if (name === "createPlan") {
    const steps = (output.steps as string[]) ?? []
    return (
      <ol className="flex flex-col gap-2">
        {steps.map((step, index) => (
          <li key={index} className="flex items-start gap-3 text-sm">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-signal/40 font-mono text-[10px] text-signal">
              {index + 1}
            </span>
            <span className="text-pretty text-foreground/90">{step}</span>
          </li>
        ))}
      </ol>
    )
  }

  if (name === "getWeather") {
    return (
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{output.location as string}</p>
          <p className="font-mono text-4xl font-light tracking-tight">
            {Math.round(output.temperatureC as number)}
            <span className="text-signal">{"°C"}</span>
          </p>
          <p className="text-sm text-foreground/80">{output.condition as string}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs">
          <dt className="text-muted-foreground">Feels</dt>
          <dd>{Math.round(output.feelsLikeC as number)}°</dd>
          <dt className="text-muted-foreground">H / L</dt>
          <dd>
            {Math.round(output.highC as number)}° / {Math.round(output.lowC as number)}°
          </dd>
          <dt className="text-muted-foreground">Humidity</dt>
          <dd>{output.humidity as number}%</dd>
          <dt className="text-muted-foreground">Wind</dt>
          <dd>{output.windKmh as number} km/h</dd>
        </dl>
      </div>
    )
  }

  if (name === "calculate") {
    return (
      <div className="font-mono">
        <p className="truncate text-xs text-muted-foreground">{output.expression as string}</p>
        <p className="text-2xl text-signal">= {output.result as string}</p>
      </div>
    )
  }

  if (name === "getTime") {
    return (
      <div className="flex items-baseline gap-4">
        <p className="font-mono text-3xl font-light text-signal">{output.time as string}</p>
        <p className="text-sm text-muted-foreground">{output.formatted as string}</p>
      </div>
    )
  }

  if (name === "searchWikipedia") {
    const results = (output.results as { title: string; url: string; extract: string }[]) ?? []
    if (!results.length) return <p className="text-sm text-muted-foreground">No results found.</p>
    return (
      <ul className="flex flex-col gap-3">
        {results.map((r) => (
          <li key={r.url} className="text-sm">
            <a href={r.url} target="_blank" rel="noreferrer" className="font-medium text-signal hover:underline">
              {r.title}
            </a>
            <p className="line-clamp-2 text-muted-foreground">{r.extract}</p>
          </li>
        ))}
      </ul>
    )
  }

  if (name === "readWebpage") {
    return (
      <div className="text-sm">
        <p className="font-medium">{output.title as string}</p>
        <p className="font-mono text-xs text-muted-foreground">
          {(output.characters as number)?.toLocaleString()} characters extracted
        </p>
        <p className="mt-2 line-clamp-3 text-muted-foreground">{output.text as string}</p>
      </div>
    )
  }

  return <pre className="overflow-x-auto font-mono text-xs">{JSON.stringify(output, null, 2)}</pre>
}

export function ToolCard({ name, state, input, output, errorText }: Props) {
  const meta = TOOL_META[name as ToolName]
  const Icon = ICONS[name as ToolName] ?? Globe
  const running = state === "input-streaming" || state === "input-available"
  const done = state === "output-available"
  const failed = state === "output-error"
  const [open, setOpen] = useState(name === "createPlan" || name === "getWeather" || name === "calculate" || name === "getTime")
  const summary = summarizeInput(name, input)

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card/60 backdrop-blur",
        running ? "border-signal/40" : "border-border",
      )}
    >
      {running && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
          <div className="h-full w-1/2 animate-scan bg-gradient-to-r from-transparent via-signal to-transparent" />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        disabled={!done}
        className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left disabled:cursor-default"
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-lg border",
            done ? "border-signal/30 bg-signal/10 text-signal" : "border-border bg-muted text-muted-foreground",
            failed && "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          {running ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Icon className="size-3.5" aria-hidden="true" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="flex items-center gap-2 text-xs font-medium">
            {meta?.label ?? name}
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {running ? "running" : failed ? "failed" : "done"}
            </span>
          </span>
          {summary && <span className="truncate font-mono text-xs text-muted-foreground">{summary}</span>}
        </span>
        {done && (
          <ChevronDown
            className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
        )}
      </button>
      {failed && <p className="border-t px-3.5 py-2.5 text-sm text-destructive">{errorText ?? "Tool failed"}</p>}
      {done && open && output != null && (
        <div className="border-t px-3.5 py-3">
          <ToolOutput name={name} output={output as AnyRecord} />
        </div>
      )}
    </div>
  )
}
