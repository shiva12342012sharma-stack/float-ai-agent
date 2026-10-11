"use client"

import { Check } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { MODELS, MODES, TOOL_META, type AgentSettings, type ToolName } from "@/lib/agent-config"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: AgentSettings
  onChange: (patch: Partial<AgentSettings>) => void
  autoSpeak: boolean
  onAutoSpeakChange: (value: boolean) => void
}

function sliderValue(v: number | readonly number[]) {
  return Array.isArray(v) ? v[0] : (v as number)
}

export function SettingsSheet({ open, onOpenChange, settings, onChange, autoSpeak, onAutoSpeakChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="scrollbar-thin w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Agent settings</SheetTitle>
          <SheetDescription>Tune the brain, behavior, and toolbelt of your agent.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-8 px-4 pb-8">
          <section className="flex flex-col gap-3">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Model</h3>
            <div role="radiogroup" aria-label="Model" className="flex flex-col gap-1.5">
              {MODELS.map((m) => {
                const selected = settings.model === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onChange({ model: m.id })}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                      selected ? "border-signal/50 bg-signal/10" : "hover:bg-muted",
                    )}
                  >
                    <span className="flex flex-1 flex-col">
                      <span className="text-sm font-medium">{m.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {m.provider} · {m.tagline}
                      </span>
                    </span>
                    {selected && <Check className="size-4 text-signal" aria-hidden="true" />}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Mode</h3>
            <div role="radiogroup" aria-label="Mode" className="grid grid-cols-2 gap-1.5">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={settings.mode === m.id}
                  onClick={() => onChange({ mode: m.id })}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-lg border p-3 text-left transition-colors",
                    settings.mode === m.id ? "border-signal/50 bg-signal/10" : "hover:bg-muted",
                  )}
                >
                  <span className="text-sm font-medium">{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-5">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Behavior</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span id="temp-label">Creativity</span>
                <span className="font-mono text-xs text-signal">{settings.temperature.toFixed(1)}</span>
              </div>
              <Slider
                aria-labelledby="temp-label"
                min={0}
                max={1.5}
                step={0.1}
                value={[settings.temperature]}
                onValueChange={(v) => onChange({ temperature: sliderValue(v) })}
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span id="steps-label">Autonomy (max steps)</span>
                <span className="font-mono text-xs text-signal">{settings.maxSteps}</span>
              </div>
              <Slider
                aria-labelledby="steps-label"
                min={1}
                max={16}
                step={1}
                value={[settings.maxSteps]}
                onValueChange={(v) => onChange({ maxSteps: sliderValue(v) })}
              />
            </div>
            <label className="flex items-center justify-between gap-4 text-sm">
              <span className="flex flex-col">
                Voice replies
                <span className="text-xs text-muted-foreground">Read every answer aloud automatically</span>
              </span>
              <Switch checked={autoSpeak} onCheckedChange={onAutoSpeakChange} />
            </label>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Toolbelt</h3>
            <ul className="flex flex-col gap-3">
              {(Object.keys(TOOL_META) as ToolName[]).map((name) => {
                const enabled = settings.tools.includes(name)
                return (
                  <li key={name}>
                    <label className="flex items-center justify-between gap-4 text-sm">
                      <span className="flex flex-col">
                        {TOOL_META[name].label}
                        <span className="text-xs text-muted-foreground">{TOOL_META[name].description}</span>
                      </span>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          onChange({
                            tools: checked ? [...settings.tools, name] : settings.tools.filter((t) => t !== name),
                          })
                        }
                      />
                    </label>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
