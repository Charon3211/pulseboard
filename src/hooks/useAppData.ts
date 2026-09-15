'use client';

import { useCallback, useEffect, useState } from 'react';
import { defaultData, isImportableData, normalizeData } from '../lib/migration';
import type { AppData } from '../lib/types';

export const STORAGE_KEY = 'pulseboard:v1';

type ImportResult = { ok: true } | { ok: false; error: string };

export function useAppData() {
  const [data, setData] = useState<AppData>(defaultData);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setData(normalizeData(JSON.parse(stored)));
      } catch {
        setData(defaultData());
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* keep the in-memory session alive */ }
  }, [data, ready]);

  const updateData = useCallback((patch: Partial<AppData>) => setData(current => ({ ...current, ...patch })), []);
  const replaceData = useCallback((next: AppData) => setData(normalizeData(next)), []);
  const resetData = useCallback(() => setData(defaultData()), []);
  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'hasans-space-backup.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }, [data]);
  const importJson = useCallback(async (file: File): Promise<ImportResult> => {
    let parsed: unknown;
    try {
      const text = await file.text();
      if (!text.trim()) return { ok: false, error: 'The backup file is empty.' };
      parsed = JSON.parse(text);
    } catch { return { ok: false, error: 'That file is not valid JSON.' }; }
    if (!isImportableData(parsed)) return { ok: false, error: 'This file is not a Hasan’s Space backup.' };
    try { replaceData(normalizeData(parsed)); return { ok: true }; } catch { return { ok: false, error: 'The backup could not be normalized safely.' }; }
  }, [replaceData]);

  return { data, ready, updateData, replaceData, resetData, exportJson, importJson };
}
