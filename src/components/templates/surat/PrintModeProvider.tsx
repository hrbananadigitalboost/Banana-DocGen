"use client";

// Wrapper Client Component tersendiri - Server Component (halaman
// /print/surat/[token]) TIDAK BISA merender `Context.Provider` secara
// langsung (Context cuma valid dipakai di dalam Client Component di App
// Router), jadi butuh komponen client kecil ini sebagai jembatan.

import { RenderModeContext, type RenderMode } from "./renderModeContext";

export function PrintModeProvider({
  mode,
  children,
}: {
  mode: RenderMode;
  children: React.ReactNode;
}) {
  return <RenderModeContext.Provider value={mode}>{children}</RenderModeContext.Provider>;
}
