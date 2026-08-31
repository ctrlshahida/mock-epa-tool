"use client";

import { useState } from "react";
import { PHASE_LABEL, type Phase } from "@/lib/ksbs";
import { PHASE_COLORS } from "./charts/chartTheme";

export interface SessionTableRow {
  id: string;
  createdAt: string; // ISO
  phase: Phase;
  timeUsedSec: number;
  questionsCovered: number;
  wpm: number | null;
  fillerCount: number | null;
  distinctionFlagsHit: number;
  distinctionFlagsTotal: number;
  ksbTags: string[];
  notes: string | null;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SessionTable({ rows }: { rows: SessionTableRow[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="py-2 pr-3 font-medium">When</th>
            <th className="py-2 pr-3 font-medium">Phase</th>
            <th className="py-2 pr-3 font-medium tabular-nums">Time</th>
            <th className="py-2 pr-3 font-medium tabular-nums">Questions</th>
            <th className="py-2 pr-3 font-medium tabular-nums">~wpm</th>
            <th className="py-2 pr-3 font-medium tabular-nums">~fillers</th>
            <th className="py-2 pr-3 font-medium tabular-nums">Eval lang.</th>
            <th className="py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <RowPair
              key={r.id}
              row={r}
              open={!!open[r.id]}
              toggle={() => setOpen((o) => ({ ...o, [r.id]: !o[r.id] }))}
            />
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-muted">
        wpm and filler counts are rough self-review indicators, not measurements.
      </p>
    </div>
  );
}

function RowPair({
  row,
  open,
  toggle,
}: {
  row: SessionTableRow;
  open: boolean;
  toggle: () => void;
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-b border-border/60 hover:bg-surface-2/50"
        onClick={toggle}
      >
        <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(row.createdAt)}</td>
        <td className="py-2 pr-3">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5"
              style={{ background: PHASE_COLORS[row.phase] }}
            />
            {PHASE_LABEL[row.phase]}
          </span>
        </td>
        <td className="py-2 pr-3 tabular-nums">
          {Math.round(row.timeUsedSec / 60)}m
        </td>
        <td className="py-2 pr-3 tabular-nums">{row.questionsCovered}</td>
        <td className="py-2 pr-3 tabular-nums">{row.wpm ?? "-"}</td>
        <td className="py-2 pr-3 tabular-nums">{row.fillerCount ?? "-"}</td>
        <td className="py-2 pr-3 tabular-nums">
          {row.distinctionFlagsTotal > 0
            ? `${row.distinctionFlagsHit}/${row.distinctionFlagsTotal}`
            : "-"}
        </td>
        <td className="py-2 text-right text-xs text-muted">
          {open ? "▲" : "▼"}
        </td>
      </tr>
      {open && (
        <tr className="border-b border-border/60 bg-surface-2/30">
          <td colSpan={8} className="px-3 py-3">
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-semibold text-muted">KSBs covered: </span>
                {row.ksbTags.length > 0 ? (
                  <span className="font-mono">{[...row.ksbTags].sort().join(", ")}</span>
                ) : (
                  "none recorded"
                )}
              </div>
              <div>
                <span className="font-semibold text-muted">Notes: </span>
                {row.notes ? (
                  <span className="whitespace-pre-wrap">{row.notes}</span>
                ) : (
                  <span className="text-muted">none</span>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
