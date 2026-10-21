"use client";

import { Fragment, useState } from "react";
import { PHASE_LABEL } from "@/lib/ksbs";
import type { AttemptResult } from "@/lib/practice-types";
import { PHASE_COLORS } from "./charts/chartTheme";
import AttemptResultView from "./AttemptResultView";

export interface AttemptTableRow {
  result: AttemptResult;
  questionText: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AttemptsTable({ rows }: { rows: AttemptTableRow[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="py-2 pr-3 font-medium">When</th>
            <th className="py-2 pr-3 font-medium">Question</th>
            <th className="py-2 pr-3 font-medium">KSBs</th>
            <th className="py-2 pr-3 font-medium tabular-nums">Score</th>
            <th className="py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ result: r, questionText }) => {
            const id = r.id ?? r.createdAt;
            const isOpen = !!open[id];
            return (
              <Fragment key={id}>
                <tr
                  className="cursor-pointer border-b border-border/60 hover:bg-surface-2/50"
                  onClick={() => setOpen((o) => ({ ...o, [id]: !o[id] }))}
                >
                  <td className="whitespace-nowrap py-2 pr-3">{fmtDate(r.createdAt)}</td>
                  <td className="max-w-md py-2 pr-3">
                    <span className="flex items-start gap-1.5">
                      <span
                        className="mt-1.5 inline-block h-2.5 w-2.5 flex-none"
                        style={{ background: PHASE_COLORS[r.phase] }}
                        title={PHASE_LABEL[r.phase]}
                      />
                      <span className="line-clamp-2">{questionText}</span>
                    </span>
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">
                    {r.ksbTags.length > 0 ? r.ksbTags.join(", ") : "-"}
                  </td>
                  <td className="py-2 pr-3 tabular-nums">
                    {r.overallScore !== null ? `${r.overallScore}%` : "-"}
                  </td>
                  <td className="py-2 text-right text-xs text-muted">{isOpen ? "▲" : "▼"}</td>
                </tr>
                {isOpen && (
                  <tr className="border-b border-border/60 bg-surface-2/30">
                    <td colSpan={5} className="space-y-4 px-3 py-4">
                      <div>
                        <div className="text-xs font-semibold text-muted">Your answer</div>
                        <p className="mt-1 whitespace-pre-wrap text-xs">{r.answerText}</p>
                      </div>
                      <AttemptResultView result={r} />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
