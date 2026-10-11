"use client"

import { Chat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Activity, Menu, PanelRight } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { speak } from "@/hooks/use-speech"
import { DEFAULT_SETTINGS, MODELS, MODES, type AgentSettings } from "@/lib/agent-config"
import type { AgentUIMessage } from "@/lib/agent-types"
import { cn } from "@/lib/utils"
import { ChatView } from "./chat-view"
import { CommandPalette } from "./command-palette"
import { SessionSidebar } from "./session-sidebar"
import { SettingsSheet } from "./settings-sheet"
import { TelemetryPanel } from "./telemetry-panel"

type Session = { id: string; title: string; chat: Chat<AgentUIMessage> }

export function AgentWorkspace() {
  const [settings, setSettings] = useState<AgentSettings>(DEFAULT_SETTINGS)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const settingsRef = useRef(settings)
  const autoSpeakRef = useRef(autoSpeak)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])
  useEffect(() => {
    autoSpeakRef.current = autoSpeak
  }, [autoSpeak])

  const createSession = useCallback((): Session => {
    const id = crypto.randomUUID()
    return {
      id,
      title: "New session",
      chat: new Chat<AgentUIMessage>({
        id,
        transport: new DefaultChatTransport({
          api: "/api/chat",
          body: () => ({ ...settingsRef.current }),
        }),
        onFinish: ({ message, isAbort, isError }) => {
          if (isAbort || isError || !autoSpeakRef.current) return
          const text = message.parts
            .filter((p) => p.type === "text")
            .map((p) => p.text)
            .join(" ")
          if (text) speak(text)
        },
      }),
    }
  }, [])

  const [sessions, setSessions] = useState<Session[]>(() => [createSession()])
  const [activeId, setActiveId] = useState(() => sessions[0].id)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [telemetryOpen, setTelemetryOpen] = useState(true)
  const [mobileTelemetryOpen, setMobileTelemetryOpen] = useState(false)
  const [live, setLive] = useState<{ messages: AgentUIMessage[]; status: string }>({ messages: [], status: "ready" })

  const active = sessions.find((s) => s.id === activeId) ?? sessions[0]

  const updateSettings = useCallback((patch: Partial<AgentSettings>) => {
    setSettings((s) => ({ ...s, ...patch }))
  }, [])

  const newSession = useCallback(() => {
    const s = createSession()
    setSessions((prev) => [s, ...prev])
    setActiveId(s.id)
    setNavOpen(false)
  }, [createSession])

  const deleteSession = (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (id === activeId && next[0]) setActiveId(next[0].id)
      return next
    })
  }

  const clearSession = () => {
    active.chat.messages = []
    setSessions((prev) => prev.map((s) => (s.id === active.id ? { ...s, title: "New session" } : s)))
  }

  const exportSession = () => {
    const lines = [`# ${active.title}`, ""]
    for (const m of active.chat.messages) {
      lines.push(`## ${m.role === "user" ? "You" : "Float"}`, "")
      for (const p of m.parts) {
        if (p.type === "text") lines.push(p.text, "")
        else if (p.type.startsWith("tool-")) lines.push(`> Tool: ${p.type.slice(5)}`, "")
      }
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${active.title.replace(/[^\w-]+/g, "-").toLowerCase() || "session"}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFirstMessage = useCallback(
    (text: string) => {
      const title = text.length > 42 ? `${text.slice(0, 42)}...` : text
      setSessions((prev) => prev.map((s) => (s.id === activeId ? { ...s, title } : s)))
    },
    [activeId],
  )

  const handleMessagesChange = useCallback((messages: AgentUIMessage[], status: string) => {
    setLive({ messages, status })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return
      const key = e.key.toLowerCase()
      if (key === "k") {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      } else if (key === "j") {
        e.preventDefault()
        newSession()
      } else if (key === ",") {
        e.preventDefault()
        setSettingsOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [newSession])

  const sidebar = (
    <SessionSidebar
      sessions={sessions.map((s) => ({ id: s.id, title: s.title, messageCount: 0 }))}
      activeId={active.id}
      onSelect={(id) => {
        setActiveId(id)
        setNavOpen(false)
      }}
      onNew={newSession}
      onDelete={deleteSession}
      onOpenSettings={() => {
        setNavOpen(false)
        setSettingsOpen(true)
      }}
      onOpenPalette={() => {
        setNavOpen(false)
        setPaletteOpen(true)
      }}
    />
  )

  const telemetry = <TelemetryPanel messages={live.messages} settings={settings} status={live.status} />
  const model = MODELS.find((m) => m.id === settings.model)
  const mode = MODES.find((m) => m.id === settings.mode)

  return (
    <div className="relative flex h-dvh overflow-hidden bg-background">
      <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-signal/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative hidden w-64 shrink-0 border-r lg:block">{sidebar}</div>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" showCloseButton={false} className="w-72 p-0">
          <SheetTitle className="sr-only">Sessions</SheetTitle>
          {sidebar}
        </SheetContent>
      </Sheet>

      <main className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3 backdrop-blur md:px-4">
          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open sessions"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
          >
            <Menu className="size-4" aria-hidden="true" />
          </button>
          <h1 className="truncate text-sm font-medium">{active.title}</h1>
          <span className="hidden items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:flex">
            <Activity className="size-3 text-signal" aria-hidden="true" />
            {mode?.label} · {model?.label}
          </span>
          <button
            type="button"
            onClick={() => {
              if (window.matchMedia("(min-width: 1280px)").matches) setTelemetryOpen((o) => !o)
              else setMobileTelemetryOpen(true)
            }}
            aria-label="Toggle telemetry panel"
            aria-pressed={telemetryOpen}
            className="ml-auto flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <PanelRight className="size-4" aria-hidden="true" />
          </button>
        </header>

        <ChatView
          key={active.id}
          chat={active.chat}
          settings={settings}
          onSettingsChange={updateSettings}
          onOpenSettings={() => setSettingsOpen(true)}
          onFirstMessage={handleFirstMessage}
          onMessagesChange={handleMessagesChange}
        />
      </main>

      <div className={cn("relative hidden w-72 shrink-0 border-l", telemetryOpen && "xl:block")}>{telemetry}</div>

      <Sheet open={mobileTelemetryOpen} onOpenChange={setMobileTelemetryOpen}>
        <SheetContent side="right" className="w-80 p-0">
          <SheetTitle className="sr-only">Agent telemetry</SheetTitle>
          {telemetry}
        </SheetContent>
      </Sheet>

      <SettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onChange={updateSettings}
        autoSpeak={autoSpeak}
        onAutoSpeakChange={setAutoSpeak}
      />

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onNew={newSession}
        onClear={clearSession}
        onExport={exportSession}
        onOpenSettings={() => setSettingsOpen(true)}
        onModel={(id) => updateSettings({ model: id })}
        onMode={(id) => updateSettings({ mode: id })}
      />
    </div>
  )
}
