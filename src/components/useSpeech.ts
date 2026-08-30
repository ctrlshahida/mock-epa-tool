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
  start: () => void;
  stop: () => void;
}

export interface SpeechState {
  supported: boolean;
  listening: boolean;
  error: string | null;
  interim: string;
  // Full finalised transcript since start(). Callers slice this by index to
  // get per-question / per-phase segments.
  finalText: string;
  start: () => void;
  stop: () => void;
}

export function useSpeech(enabled: boolean): SpeechState {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
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
    rec.onresult = (e) => {
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
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        wantedRef.current = false;
        setError("Microphone access was blocked - transcript disabled.");
        setListening(false);
      }
      // "no-speech" and "network" blips are recovered by onend restart.
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

  return { supported, listening, error, interim, finalText, start, stop };
}
