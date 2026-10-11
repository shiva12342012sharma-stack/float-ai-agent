"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"

type RecognitionResultEvent = {
  resultIndex: number
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>
}

type Recognition = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: RecognitionResultEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
}

type RecognitionCtor = new () => Recognition

function getRecognitionCtor(): RecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

const subscribeNoop = () => () => {}

export function useSpeechRecognition(onTranscript: (text: string, isFinal: boolean) => void) {
  const supported = useSyncExternalStore(
    subscribeNoop,
    () => Boolean(getRecognitionCtor()),
    () => false,
  )
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<Recognition | null>(null)
  const callbackRef = useRef(onTranscript)

  useEffect(() => {
    callbackRef.current = onTranscript
  }, [onTranscript])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) return
    const recognition = new Ctor()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || "en-US"
    recognition.onresult = (event) => {
      let finalText = ""
      let interim = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) finalText += result[0].transcript
        else interim += result[0].transcript
      }
      if (finalText) callbackRef.current(finalText, true)
      else if (interim) callbackRef.current(interim, false)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [])

  useEffect(() => () => recognitionRef.current?.stop(), [])

  return { supported, listening, start, stop }
}

export function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return
  const clean = text
    .replace(/```[\s\S]*?```/g, " code block omitted. ")
    .replace(/[#*_`>|\[\]()-]/g, " ")
    .replace(/https?:\/\/\S+/g, "")
    .slice(0, 1500)
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.rate = 1.05
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel()
}
