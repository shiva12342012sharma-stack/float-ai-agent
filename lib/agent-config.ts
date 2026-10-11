export type ModelOption = {
  id: string
  label: string
  provider: string
  tagline: string
}

export const MODELS: ModelOption[] = [
  {
    id: "anthropic/claude-sonnet-5.5",
    label: "Claude Sonnet 5.5",
    provider: "Anthropic",
    tagline: "Balanced reasoning & tool use",
  },
  {
    id: "openai/gpt-6.1-sol",
    label: "GPT-6.1 Sol",
    provider: "OpenAI",
    tagline: "Frontier general intelligence",
  },
  {
    id: "google/gemini-3.8-flash",
    label: "Gemini 3.8 Flash",
    provider: "Google",
    tagline: "Ultra-fast responses",
  },
  {
    id: "anthropic/claude-opus-5.5",
    label: "Claude Opus 5.5",
    provider: "Anthropic",
    tagline: "Deepest analysis",
  },
  {
    id: "deepseek/deepseek-v4-pro",
    label: "DeepSeek V4 Pro",
    provider: "DeepSeek",
    tagline: "Open-weight powerhouse",
  },
]

export const DEFAULT_MODEL = MODELS[0].id

export type ModeId = "autopilot" | "research" | "code" | "create"

export type AgentMode = {
  id: ModeId
  label: string
  description: string
  system: string
  suggestions: { title: string; prompt: string }[]
}

const BASE_SYSTEM = `You are Float, an autonomous AI agent running inside the user's personal command center.
You think step by step, use tools proactively when they produce better answers, and you never invent tool results.
When a task has 3 or more steps, call the createPlan tool first to show your plan, then execute it.
Format answers in clean Markdown. Be concise, direct, and confident. Today's date is ${new Date().toDateString()}.`

export const MODES: AgentMode[] = [
  {
    id: "autopilot",
    label: "Autopilot",
    description: "General-purpose agent that plans and acts",
    system: `${BASE_SYSTEM}\nMode: AUTOPILOT. Decide on your own which tools to chain together to complete the goal end-to-end.`,
    suggestions: [
      {
        title: "Plan a weekend in Tokyo",
        prompt: "Plan a 2-day weekend in Tokyo. Check the current weather there and the local time, then build an itinerary.",
      },
      {
        title: "Compare two cities",
        prompt: "Compare the current weather in Reykjavik and Lisbon and tell me which is better for a walk right now.",
      },
      {
        title: "Crunch numbers",
        prompt: "If I invest $500/month at 7% annual return compounded monthly for 25 years, how much will I have?",
      },
      {
        title: "Brief me on a topic",
        prompt: "Give me a sharp briefing on quantum error correction using Wikipedia as a source.",
      },
    ],
  },
  {
    id: "research",
    label: "Research",
    description: "Cites sources and cross-checks facts",
    system: `${BASE_SYSTEM}\nMode: RESEARCH. Always ground claims with searchWikipedia or readWebpage. Cite sources inline as Markdown links. End with a short "Key takeaways" list.`,
    suggestions: [
      { title: "History of the transistor", prompt: "Research the history of the transistor and summarize the 5 most important milestones." },
      { title: "Read & summarize a page", prompt: "Read https://en.wikipedia.org/wiki/Large_language_model and summarize it in 6 bullet points." },
      { title: "Explain CRISPR", prompt: "Research how CRISPR-Cas9 works and explain it to a smart 15 year old." },
      { title: "Fusion energy status", prompt: "What is the current state of nuclear fusion energy research? Cite sources." },
    ],
  },
  {
    id: "code",
    label: "Code",
    description: "Senior engineer for building & debugging",
    system: `${BASE_SYSTEM}\nMode: CODE. Act as a staff-level software engineer. Prefer TypeScript. Provide complete, runnable code blocks with language tags. Explain trade-offs briefly. Use calculate for any numeric work.`,
    suggestions: [
      { title: "Debounce hook", prompt: "Write a fully typed React useDebounce hook with tests." },
      { title: "Rate limiter", prompt: "Design a sliding-window rate limiter in TypeScript and explain the complexity." },
      { title: "Regex explained", prompt: "Write and explain a regex that validates IPv4 addresses." },
      { title: "SQL optimization", prompt: "How would you index a Postgres table of 50M orders queried by customer_id and created_at range?" },
    ],
  },
  {
    id: "create",
    label: "Create",
    description: "Imaginative writing & ideation",
    system: `${BASE_SYSTEM}\nMode: CREATE. Be imaginative, vivid, and original. Offer bold ideas, then refine them. Use structure (headings, lists) for ideation.`,
    suggestions: [
      { title: "Startup ideas", prompt: "Give me 5 startup ideas at the intersection of AI agents and climate tech." },
      { title: "Sci-fi micro story", prompt: "Write a 200-word sci-fi story about an AI that discovers it is dreaming." },
      { title: "Product naming", prompt: "Brainstorm 12 names for a privacy-first personal AI assistant, with taglines." },
      { title: "Launch tweet thread", prompt: "Write a punchy 6-tweet launch thread for a futuristic AI agent called Float." },
    ],
  },
]

export const TOOL_META = {
  createPlan: { label: "Planner", description: "Breaks goals into executable steps" },
  getWeather: { label: "Weather", description: "Live conditions anywhere on Earth" },
  calculate: { label: "Calculator", description: "Precise math & unit conversions" },
  getTime: { label: "World clock", description: "Current time in any timezone" },
  searchWikipedia: { label: "Knowledge", description: "Searches Wikipedia in real time" },
  readWebpage: { label: "Web reader", description: "Reads and extracts any public URL" },
} as const

export type ToolName = keyof typeof TOOL_META

export const ALL_TOOLS = Object.keys(TOOL_META) as ToolName[]

export type AgentSettings = {
  model: string
  mode: ModeId
  temperature: number
  maxSteps: number
  tools: ToolName[]
}

export const DEFAULT_SETTINGS: AgentSettings = {
  model: DEFAULT_MODEL,
  mode: "autopilot",
  temperature: 0.7,
  maxSteps: 8,
  tools: ALL_TOOLS,
}
