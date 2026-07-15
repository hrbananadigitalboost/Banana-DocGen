import { OfferingLetterTemplate } from "./OfferingLetterTemplate";
import { SuratPeringatanTemplate } from "./SuratPeringatanTemplate";
import { SuratKeteranganTemplate } from "./SuratKeteranganTemplate";
import { SuratEdaranTemplate } from "./SuratEdaranTemplate";
import { PerjanjianKerjaTemplate } from "./PerjanjianKerjaTemplate";
import { SuratPemutusanHubunganKerjaTemplate } from "./SuratPemutusanHubunganKerjaTemplate";
import { SuratKeputusanTemplate } from "./SuratKeputusanTemplate";
import { PerjanjianKerjaSamaTemplate } from "./PerjanjianKerjaSamaTemplate";
import { BeritaAcaraTemplate } from "./BeritaAcaraTemplate";
import { SuratTugasTemplate } from "./SuratTugasTemplate";
import { PerjanjianKerahasiaanTemplate } from "./PerjanjianKerahasiaanTemplate";
import { SuratPenawaranKerjaSamaTemplate } from "./SuratPenawaranKerjaSamaTemplate";
import { SuratPerintahKerjaTemplate } from "./SuratPerintahKerjaTemplate";
import { SuratPeringatanPembayaranTemplate } from "./SuratPeringatanPembayaranTemplate";
import type { SuratTemplateProps } from "./types";

export type SuratTemplateComponent = (props: SuratTemplateProps) => React.ReactElement;

/**
 * Menambah jenis surat baru = tambah row SuratTemplate (dengan formSchemaJson
 * + componentKey baru) + komponen React baru di folder ini + satu entry di
 * sini. Tidak perlu ubah routing/numbering/RBAC.
 */
export const templateRegistry: Record<string, SuratTemplateComponent> = {
  OL_v1: OfferingLetterTemplate,
  SRP_v1: SuratPeringatanTemplate,
  SK_v1: SuratKeteranganTemplate,
  SE_v1: SuratEdaranTemplate,
  SKK_v1: PerjanjianKerjaTemplate,
  SPHK_v1: SuratPemutusanHubunganKerjaTemplate,
  SKP_v1: SuratKeputusanTemplate,
  PKS_v1: PerjanjianKerjaSamaTemplate,
  BA_v1: BeritaAcaraTemplate,
  ST_v1: SuratTugasTemplate,
  NDA_v1: PerjanjianKerahasiaanTemplate,
  SPN_v1: SuratPenawaranKerjaSamaTemplate,
  SPK_v1: SuratPerintahKerjaTemplate,
  SPP_v1: SuratPeringatanPembayaranTemplate,
};
