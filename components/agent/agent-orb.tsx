import { cn } from "@/lib/utils"

export type OrbState = "idle" | "thinking" | "speaking" | "listening"

export function AgentOrb({
  state = "idle",
  size = "md",
  className,
}: {
  state?: OrbState
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}) {
  const active = state !== "idle"
  return (
    <div
      aria-hidden="true"
      data-state={state}
      className={cn(
        "relative shrink-0",
        size === "xs" && "size-6",
        size === "sm" && "size-8",
        size === "md" && "size-12",
        size === "lg" && "size-28 md:size-36",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 animate-orb-pulse rounded-full blur-xl transition-opacity duration-700",
          "bg-[conic-gradient(from_0deg,var(--signal),oklch(0.75_0.12_220),oklch(0.7_0.18_300),var(--signal))]",
          active ? "opacity-60" : "opacity-25",
        )}
      />
      <div
        className={cn(
          "absolute inset-0 animate-orb-spin rounded-full p-px",
          "bg-[conic-gradient(from_0deg,var(--signal),transparent_30%,oklch(0.75_0.12_220),transparent_70%,var(--signal))]",
          state === "thinking" && "[animation-duration:2.5s]",
          state === "speaking" && "[animation-duration:5s]",
        )}
      >
        <div className="size-full rounded-full bg-background" />
      </div>
      <div
        className={cn(
          "absolute inset-[18%] rounded-full",
          "bg-[radial-gradient(circle_at_35%_30%,oklch(0.97_0.05_170),var(--signal)_35%,oklch(0.45_0.12_220)_75%,oklch(0.2_0.05_250))]",
          "shadow-[0_0_24px_oklch(0.88_0.16_170/0.45)]",
          active && "animate-orb-pulse",
          state === "listening" && "[animation-duration:0.9s]",
        )}
      />
      <div className="absolute inset-[8%] animate-orb-spin-reverse rounded-full border border-dashed border-signal/25" />
    </div>
  )
}
