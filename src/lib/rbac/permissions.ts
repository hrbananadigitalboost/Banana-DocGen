import { Role } from "@/generated/prisma/enums";
import { KategoriSurat } from "@/generated/prisma/enums";

const FULL_LETTER_ACCESS: Role[keyof Role][] = [Role.ADMIN, Role.HRD, Role.DIREKSI];
const KOMERSIAL_ONLY_ROLES: Role[keyof Role][] = [Role.FINANCE_SALES, Role.AE];

/** Bisa membuat/void/edit surat berkategori tertentu. */
export function canManageKategori(role: Role, kategori: KategoriSurat): boolean {
  if (FULL_LETTER_ACCESS.includes(role)) return true;
  if (KOMERSIAL_ONLY_ROLES.includes(role)) return kategori === KategoriSurat.KOMERSIAL;
  return false; // VIEWER: read-only, tidak bisa create/void/edit
}

/** Bisa melihat log surat (semua role bisa lihat log, tapi VIEWER read-only). */
export function canViewLog(_role: Role): boolean {
  return true;
}

/**
 * Bisa MELIHAT/unduh surat berkategori tertentu - lebih longgar dari
 * canManageKategori. VIEWER/Staff read-only tetap lihat SEMUA kategori (PRD:
 * "Viewer/Staff (Read-Only Log)"), hanya FINANCE_SALES/AE yang dibatasi ke
 * KOMERSIAL saja (selaras dengan cakupan kerja mereka).
 */
export function canViewKategori(role: Role, kategori: KategoriSurat): boolean {
  if (KOMERSIAL_ONLY_ROLES.includes(role)) return kategori === KategoriSurat.KOMERSIAL;
  return true;
}

/** Dipakai untuk filter query log book/export - true kalau role ini hanya boleh lihat surat KOMERSIAL. */
export function isRestrictedToKomersial(role: Role): boolean {
  return KOMERSIAL_ONLY_ROLES.includes(role);
}

/** Administrasi sistem: kelola User, Role, dan SuratTemplate. Hanya ADMIN. */
export function isSystemAdmin(role: Role): boolean {
  return role === Role.ADMIN;
}

/** Bisa lihat data sensitif (NIK KTP) tanpa masking. */
export function canViewUnmaskedPii(role: Role): boolean {
  return role === Role.ADMIN || role === Role.HRD;
}

/** Bisa create/edit/nonaktifkan Master Karyawan & Master Klien. */
export function canManageMasterData(role: Role): boolean {
  return role === Role.ADMIN || role === Role.HRD;
}

export function maskNikKtp(nik: string): string {
  if (nik.length <= 4) return "****";
  return `${"*".repeat(nik.length - 4)}${nik.slice(-4)}`;
}
