"use client"

import { code } from "@streamdown/code"
import { getToolName, isToolUIPart } from "ai"
import { Brain, Check, ChevronDown, Copy, FileText, RotateCcw, Volume2 } from "lucide-react"
import { memo, useState } from "react"
import { Streamdown } from "streamdown"
import { speak } from "@/hooks/use-speech"
import { MODELS } from "@/lib/agent-config"
import type { AgentUIMessage } from "@/lib/agent-types"
import { cn } from "@/lib/utils"
import { AgentOrb } from "./agent-orb"
import { ToolCard } from "./tool-card"

const plugins = { code }

function messageText(message: AgentUIMessage) {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("\n\n")
}

function Reasoning({ text, streaming }: { text: string; streaming: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-dashed bg-muted/30">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <Brain className={cn("size-3.5", streaming && "animate-pulse text-signal")} aria-hidden="true" />
        {streaming ? "Thinking..." : "Reasoning trace"}
        <ChevronDown className={cn("ml-auto size-3.5 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <p className="whitespace-pre-wrap border-t border-dashed px-3 py-2 font-mono text-xs leading-relaxed text-muted-foreground">
          {text}
        </p>
      )}
    </div>
  )
}

function MessageItemBase({
  message,
  isLast,
  streaming,
  onRegenerate,
}: {
  message: AgentUIMessage
  isLast: boolean
  streaming: boolean
  onRegenerate: () => void
}) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === "user"
  const text = messageText(message)

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[85%] flex-col items-end gap-2">
          {message.parts.map((part, i) => {
            if (part.type === "file") {
              return part.mediaType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={part.url || "/placeholder.svg"}
                  alt={part.filename ?? "Attached image"}
                  className="max-h-48 rounded-xl border object-cover"
                />
              ) : (
                <span key={i} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-xs">
                  <FileText className="size-3.5" aria-hidden="true" />
                  {part.filename ?? "Attachment"}
                </span>
              )
            }
            if (part.type === "text") {
              return (
                <p
                  key={i}
                  className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-[15px] leading-relaxed text-pretty"
                >
                  {part.text}
                </p>
              )
            }
            return null
          })}
        </div>
      </div>
    )
  }

  const model = MODELS.find((m) => m.id === message.metadata?.model)
  const latency =
    message.metadata?.finishedAt && message.metadata?.createdAt
      ? ((message.metadata.finishedAt - message.metadata.createdAt) / 1000).toFixed(1)
      : null
  const lastPart = message.parts.at(-1)

  return (
    <div className="group flex gap-3 md:gap-4">
      <AgentOrb size="sm" state={streaming && isLast ? "thinking" : "idle"} className="mt-0.5" />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {message.parts.map((part, i) => {
          if (part.type === "reasoning") {
            if (!part.text.trim()) return null
            return <Reasoning key={i} text={part.text} streaming={streaming && isLast && part === lastPart} />
          }
          if (part.type === "text") {
            return (
              <Streamdown
                key={i}
                plugins={plugins}
                isAnimating={streaming && isLast && part === lastPart}
                className="text-[15px] leading-relaxed"
              >
                {part.text}
              </Streamdown>
            )
          }
          if (isToolUIPart(part)) {
            return (
              <ToolCard
                key={part.toolCallId}
                name={getToolName(part)}
                state={part.state}
                input={part.input}
                output={part.state === "output-available" ? part.output : undefined}
                errorText={part.state === "output-error" ? part.errorText : undefined}
              />
            )
          }
          return null
        })}

        {!(streaming && isLast) && text && (
          <div className="flex flex-wrap items-center gap-1 text-muted-foreground opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
            <ActionButton label={copied ? "Copied" : "Copy"} onClick={copy}>
              {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
            </ActionButton>
            <ActionButton label="Read aloud" onClick={() => speak(text)}>
              <Volume2 className="size-3.5" aria-hidden="true" />
            </ActionButton>
            {isLast && (
              <ActionButton label="Regenerate" onClick={onRegenerate}>
                <RotateCcw className="size-3.5" aria-hidden="true" />
              </ActionButton>
            )}
            <span className="ml-2 font-mono text-[10px] uppercase tracking-wider">
              {[model?.label, latency && `${latency}s`, message.metadata?.totalTokens && `${message.metadata.totalTokens} tok`]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function ActionButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex size-7 items-center justify-center rounded-md hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  )
}

export const MessageItem = memo(MessageItemBase)
