"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DISTINCTION_LENS, KSBS } from "@/lib/ksbs";

function Checkbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0">
      <input
        type="checkbox"
        className="peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="pointer-events-none absolute inset-0 border border-border bg-surface-2 peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" />
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute inset-0 hidden h-full w-full p-[3px] text-accent-ink peer-checked:block"
      >
        <path d="M3.5 8.5l3 3 6-7" />
      </svg>
    </span>
  );
}

const CHECKLIST = [
  { id: "id", label: "Photo ID to hand" },
  { id: "quiet", label: "Quiet, closed room, no interruptions" },
  { id: "wired", label: "A wired connection, or one you've tested" },
];

const DISTINCTION_SUMMARY: {
  method: string;
  clusters: { codes: string[]; lensKey: string }[];
}[] = [
  {
    method: "Professional Discussion",
    clusters: [
      { codes: ["K4", "S15", "B7"], lensKey: "K4" },
      { codes: ["K7"], lensKey: "K7" },
      { codes: ["K12"], lensKey: "K12" },
    ],
  },
  {
    method: "Project Questioning",
    clusters: [
      { codes: ["K6"], lensKey: "K6" },
      { codes: ["S1"], lensKey: "S1" },
      { codes: ["S7"], lensKey: "S7" },
      { codes: ["S11"], lensKey: "S11" },
    ],
  },
];

export default function Home() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [camera, setCamera] = useState(false);
  const [transcript, setTranscript] = useState(false);

  const start = (mode: "full" | "discussion" | "project") => {
    const params = new URLSearchParams({ mode });
    if (camera) params.set("camera", "1");
    if (transcript) params.set("transcript", "1");
    router.push(`/session?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="max-w-5xl text-5xl font-extrabold leading-[0.95] tracking-tightest sm:text-6xl">
          Software Development EPA
          <br />
          <span className="text-accent whitespace-nowrap">Mock Assessment Simulator</span>
        </h1>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col">
          <section className="border border-border bg-surface p-6">
            <h2 className="text-2xl font-bold tracking-tight">Checklist</h2>
            <ul className="mt-4 space-y-3">
              {CHECKLIST.map((item) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <Checkbox
                      checked={!!checked[item.id]}
                      onChange={(v) =>
                        setChecked((c) => ({ ...c, [item.id]: v }))
                      }
                    />
                    {item.label}
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6 border border-border bg-surface p-6">
            <h2 className="text-2xl font-bold tracking-tight">Recording (Optional)</h2>
            <div className="mt-4 space-y-3 text-sm">
              <label className="flex cursor-pointer items-start gap-3 border border-border bg-surface-2 p-4">
                <Checkbox checked={camera} onChange={setCamera} />
                <span>
                  <span className="font-bold">Camera</span>
                  <span className="block text-xs text-muted">
                    Stays on this device - watch it back or download it.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 border border-border bg-surface-2 p-4">
                <Checkbox checked={transcript} onChange={setTranscript} />
                <span>
                  <span className="font-bold">Live Transcript</span>
                  <span className="block text-xs text-muted">
                    Captions, plus a check that distinction answers compare
                    options instead of just describing what you did.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <div className="mt-auto flex divide-x divide-border border border-border bg-surface">
            <div className="flex-1 p-4">
              <div className="text-xs text-muted">Professional Discussion</div>
              <div className="text-lg font-bold">60 min</div>
            </div>
            <div className="flex-1 p-4">
              <div className="text-xs text-muted">Comfort Break</div>
              <div className="text-lg font-bold">30 min</div>
            </div>
            <div className="flex-1 p-4">
              <div className="text-xs text-muted">Project Questioning</div>
              <div className="text-lg font-bold">60 min</div>
            </div>
          </div>

          <section className="mt-6 space-y-3">
            <button
              onClick={() => start("full")}
              className="w-full border border-transparent bg-accent px-4 py-3 text-sm font-semibold text-accent-ink hover:border-accent hover:bg-background"
            >
              Start Full Simulation - 150 min
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => start("discussion")}
                className="border border-border px-4 py-3 text-sm font-semibold hover:bg-accent hover:text-accent-ink"
              >
                Professional Discussion Only
              </button>
              <button
                onClick={() => start("project")}
                className="border border-border px-4 py-3 text-sm font-semibold hover:bg-accent hover:text-accent-ink"
              >
                Project Questioning Only
              </button>
            </div>
          </section>

          <section className="mt-6 border border-border bg-surface-2 p-6">
            <h2 className="text-lg font-bold tracking-tight">
              Practice Mode
            </h2>
            <p className="mt-1 text-xs text-muted">
              No clock. Browse the question bank and draft how you&apos;d
              structure each answer before the real thing.
            </p>
            <button
              onClick={() => router.push("/session?mode=prep")}
              className="mt-4 w-full border border-border bg-surface px-4 py-3 text-sm font-semibold hover:bg-accent hover:text-accent-ink"
            >
              Start Practice Mode - untimed
            </button>
          </section>
        </div>

        <div className="flex flex-col border border-border bg-surface p-6">
          <h2 className="text-2xl font-bold tracking-tight">
            Distinction Criteria
          </h2>
          <p className="mt-4 text-sm text-muted">
            {KSBS.filter((k) => k.distinction).length} of the 38 KSBs are
            marked for distinction. All nine want the same thing: don&apos;t
            just describe what you did - compare it to an alternative and
            explain why yours was better.
          </p>
          <div className="mt-4 flex flex-1 flex-col justify-center space-y-3">
            {DISTINCTION_SUMMARY.map((group) => (
              <div
                key={group.method}
                className="border border-border bg-surface-2 p-4"
              >
                <h3 className="text-lg font-bold">{group.method}</h3>
                <ul className="mt-3 space-y-5">
                  {group.clusters.map((cluster) => (
                    <li key={cluster.codes.join("-")} className="flex items-start gap-3 text-xs">
                      <span className="w-28 shrink-0 self-start whitespace-nowrap bg-accent/15 px-3 py-2 font-mono text-xs text-accent">
                        {cluster.codes.join(" · ")}
                      </span>
                      <span className="text-muted">
                        {DISTINCTION_LENS[cluster.lensKey]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
