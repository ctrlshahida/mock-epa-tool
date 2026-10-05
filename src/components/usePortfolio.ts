"use client";

import { useCallback, useEffect, useState } from "react";

// The portfolio contains personal/employer details, so it is never deployed.
// The PDF lives only in this browser's IndexedDB - the server never sees it.

const DB_NAME = "epa-portfolio";
const STORE = "files";
const KEY = "portfolio";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = run(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

async function readStored(): Promise<Blob | null> {
  try {
    return ((await withStore("readonly", (s) => s.get(KEY))) as Blob) ?? null;
  } catch {
    return null;
  }
}

// Local dev still serves public/portfolio.pdf when it exists (it is gitignored,
// so on a deployed build this is a 404).
async function publicCopyExists(): Promise<boolean> {
  try {
    const res = await fetch("/portfolio.pdf", { method: "HEAD" });
    return (
      res.ok && (res.headers.get("content-type") ?? "").includes("pdf")
    );
  } catch {
    return false;
  }
}

export type PortfolioState =
  | { status: "loading" }
  | { status: "missing" }
  | { status: "ready"; url: string };

export function usePortfolio() {
  const [state, setState] = useState<PortfolioState>({ status: "loading" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    (async () => {
      const blob = await readStored();
      if (cancelled) return;
      if (blob) {
        objectUrl = URL.createObjectURL(blob);
        setState({ status: "ready", url: objectUrl });
      } else if (await publicCopyExists()) {
        if (!cancelled) setState({ status: "ready", url: "/portfolio.pdf" });
      } else if (!cancelled) {
        setState({ status: "missing" });
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  const upload = useCallback(async (file: File) => {
    setError(null);
    if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      setError("That doesn't look like a PDF.");
      return;
    }
    try {
      const blob = new Blob([file], { type: "application/pdf" });
      await withStore("readwrite", (s) => s.put(blob, KEY));
      setState({ status: "ready", url: URL.createObjectURL(blob) });
    } catch {
      setError("Couldn't save the PDF in this browser.");
    }
  }, []);

  const remove = useCallback(async () => {
    try {
      await withStore("readwrite", (s) => s.delete(KEY));
    } catch {
      // nothing stored / storage unavailable - fall through to "missing"
    }
    setState({ status: "missing" });
  }, []);

  return { state, error, upload, remove };
}
