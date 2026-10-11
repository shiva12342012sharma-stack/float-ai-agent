import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
} from "ai"
import { z } from "zod"
import { ALL_TOOLS, DEFAULT_SETTINGS, MODELS, MODES, type ToolName } from "@/lib/agent-config"
import { agentTools } from "@/lib/agent-tools"
import type { AgentUIMessage } from "@/lib/agent-types"

export const maxDuration = 60

const bodySchema = z.object({
  messages: z.array(z.any()).min(1).max(200),
  model: z.string().optional(),
  mode: z.string().optional(),
  temperature: z.number().min(0).max(1.5).optional(),
  maxSteps: z.number().int().min(1).max(16).optional(),
  tools: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 })
  }

  const body = parsed.data
  const messages = body.messages as AgentUIMessage[]
  const model = MODELS.some((m) => m.id === body.model) ? body.model! : DEFAULT_SETTINGS.model
  const mode = MODES.find((m) => m.id === body.mode) ?? MODES[0]
  const activeTools = (body.tools ?? ALL_TOOLS).filter((t): t is ToolName =>
    (ALL_TOOLS as string[]).includes(t),
  )

  const result = streamText({
    model,
    system: mode.system,
    messages: await convertToModelMessages(messages),
    temperature: body.temperature ?? DEFAULT_SETTINGS.temperature,
    tools: agentTools,
    activeTools,
    stopWhen: isStepCount(body.maxSteps ?? DEFAULT_SETTINGS.maxSteps),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      sendReasoning: true,
      messageMetadata: ({ part }) => {
        if (part.type === "start") {
          return { model, createdAt: Date.now() }
        }
        if (part.type === "finish") {
          return {
            finishedAt: Date.now(),
            totalTokens: part.totalUsage.totalTokens,
            inputTokens: part.totalUsage.inputTokens,
            outputTokens: part.totalUsage.outputTokens,
          }
        }
      },
    }),
  })
}
