"use client"

import { ArrowUp, FileText, Mic, MicOff, Paperclip, Square, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useSpeechRecognition } from "@/hooks/use-speech"
import { MODES, type ModeId } from "@/lib/agent-config"
import { cn } from "@/lib/utils"

type Props = {
  busy: boolean
  mode: ModeId
  modelLabel: string
  onModeChange: (mode: ModeId) => void
  onSubmit: (text: string, files: File[]) => void
  onStop: () => void
  onOpenSettings: () => void
  draft: string
  onDraftChange: (value: string) => void
}

export function Composer({
  busy,
  mode,
  modelLabel,
  onModeChange,
  onSubmit,
  onStop,
  onOpenSettings,
  draft,
  onDraftChange,
}: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [interim, setInterim] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        onDraftChange(`${draft}${draft && !draft.endsWith(" ") ? " " : ""}${text.trim()}`)
        setInterim("")
      } else {
        setInterim(text)
      }
    },
    [draft, onDraftChange],
  )
  const speech = useSpeechRecognition(handleTranscript)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }, [draft, interim])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const submit = () => {
    const text = draft.trim()
    if ((!text && !files.length) || busy) return
    if (speech.listening) speech.stop()
    onSubmit(text, files)
    setFiles([])
    setInterim("")
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        className={cn(
          "relative rounded-2xl border bg-card/80 shadow-2xl shadow-black/40 backdrop-blur-xl transition-colors",
          "focus-within:border-signal/40",
          speech.listening && "border-signal/60",
        )}
      >
        {files.length > 0 && (
          <ul className="flex flex-wrap gap-2 px-3 pt-3" aria-label="Attachments">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg border bg-muted px-2.5 py-1 text-xs">
                <FileText className="size-3.5 text-signal" aria-hidden="true" />
                <span className="max-w-40 truncate">{file.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={() => setFiles((f) => f.filter((_, i) => i !== index))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <label htmlFor="composer" className="sr-only">
          Message Float
        </label>
        <textarea
          id="composer"
          ref={textareaRef}
          rows={1}
          value={interim ? `${draft}${draft ? " " : ""}${interim}` : draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return
              e.preventDefault()
              submit()
            }
          }}
          onPaste={(e) => {
            const pasted = Array.from(e.clipboardData.files)
            if (pasted.length) setFiles((f) => [...f, ...pasted].slice(0, 6))
          }}
          placeholder={speech.listening ? "Listening..." : "Give Float a goal. It will plan, use tools, and deliver."}
          className="block max-h-60 w-full resize-none bg-transparent px-4 pt-4 pb-2 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground"
        />

        <div className="flex items-center gap-1 px-2 pb-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.md,.csv,.json"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? [])
              setFiles((f) => [...f, ...picked].slice(0, 6))
              e.target.value = ""
            }}
          />
          <IconButton label="Attach files" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="size-4" aria-hidden="true" />
          </IconButton>
          {speech.supported && (
            <IconButton
              label={speech.listening ? "Stop voice input" : "Start voice input"}
              onClick={speech.listening ? speech.stop : speech.start}
              active={speech.listening}
            >
              {speech.listening ? <MicOff className="size-4" aria-hidden="true" /> : <Mic className="size-4" aria-hidden="true" />}
            </IconButton>
          )}

          <div className="mx-1 hidden h-5 w-px bg-border sm:block" />

          <div role="radiogroup" aria-label="Agent mode" className="hidden items-center gap-0.5 sm:flex">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mode === m.id}
                title={m.description}
                onClick={() => onModeChange(m.id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs transition-colors",
                  mode === m.id ? "bg-signal/15 text-signal" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            className="ml-auto truncate rounded-md px-2 py-1 font-mono text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {modelLabel}
          </button>

          {busy ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generating"
              className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background transition-transform hover:scale-105"
            >
              <Square className="size-3.5 fill-current" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!draft.trim() && !files.length}
              aria-label="Send message"
              className="flex size-9 items-center justify-center rounded-xl bg-signal text-signal-foreground shadow-[0_0_20px_oklch(0.88_0.16_170/0.35)] transition-all hover:scale-105 disabled:scale-100 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Float can make mistakes. Verify important info.
      </p>
    </div>
  )
}

function IconButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string
  onClick: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg transition-colors",
        active ? "bg-signal/15 text-signal" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}
