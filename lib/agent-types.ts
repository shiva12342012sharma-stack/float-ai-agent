import type { InferUITools, UIMessage } from "ai"
import type { AgentTools } from "./agent-tools"

export type AgentMetadata = {
  model?: string
  createdAt?: number
  finishedAt?: number
  totalTokens?: number
  inputTokens?: number
  outputTokens?: number
}

export type AgentUIMessage = UIMessage<AgentMetadata, never, InferUITools<AgentTools>>
