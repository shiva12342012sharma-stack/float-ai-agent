"use client"

import { type Chat, useChat } from "@ai-sdk/react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { stopSpeaking } from "@/hooks/use-speech"
import { MODELS, type AgentSettings, type ModeId } from "@/lib/agent-config"
import type { AgentUIMessage } from "@/lib/agent-types"
import { Composer } from "./composer"
import { EmptyState } from "./empty-state"
import { MessageItem } from "./message-item"
import { AgentOrb } from "./agent-orb"

type Props = {
  chat: Chat<AgentUIMessage>
  settings: AgentSettings
  onSettingsChange: (patch: Partial<AgentSettings>) => void
  onOpenSettings: () => void
  onFirstMessage: (text: string) => void
  onMessagesChange: (messages: AgentUIMessage[], status: string) => void
}

async function filesToParts(files: File[]) {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<{ type: "file"; mediaType: string; filename: string; url: string }>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () =>
            resolve({
              type: "file",
              mediaType: file.type || "application/octet-stream",
              filename: file.name,
              url: reader.result as string,
            })
          reader.onerror = reject
          reader.readAsDataURL(file)
        }),
    ),
  )
}

export function ChatView({ chat, settings, onSettingsChange, onOpenSettings, onFirstMessage, onMessagesChange }: Props) {
  const { messages, sendMessage, status, stop, regenerate, error, clearError } = useChat({ chat })
  const [draft, setDraft] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  const busy = status === "submitted" || status === "streaming"
  const model = MODELS.find((m) => m.id === settings.model)

  useEffect(() => {
    onMessagesChange(messages, status)
  }, [messages, status, onMessagesChange])

  useEffect(() => {
    const el = scrollRef.current
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight
  }, [messages])

  const submit = async (text: string, files: File[]) => {
    if (messages.length === 0) onFirstMessage(text || files[0]?.name || "New session")
    stickToBottom.current = true
    stopSpeaking()
    setDraft("")
    const fileParts = files.length ? await filesToParts(files) : []
    sendMessage({
      role: "user",
      parts: [...fileParts, ...(text ? [{ type: "text" as const, text }] : [])],
    })
  }

  const lastIsUser = messages.at(-1)?.role === "user"

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget
          stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
        }}
        className="scrollbar-thin flex min-h-0 flex-1 flex-col overflow-y-auto"
      >
        {messages.length === 0 ? (
          <EmptyState mode={settings.mode} onPick={(prompt) => submit(prompt, [])} />
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8" aria-live="polite">
            {messages.map((m, i) => (
              <MessageItem
                key={m.id}
                message={m}
                isLast={i === messages.length - 1}
                streaming={busy}
                onRegenerate={() => regenerate()}
              />
            ))}
            {status === "submitted" && lastIsUser && (
              <div className="flex items-center gap-3 md:gap-4">
                <AgentOrb size="sm" state="thinking" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Initializing agent loop
                  <span className="animate-pulse">...</span>
                </span>
              </div>
            )}
            {error && (
              <div role="alert" className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
                <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
                <span className="flex-1">Something went wrong. {error.message}</span>
                <button
                  type="button"
                  onClick={() => {
                    clearError()
                    regenerate()
                  }}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-muted"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-3 pt-2 pb-3 md:px-4 md:pb-4">
        <Composer
          busy={busy}
          mode={settings.mode}
          modelLabel={model?.label ?? settings.model}
          onModeChange={(mode: ModeId) => onSettingsChange({ mode })}
          onSubmit={submit}
          onStop={stop}
          onOpenSettings={onOpenSettings}
          draft={draft}
          onDraftChange={setDraft}
        />
      </div>
    </div>
  )
}
