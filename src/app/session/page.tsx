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
