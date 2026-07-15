"use client";

import { createContext, useContext } from "react";

// "preview" = dirender langsung di browser form isian (satu gambar kop surat
// di awal konten sudah cukup, tidak ada konsep "halaman fisik" di situ).
// "print" = dirender lewat /print/surat/[token] untuk di-screenshot Puppeteer
// jadi PDF - kop surat TIDAK dirender inline di konten, karena Puppeteer
// menambahkannya sebagai page header yang otomatis berulang di SETIAP
// halaman fisik (lihat renderSuratPdf.ts), termasuk kalau surat meluber ke
// beberapa halaman yang tidak diantisipasi lebih dulu oleh template manapun.
export type RenderMode = "preview" | "print";

export const RenderModeContext = createContext<RenderMode>("preview");

export function useRenderMode(): RenderMode {
  return useContext(RenderModeContext);
}
