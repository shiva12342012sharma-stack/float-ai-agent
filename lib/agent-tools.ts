import "server-only"

import { tool } from "ai"
import { all, create } from "mathjs"
import { z } from "zod"

const math = create(all)
const evaluate = math.evaluate.bind(math)
// Lock down mathjs so model-provided expressions cannot redefine or import functions.
math.import(
  {
    import: () => {
      throw new Error("Function import is disabled")
    },
    createUnit: () => {
      throw new Error("Function createUnit is disabled")
    },
    evaluate: () => {
      throw new Error("Function evaluate is disabled")
    },
    parse: () => {
      throw new Error("Function parse is disabled")
    },
    simplify: () => {
      throw new Error("Function simplify is disabled")
    },
    derivative: () => {
      throw new Error("Function derivative is disabled")
    },
  },
  { override: true },
)

const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Heavy showers",
  82: "Violent showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm",
}

const PRIVATE_HOST =
  /^(localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|\[?::1\]?|\[?f[cd][0-9a-f]{2}:.*)$/i

function htmlToText(html: string) {
  return html
    .replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

export const agentTools = {
  createPlan: tool({
    description:
      "Show the user a step-by-step execution plan before working on a multi-step task. Call this first for any task with 3+ steps.",
    inputSchema: z.object({
      goal: z.string().describe("The overall objective in one sentence"),
      steps: z.array(z.string()).min(2).max(8).describe("Short, actionable steps"),
    }),
    execute: async ({ goal, steps }) => ({ goal, steps, status: "accepted" as const }),
  }),

  getWeather: tool({
    description: "Get current weather conditions and today's forecast for any city or place.",
    inputSchema: z.object({
      location: z.string().describe("City or place name, e.g. 'Paris' or 'Austin, Texas'"),
    }),
    execute: async ({ location }) => {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&format=json`,
        { signal: AbortSignal.timeout(8000) },
      )
      const geo = (await geoRes.json()) as {
        results?: { name: string; country: string; latitude: number; longitude: number; timezone: string }[]
      }
      const place = geo.results?.[0]
      if (!place) return { error: `Could not find a location named "${location}"` }

      const wxRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`,
        { signal: AbortSignal.timeout(8000) },
      )
      const wx = (await wxRes.json()) as {
        current: {
          temperature_2m: number
          apparent_temperature: number
          relative_humidity_2m: number
          wind_speed_10m: number
          weather_code: number
          is_day: number
        }
        daily: { temperature_2m_max: number[]; temperature_2m_min: number[] }
      }

      return {
        location: `${place.name}, ${place.country}`,
        timezone: place.timezone,
        temperatureC: wx.current.temperature_2m,
        feelsLikeC: wx.current.apparent_temperature,
        humidity: wx.current.relative_humidity_2m,
        windKmh: wx.current.wind_speed_10m,
        condition: WEATHER_CODES[wx.current.weather_code] ?? "Unknown",
        isDay: wx.current.is_day === 1,
        highC: wx.daily.temperature_2m_max[0],
        lowC: wx.daily.temperature_2m_min[0],
      }
    },
  }),

  calculate: tool({
    description:
      "Evaluate a math expression precisely. Supports arithmetic, functions (sqrt, log, sin), matrices and unit conversions like '12 inch to cm'.",
    inputSchema: z.object({
      expression: z.string().max(500).describe("A mathjs-compatible expression"),
    }),
    execute: async ({ expression }) => {
      try {
        const result = evaluate(expression)
        return { expression, result: math.format(result, { precision: 14 }) }
      } catch (error) {
        return { expression, error: error instanceof Error ? error.message : "Invalid expression" }
      }
    },
  }),

  getTime: tool({
    description: "Get the current date and time in an IANA timezone such as 'Asia/Tokyo' or 'America/New_York'.",
    inputSchema: z.object({
      timezone: z.string().describe("IANA timezone identifier"),
    }),
    execute: async ({ timezone }) => {
      try {
        const now = new Date()
        const formatted = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          dateStyle: "full",
          timeStyle: "long",
        }).format(now)
        const time = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).format(now)
        return { timezone, formatted, time }
      } catch {
        return { timezone, error: "Unknown timezone" }
      }
    },
  }),

  searchWikipedia: tool({
    description: "Search Wikipedia for up-to-date encyclopedic knowledge. Returns top matching article extracts.",
    inputSchema: z.object({
      query: z.string().describe("Search query"),
    }),
    execute: async ({ query }) => {
      const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=4&prop=extracts|info&exintro=1&explaintext=1&exsentences=4&inprop=url&format=json&origin=*`,
        {
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": "FloatAgent/1.0 (https://vercel.com)" },
        },
      )
      const data = (await res.json()) as {
        query?: { pages: Record<string, { title: string; extract: string; fullurl: string; index: number }> }
      }
      const pages = Object.values(data.query?.pages ?? {})
        .sort((a, b) => a.index - b.index)
        .map((p) => ({ title: p.title, url: p.fullurl, extract: p.extract }))
      return { query, results: pages }
    },
  }),

  readWebpage: tool({
    description: "Fetch a public web page and return its readable text content (truncated).",
    inputSchema: z.object({
      url: z.string().url().describe("Absolute http(s) URL"),
    }),
    execute: async ({ url }) => {
      let parsed: URL
      try {
        parsed = new URL(url)
      } catch {
        return { url, error: "Invalid URL" }
      }
      if (!["http:", "https:"].includes(parsed.protocol) || PRIVATE_HOST.test(parsed.hostname)) {
        return { url, error: "Only public http(s) URLs are allowed" }
      }
      try {
        const res = await fetch(parsed, {
          signal: AbortSignal.timeout(10000),
          redirect: "follow",
          headers: { "User-Agent": "Mozilla/5.0 (compatible; FloatAgent/1.0)" },
        })
        if (!res.ok) return { url, error: `Request failed with status ${res.status}` }
        const html = (await res.text()).slice(0, 600_000)
        const title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? parsed.hostname
        const text = htmlToText(html).slice(0, 8000)
        return { url, title, text, characters: text.length }
      } catch (error) {
        return { url, error: error instanceof Error ? error.message : "Failed to fetch page" }
      }
    },
  }),
}

export type AgentTools = typeof agentTools
