"use client"

import { Cpu, Download, Plus, Settings2, Sparkles, Trash2 } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { MODELS, MODES, type ModeId } from "@/lib/agent-config"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNew: () => void
  onClear: () => void
  onExport: () => void
  onOpenSettings: () => void
  onModel: (id: string) => void
  onMode: (id: ModeId) => void
}

export function CommandPalette({ open, onOpenChange, onNew, onClear, onExport, onOpenSettings, onModel, onMode }: Props) {
  const run = (fn: () => void) => () => {
    fn()
    onOpenChange(false)
  }
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Command palette" description="Run an agent command">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Session">
          <CommandItem onSelect={run(onNew)}>
            <Plus aria-hidden="true" />
            New session
            <CommandShortcut>{"⌘J"}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={run(onExport)}>
            <Download aria-hidden="true" />
            Export conversation as Markdown
          </CommandItem>
          <CommandItem onSelect={run(onClear)}>
            <Trash2 aria-hidden="true" />
            Clear current session
          </CommandItem>
          <CommandItem onSelect={run(onOpenSettings)}>
            <Settings2 aria-hidden="true" />
            Open agent settings
            <CommandShortcut>{"⌘,"}</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Mode">
          {MODES.map((m) => (
            <CommandItem key={m.id} value={`mode ${m.label}`} onSelect={run(() => onMode(m.id))}>
              <Sparkles aria-hidden="true" />
              Switch to {m.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Model">
          {MODELS.map((m) => (
            <CommandItem key={m.id} value={`model ${m.label} ${m.provider}`} onSelect={run(() => onModel(m.id))}>
              <Cpu aria-hidden="true" />
              {m.label}
              <span className="ml-auto text-xs text-muted-foreground">{m.provider}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
