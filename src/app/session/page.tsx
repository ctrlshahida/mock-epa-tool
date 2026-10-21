"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SessionRunner from "@/components/SessionRunner";
import PrepRunner from "@/components/PrepRunner";

function SessionRouter() {
  const params = useSearchParams();
  const mode = params.get("mode") ?? "full";
  if (mode === "prep") {
    const phase = params.get("phase");
    return (
      <PrepRunner
        initialPhase={phase === "discussion" || phase === "project" ? phase : "all"}
        initialKsbs={params.get("ksb")?.split(",").filter(Boolean)}
        initialCamera={params.get("camera") === "1"}
        initialTranscript={params.get("transcript") !== "0"}
      />
    );
  }
  return <SessionRunner />;
}

export default function SessionPage() {
  return (
    <Suspense fallback={null}>
      <SessionRouter />
    </Suspense>
  );
}
