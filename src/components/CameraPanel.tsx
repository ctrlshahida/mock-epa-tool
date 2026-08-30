"use client";

import { useEffect, useRef, useState } from "react";

// Opt-in camera capture. Everything stays client-side: live self-view,
// MediaRecorder, and a local download link for the finished recording.
// The recording itself is never uploaded anywhere.
export default function CameraPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [status, setStatus] = useState<"idle" | "live" | "recording" | "stopped" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus("live");
      } catch {
        setError("Camera/microphone access was blocked.");
        setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
      recorderRef.current?.state === "recording" && recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const startRecording = () => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      setDownloadUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return URL.createObjectURL(blob);
      });
      setStatus("stopped");
    };
    recorder.start();
    recorderRef.current = recorder;
    setStatus("recording");
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  return (
    <section className="border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Camera (local only)</h3>
        {status === "recording" && (
          <span className="flex items-center gap-1.5 text-xs text-warn">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-warn" />
            recording
          </span>
        )}
      </div>
      {error ? (
        <p className="mt-2 text-xs text-warn">{error}</p>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="mt-3 aspect-video w-full bg-black"
          />
          <div className="mt-3 flex items-center gap-2">
            {status === "live" || status === "stopped" ? (
              <button
                onClick={startRecording}
                className="border border-border bg-surface-2 px-3 py-1.5 text-xs font-semibold hover:bg-accent hover:text-accent-ink"
              >
                {status === "stopped" ? "Record again" : "Start recording"}
              </button>
            ) : status === "recording" ? (
              <button
                onClick={stopRecording}
                className="rounded border border-warn/50 px-3 py-1.5 text-xs text-warn hover:bg-warn/10"
              >
                Stop recording
              </button>
            ) : null}
            {downloadUrl && (
              <a
                href={downloadUrl}
                download={`epa-mock-${new Date().toISOString().slice(0, 16).replace(":", "")}.webm`}
                className="text-xs text-accent underline"
              >
                Download recording
              </a>
            )}
          </div>
          {downloadUrl && (
            <video src={downloadUrl} controls className="mt-3 aspect-video w-full bg-black" />
          )}
        </>
      )}
    </section>
  );
}
