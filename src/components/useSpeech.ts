"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typings for the Web Speech API (not in lib.dom for all targets).
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onspeechstart: (() => void) | null;
  start: () => void;
  stop: () => void;
}

// What the recogniser has actually done - surfaced in the UI so a silent
// failure (mic opened but no speech service, etc.) is diagnosable.
export interface SpeechDebug {
  started: boolean;
  audio: boolean;
  speechDetected: boolean;
  results: number;
  ends: number;
  lastError: string | null;
}

const EMPTY_DEBUG: SpeechDebug = {
  started: false,
  audio: false,
  speechDetected: false,
  results: 0,
  ends: 0,
  lastError: null,
};

export interface SpeechState {
  supported: boolean;
  listening: boolean;
  error: string | null;
  interim: string;
  // Full finalised transcript since start(). Callers slice this by index to
  // get per-question / per-phase segments.
  finalText: string;
  debug: SpeechDebug;
  start: () => void;
  stop: () => void;
}

export function useSpeech(enabled: boolean): SpeechState {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
  const [debug, setDebug] = useState<SpeechDebug>(EMPTY_DEBUG);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const wantedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-GB";
    rec.onstart = () => setDebug((d) => ({ ...d, started: true }));
    rec.onaudiostart = () => setDebug((d) => ({ ...d, audio: true }));
    rec.onspeechstart = () => setDebug((d) => ({ ...d, speechDetected: true }));
    rec.onresult = (e) => {
      setDebug((d) => ({ ...d, results: d.results + 1 }));
      let interimChunk = "";
      let finalChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalChunk += r[0].transcript + " ";
        else interimChunk += r[0].transcript;
      }
      if (finalChunk) setFinalText((t) => t + finalChunk);
      setInterim(interimChunk);
    };
    rec.onend = () => {
      setDebug((d) => ({ ...d, ends: d.ends + 1 }));
      // Chrome stops recognition periodically; restart while still wanted.
      if (wantedRef.current) {
        try {
          rec.start();
        } catch {
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };
    rec.onerror = (e) => {
      setDebug((d) => ({ ...d, lastError: e.error }));
      const fatal: Record<string, string> = {
        "not-allowed": "Microphone access was blocked - transcript disabled.",
        "service-not-allowed": "Microphone access was blocked - transcript disabled.",
        // Chrome/Edge send audio to their own speech servers; this fires when
        // those can't be reached (offline, VPN/proxy, managed browser policy).
        network:
          "The browser's speech service couldn't be reached (network error). Live transcript needs internet access to Google/Microsoft speech servers - check your connection or VPN, or type your answer instead.",
        "audio-capture":
          "No microphone could be opened. Check one is connected and selected, and that no other app is using it exclusively.",
        "language-not-supported": "This browser doesn't support en-GB speech recognition.",
      };
      if (fatal[e.error]) {
        wantedRef.current = false;
        setError(fatal[e.error]);
        setListening(false);
      }
      // "no-speech" and "aborted" are normal; onend restarts recognition.
    };
    recRef.current = rec;
    return () => {
      wantedRef.current = false;
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
      recRef.current = null;
    };
  }, [enabled]);

  const start = useCallback(() => {
    if (!recRef.current || wantedRef.current) return;
    wantedRef.current = true;
    setError(null);
    setDebug(EMPTY_DEBUG);
    try {
      recRef.current.start();
      setListening(true);
    } catch {
      /* start() throws if already started */
    }
  }, []);

  const stop = useCallback(() => {
    wantedRef.current = false;
    try {
      recRef.current?.stop();
    } catch {
      /* already stopped */
    }
    setListening(false);
  }, []);

  return { supported, listening, error, interim, finalText, debug, start, stop };
}
