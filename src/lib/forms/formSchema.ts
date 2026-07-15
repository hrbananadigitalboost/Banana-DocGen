import { z } from "zod";

export type FieldType =
  | "text"
  | "textarea"
  | "date"
  | "currency"
  | "select"
  | "employeeRef"
  | "clientRef"
  | "signatoryRef"
  /** Daftar poin dinamis (bisa tambah/hapus baris) - disimpan sebagai string gabungan dipisah "\n". */
  | "textList";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[]; // untuk type "select"
  /** Field ini hanya ditampilkan jika field lain (key) bernilai sama dengan value. */
  showIf?: { key: string; value: string };
};

export type SuratFormSchema = {
  fields: FieldDef[];
};

// Semua nilai form disimpan sebagai string (sesuai input HTML mentah) supaya
// tipe form value tetap seragam Record<string, string> - konversi ke
// number/Date dilakukan di titik pemakaian (mis. saat render template PDF),
// bukan di layer validasi form ini.
function fieldToZod(field: FieldDef): z.ZodString {
  let schema = z.string();

  if (field.type === "currency") {
    schema = schema.regex(/^\d+(\.\d+)?$/, `${field.label} harus berupa angka`);
  }
  if (field.type === "date") {
    schema = schema.refine((v) => v === "" || !Number.isNaN(Date.parse(v)), {
      message: `${field.label} harus tanggal yang valid`,
    }) as unknown as z.ZodString;
  }
  if (field.type === "select" && field.options && field.options.length > 0) {
    schema = schema.refine((v) => v === "" || field.options!.includes(v), {
      message: `${field.label} tidak valid`,
    }) as unknown as z.ZodString;
  }

  if (field.required) {
    schema = schema.min(1, `${field.label} wajib diisi`);
  }

  return schema;
}

/** Bangun Zod object schema runtime dari definisi field dinamis SuratTemplate. */
export function buildZodSchemaFromFields(fields: FieldDef[]) {
  const shape: Record<string, z.ZodString> = {};
  for (const field of fields) {
    shape[field.key] = fieldToZod(field);
  }
  return z.object(shape);
}

/** Apakah field harus ditampilkan, berdasarkan nilai form saat ini. */
export function isFieldVisible(field: FieldDef, values: Record<string, unknown>): boolean {
  if (!field.showIf) return true;
  return values[field.showIf.key] === field.showIf.value;
}
