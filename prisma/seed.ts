import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { KategoriSurat, Role } from "../src/generated/prisma/enums";
import type { FieldDef } from "../src/lib/forms/formSchema";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// 4 divisi nyata dari "Rekap Seluruh Data Personalia" + 5 divisi tambahan
// dari draft PRD awal (belum ada karyawan terdaftar di situ, tapi tetap
// disediakan atas permintaan user untuk dipakai ke depannya).
const DIVISI = [
  { kode: "HRD", nama: "Human Resource" },
  { kode: "MKT", nama: "Marketing & Sales" },
  { kode: "CRE", nama: "Creative" },
  { kode: "DGM", nama: "Digital Marketing" },
  { kode: "FIN", nama: "Finance" },
  { kode: "PRO", nama: "Product" },
  { kode: "MED", nama: "Media" },
  { kode: "ACC", nama: "Accounting" },
  { kode: "STR", nama: "Strategy" },
];
// Kode divisi yang dibersihkan otomatis di main() kalau tidak ada data
// (karyawan/log surat/dsb) yang mereferensikannya. Kosong untuk sekarang -
// FIN/PRO/MED/ACC/STR sengaja dipertahankan meski belum dipakai.
const STALE_DIVISI_KODE: string[] = [];

const JENIS_SURAT: { kode: string; nama: string; kategori: KategoriSurat; isActive?: boolean }[] = [
  { kode: "OL", nama: "Offering Letter", kategori: KategoriSurat.KOMERSIAL },
  { kode: "SKK", nama: "Kontrak Kerja", kategori: KategoriSurat.INTERNAL },
  { kode: "SRP", nama: "Surat Peringatan", kategori: KategoriSurat.INTERNAL },
  { kode: "SPHK", nama: "Surat Pemutusan Hubungan Kerja", kategori: KategoriSurat.INTERNAL },
  { kode: "SKP", nama: "Surat Keputusan", kategori: KategoriSurat.INTERNAL },
  { kode: "SE", nama: "Surat Edaran", kategori: KategoriSurat.EDARAN },
  { kode: "SK", nama: "Surat Keterangan", kategori: KategoriSurat.INTERNAL },
  { kode: "PKS", nama: "Perjanjian Kerja Sama", kategori: KategoriSurat.KOMERSIAL },
  { kode: "BA", nama: "Berita Acara", kategori: KategoriSurat.KOMERSIAL },
  { kode: "ST", nama: "Surat Tugas", kategori: KategoriSurat.INTERNAL },
  { kode: "NDA", nama: "Perjanjian Kerahasiaan (NDA)", kategori: KategoriSurat.KOMERSIAL },
  { kode: "SPN", nama: "Surat Penawaran Kerja Sama", kategori: KategoriSurat.KOMERSIAL },
  { kode: "SPRK", nama: "Surat Perintah Kerja", kategori: KategoriSurat.KOMERSIAL },
  { kode: "SPP", nama: "Surat Peringatan Pembayaran", kategori: KategoriSurat.KOMERSIAL },
  // "SPK" dan "SU" di bawah ini SENGAJA isActive:false dan tidak punya
  // SuratTemplate aktif - cuma placeholder untuk riwayat historis lama
  // (lihat scripts/import-riwayat-lama.ts), belum ada form/komponen React
  // untuk generate surat baru jenis ini. "SPK" dulu dipakai untuk "Surat
  // Perintah Kerja" (sekarang kode "SPRK" di atas, belum pernah dipakai
  // nyata) - dikembalikan ke makna aslinya di riwayat perusahaan.
  { kode: "SPK", nama: "Surat Pengangkatan Karyawan", kategori: KategoriSurat.INTERNAL, isActive: false },
  { kode: "SU", nama: "Surat Undangan", kategori: KategoriSurat.INTERNAL, isActive: false },
];

// Data karyawan nyata dari "Rekap Seluruh Data Personalia (4).xlsx". nikKtp
// TIDAK tersedia di rekap tsb (bukan data yang dikumpulkan di situ) - diisi
// placeholder "-" sengaja (bukan angka karangan) supaya jelas belum diisi,
// wajib dilengkapi manual oleh Admin/HRD lewat halaman Master Karyawan.
const MASTER_KARYAWAN: {
  idPersonalia: string;
  namaLengkap: string;
  email: string;
  jabatan: string;
  divisiKode: string;
}[] = [
  { idPersonalia: "BDB040324006", namaLengkap: "Afriliza Christine", email: "christineafriliza@gmail.com", jabatan: "Customer Success Manager", divisiKode: "MKT" },
  { idPersonalia: "BDB030122002", namaLengkap: "Agus Prayoga", email: "agusprayoga0987@gmail.com", jabatan: "Editor", divisiKode: "CRE" },
  { idPersonalia: "BDB020125013", namaLengkap: "Anugerah Fikry Mushoffa", email: "angrhfkrym@gmail.com", jabatan: "Chief Operating Officer", divisiKode: "MKT" },
  { idPersonalia: "GRP011025004", namaLengkap: "Arum Via Laksinta", email: "aroemviaa23@gmail.com", jabatan: "HRGA", divisiKode: "HRD" },
  { idPersonalia: "BDB011125027", namaLengkap: "Benny Pratama", email: "benny.pratama72@gmail.com", jabatan: "Editor", divisiKode: "CRE" },
  { idPersonalia: "BDB010426030", namaLengkap: "Cindy Meilany Putri", email: "cindy.meylani.putri@gmail.com", jabatan: "Account Executive", divisiKode: "MKT" },
  { idPersonalia: "BDB05032629", namaLengkap: "Dhika Pramudya", email: "pramudyadhika84@gmail.com", jabatan: "Production", divisiKode: "CRE" },
  { idPersonalia: "BDB010925021", namaLengkap: "Dinar Azhara Septia Maharani Dinab", email: "dinar.azhara12@gmail.com", jabatan: "Account Executive", divisiKode: "MKT" },
  { idPersonalia: "BDB270426031", namaLengkap: "Dinda Aulia Putri", email: "daulia200@gmail.com", jabatan: "Admin/Traffic Manager", divisiKode: "MKT" },
  { idPersonalia: "GRP050525003", namaLengkap: "Dzikri Ramadhan", email: "dzikri1990@gmail.com", jabatan: "Head of Technology & Innovation", divisiKode: "CRE" },
  { idPersonalia: "GRP031218001", namaLengkap: "Ferry Ariessahi Fadillah", email: "ferryariessahifadillah@gmail.com", jabatan: "Chief Finance & Human Resource", divisiKode: "HRD" },
  { idPersonalia: "BDB010524007", namaLengkap: "Muhammad Tuntas H", email: "muhammadtuntas91@gmail.com", jabatan: "Chief Executive Officer", divisiKode: "MKT" },
  { idPersonalia: "BDB080925022", namaLengkap: "Rizky Awaludin", email: "rizkyawaludin.work@gmail.com", jabatan: "Performance Marketing", divisiKode: "DGM" },
  { idPersonalia: "BDB271025026", namaLengkap: "Salman Farisy", email: "salman.farisy34@gmail.com", jabatan: "Account Executive", divisiKode: "MKT" },
  { idPersonalia: "BDB160725018", namaLengkap: "Saskia Tri Rahmayani", email: "saskiarahmayanitri18@gmail.com", jabatan: "Social Media Organic", divisiKode: "DGM" },
  { idPersonalia: "BDB220925023", namaLengkap: "Yudisthira Prana Ananda Putera", email: "pranaputera2003@gmail.com", jabatan: "Editor", divisiKode: "CRE" },
  { idPersonalia: "BDB220626033", namaLengkap: "Zefry Nainggolan", email: "Zefrynainggolanjob@gmail.com", jabatan: "Head of Digital Marketing", divisiKode: "DGM" },
];

// Signatory di-seed dari file tanda tangan asli di public/assets/signatures.
// Jabatan & nama lengkap DIKONFIRMASI dari dokumen surat asli PT. Banana
// Digital Boost (bukan tebakan) untuk 5 dari 6 signatory. "Pak Edi" tidak
// ditemukan di rekap personalia maupun contoh surat manapun - kemungkinan
// sudah tidak aktif; dibiarkan nonaktif (isActive:false) sampai dikonfirmasi.
const STAMP_URL = "/assets/stamps/stempel-banana.png";
const SIGNATORY: {
  nama: string;
  jabatan: string;
  file: string;
  isActive?: boolean;
}[] = [
  { nama: "Afriliza Christine", jabatan: "Customer Success Manager", file: "ttd_afriliza.png" },
  { nama: "Cindy Meilany Putri", jabatan: "Account Executive", file: "ttd_cindy.jpeg" },
  { nama: "Dinar Azhara Septia Maharani Dinab", jabatan: "Account Executive", file: "ttd_dinar.png" },
  { nama: "Ferry Ariessahi Fadillah", jabatan: "Chief Finance & Human Resource", file: "ttd_ferry-Dg74AbXI.png" },
  { nama: "Salman Farisy", jabatan: "Account Executive", file: "ttd_salman.jpeg" },
  { nama: "Pak Edi", jabatan: "Direktur (belum dikonfirmasi)", file: "ttd_pak_edi.png", isActive: false },
];

const SURAT_TEMPLATES: {
  jenisSuratKode: string;
  versi: number;
  namaTemplate: string;
  componentKey: string;
  fields: FieldDef[];
}[] = [
  {
    jenisSuratKode: "OL",
    versi: 1,
    namaTemplate: "Offering Letter - Standar",
    componentKey: "OL_v1",
    fields: [
      { key: "penerimaNamaManual", label: "Nama Calon Karyawan", type: "text", required: true },
      { key: "posisiDitawarkan", label: "Posisi yang Ditawarkan", type: "text", required: true },
      { key: "atasanLangsung", label: "Atasan Langsung", type: "text", required: true },
      { key: "tempatPenempatan", label: "Tempat Penempatan", type: "text", required: true },
      { key: "lamaProbationBulan", label: "Lama Masa Probation (bulan)", type: "currency", required: true },
      { key: "tanggalMulaiProbation", label: "Tanggal Mulai Probation", type: "date", required: true },
      {
        key: "statusSetelahProbation",
        label: "Status Setelah Lulus Probation",
        type: "select",
        required: true,
        options: ["Karyawan Tetap", "Karyawan Kontrak"],
      },
      { key: "gajiPokok", label: "Gaji Pokok (saat probation)", type: "currency", required: true },
      {
        key: "rincianTunjangan",
        label: "Detail Tunjangan Fasilitas (per baris, mis. \"Uang Makan: Rp 1.125.000\")",
        type: "textList",
        required: true,
      },
      { key: "totalTunjangan", label: "Total Tunjangan Fasilitas", type: "currency", required: true },
      { key: "gajiSetelahProbation", label: "Total Gaji Setelah Lulus Probation", type: "currency", required: true },
      {
        key: "batasKonfirmasiHari",
        label: "Batas Konfirmasi (hari kerja setelah surat diterima)",
        type: "currency",
        required: true,
      },
      { key: "signatoryId", label: "Ditandatangani Oleh", type: "signatoryRef", required: true },
    ],
  },
  {
    jenisSuratKode: "SKK",
    versi: 1,
    namaTemplate: "Perjanjian Kerja (Percobaan / PKWT)",
    componentKey: "SKK_v1",
    fields: [
      {
        key: "tipeKontrak",
        label: "Jenis Kontrak",
        type: "select",
        required: true,
        options: ["PERCOBAAN", "PKWT"],
      },
      { key: "penerimaNamaManual", label: "Nama Pekerja", type: "text", required: true },
      { key: "tempatLahirPekerja", label: "Tempat Lahir", type: "text", required: true },
      { key: "tanggalLahirPekerja", label: "Tanggal Lahir", type: "date", required: true },
      { key: "noKtpPekerja", label: "No. KTP", type: "text", required: true },
      { key: "alamatPekerja", label: "Alamat", type: "textarea", required: true },
      { key: "jabatanPekerja", label: "Jabatan", type: "text", required: true },
      { key: "tempatBekerja", label: "Tempat Bekerja", type: "text", required: true },
      { key: "tanggalMulaiKontrak", label: "Tanggal Mulai Kontrak", type: "date", required: true },
      { key: "lamaKontrakBulan", label: "Lama Kontrak (bulan)", type: "currency", required: true },
      { key: "gajiPokok", label: "Gaji Pokok", type: "currency", required: true },
      { key: "tunjangan", label: "Tunjangan-tunjangan", type: "currency", required: true },
      {
        key: "potonganProbationPersen",
        label: "Potongan Selama Probation (%)",
        type: "currency",
        required: false,
        showIf: { key: "tipeKontrak", value: "PERCOBAAN" },
      },
      { key: "signatoryId", label: "Ditandatangani Oleh", type: "signatoryRef", required: true },
    ],
  },
  {
    jenisSuratKode: "SRP",
    versi: 1,
    namaTemplate: "Surat Peringatan - Standar",
    componentKey: "SRP_v1",
    fields: [
      { key: "penerimaKaryawanId", label: "Karyawan", type: "employeeRef", required: true },
      {
        key: "tingkatPeringatan",
        label: "Tingkat Peringatan",
        type: "select",
        required: true,
        options: ["I", "II", "III"],
      },
      {
        key: "alasanPeringatan",
        label: "Latar Belakang Pelanggaran (per poin, sertakan tanggal kejadian bila relevan)",
        type: "textList",
        required: true,
      },
      { key: "maksudTujuan", label: "Maksud dan Tujuan", type: "textarea", required: true },
      {
        key: "konsekuensiFinansial",
        label: "Konsekuensi Finansial & Fasilitas (opsional, per poin)",
        type: "textList",
        required: false,
      },
      { key: "signatoryId", label: "Ditandatangani Oleh", type: "signatoryRef", required: true },
    ],
  },
  {
    jenisSuratKode: "SK",
    versi: 1,
    namaTemplate: "Surat Keterangan - Standar",
    componentKey: "SK_v1",
    fields: [
      { key: "penerimaKaryawanId", label: "Karyawan", type: "employeeRef", required: true },
      { key: "keperluan", label: "Keperluan", type: "textarea", required: true },
      { key: "masaBerlakuBulan", label: "Masa Berlaku (bulan)", type: "currency", required: true },
      { key: "signatoryId", label: "Ditandatangani Oleh", type: "signatoryRef", required: true },
    ],
  },
  {
    jenisSuratKode: "SE",
    versi: 1,
    namaTemplate: "Surat Edaran - Standar",
    componentKey: "SE_v1",
    fields: [
      // SE bersifat broadcast/sirkular, tidak ke satu karyawan/klien
      // spesifik - jadi cukup field teks bebas, bukan employeeRef/clientRef.
      { key: "penerimaNamaManual", label: "Kepada (mis. Seluruh Karyawan)", type: "text", required: true },
      { key: "perihal", label: "Perihal", type: "text", required: true },
      { key: "isiEdaran", label: "Isi Edaran", type: "textarea", required: true },
      { key: "signatoryId", label: "Ditandatangani Oleh", type: "signatoryRef", required: true },
    ],
  },
  {
    jenisSuratKode: "SPHK",
    versi: 1,
    namaTemplate: "Surat Pemutusan Hubungan Kerja - Standar",
    componentKey: "SPHK_v1",
    fields: [
      { key: "penerimaKaryawanId", label: "Karyawan", type: "employeeRef", required: true },
      { key: "dasarHukum", label: "Dasar Hukum & Pertimbangan", type: "textarea", required: true },
      { key: "alasanPHK", label: "Alasan Pemutusan Hubungan Kerja", type: "textarea", required: true },
      { key: "tanggalEfektifPHK", label: "Tanggal Efektif PHK", type: "date", required: true },
      {
        key: "hakKompensasi",
        label: "Hak Kompensasi (per poin, mis. \"Uang Pesangon: Rp 5.000.000\")",
        type: "textList",
        required: false,
      },
      {
        key: "kewajibanSerahTerima",
        label: "Kewajiban Serah Terima (opsional, per poin)",
        type: "textList",
        required: false,
      },
      { key: "signatoryId", label: "Ditandatangani Oleh", type: "signatoryRef", required: true },
    ],
  },
  {
    jenisSuratKode: "SKP",
    versi: 1,
    namaTemplate: "Surat Keputusan - Standar",
    componentKey: "SKP_v1",
    fields: [
      { key: "perihalKeputusan", label: "Perihal Keputusan (mis. \"Kenaikan Gaji Karyawan\")", type: "text", required: true },
      { key: "penerimaKaryawanId", label: "Karyawan", type: "employeeRef", required: true },
      { key: "menimbang", label: "Menimbang (per poin)", type: "textList", required: true },
      { key: "mengingat", label: "Mengingat (per poin, mis. dasar hukum/peraturan)", type: "textList", required: true },
      {
        key: "diktumKeputusan",
        label: "Isi Keputusan (per poin, akan diberi label PERTAMA/KEDUA/dst otomatis)",
        type: "textList",
        required: true,
      },
      { key: "tanggalEfektif", label: "Tanggal Efektif", type: "date", required: true },
      { key: "signatoryId", label: "Ditandatangani Oleh", type: "signatoryRef", required: true },
    ],
  },
  {
    jenisSuratKode: "PKS",
    versi: 1,
    namaTemplate: "Perjanjian Kerja Sama - Standar",
    componentKey: "PKS_v1",
    fields: [
      { key: "penerimaNamaManual", label: "Nama Kontak Pihak Kedua", type: "text", required: true },
      { key: "namaPerusahaanKedua", label: "Nama Perusahaan/Pihak Kedua", type: "text", required: true },
      { key: "alamatPerusahaanKedua", label: "Alamat Pihak Kedua", type: "textarea", required: true },
      { key: "diwakiliJabatanKedua", label: "Jabatan Wakil Pihak Kedua", type: "text", required: true },
      { key: "ruangLingkupKerjaSama", label: "Ruang Lingkup Kerja Sama", type: "textarea", required: true },
      {
        key: "ketentuanApproval",
        label: "Ketentuan Approval/Persetujuan (opsional, mis. siapa yang berwenang approve, batas waktu approval, approval untuk apa saja)",
        type: "textarea",
        required: false,
      },
      { key: "tanggalMulaiKerjaSama", label: "Tanggal Mulai Kerja Sama", type: "date", required: true },
      { key: "jangkaWaktuBulan", label: "Jangka Waktu (bulan)", type: "currency", required: true },
      { key: "nilaiKerjaSama", label: "Nilai Kerja Sama (opsional)", type: "currency", required: false },
      {
        key: "hakKewajibanPihakPertama",
        label: "Hak & Kewajiban Pihak Pertama (per poin)",
        type: "textList",
        required: false,
      },
      {
        key: "hakKewajibanPihakKedua",
        label: "Hak & Kewajiban Pihak Kedua (per poin)",
        type: "textList",
        required: false,
      },
      {
        key: "pasalTambahan",
        label: "Pasal Tambahan (opsional - ketentuan khusus sesuai jenis layanan)",
        type: "pasalList",
        required: false,
      },
      { key: "signatoryId", label: "Ditandatangani Oleh", type: "signatoryRef", required: true },
    ],
  },
  {
    jenisSuratKode: "BA",
    versi: 1,
    namaTemplate: "Berita Acara - Standar",
    componentKey: "BA_v1",
    fields: [
      { key: "perihalKegiatan", label: "Perihal Kegiatan (mis. \"Serah Terima Pekerjaan\")", type: "text", required: true },
      { key: "tanggalKegiatan", label: "Tanggal Kegiatan", type: "date", required: true },
      { key: "tempatKegiatan", label: "Tempat Kegiatan", type: "text", required: true },
      { key: "penerimaNamaManual", label: "Nama Pihak Kedua", type: "text", required: true },
      { key: "namaJabatanPihakKedua", label: "Jabatan/Keterangan Pihak Kedua (opsional)", type: "text", required: false },
      { key: "uraianKegiatan", label: "Uraian Kegiatan", type: "textarea", required: true },
      { key: "hasilKesimpulan", label: "Hasil & Kesimpulan (per poin)", type: "textList", required: false },
      { key: "signatoryId", label: "Ditandatangani Oleh", type: "signatoryRef", required: true },
    ],
  },
  {
    jenisSuratKode: "ST",
    versi: 1,
    namaTemplate: "Surat Tugas - Standar",
    componentKey: "ST_v1",
    fields: [
      { key: "penerimaKaryawanId", label: "Karyawan", type: "employeeRef", required: true },
      { key: "tugasYangDiberikan", label: "Tugas yang Diberikan", type: "textarea", required: true },
      { key: "tempatTugas", label: "Tempat Tugas", type: "text", required: true },
      { key: "tanggalMulaiTugas", label: "Tanggal Mulai Tugas", type: "date", required: true },
      { key: "tanggalSelesaiTugas", label: "Tanggal Selesai Tugas", type: "date", required: true },
      { key: "catatanTambahan", label: "Catatan Tambahan (opsional)", type: "textarea", required: false },
      { key: "signatoryId", label: "Ditandatangani Oleh", type: "signatoryRef", required: true },
    ],
  },
  {
    jenisSuratKode: "NDA",
    versi: 1,
    namaTemplate: "Perjanjian Kerahasiaan (NDA) - Standar",
    componentKey: "NDA_v1",
    fields: [
      { key: "penerimaNamaManual", label: "Nama Kontak Pihak Kedua", type: "text", required: true },
      { key: "namaPerusahaanKedua", label: "Nama Perusahaan/Pihak Kedua", type: "text", required: true },
      { key: "alamatPerusahaanKedua", label: "Alamat Pihak Kedua", type: "textarea", required: true },
      { key: "diwakiliJabatanKedua", label: "Jabatan Wakil Pihak Kedua", type: "text", required: true },
      {
        key: "tujuanPengungkapanInformasi",
        label: "Tujuan Pengungkapan Informasi (mis. \"keperluan pengelolaan campaign\")",
        type: "textarea",
        required: true,
      },
      { key: "tanggalMulai", label: "Tanggal Mulai Berlaku", type: "date", required: true },
      { key: "masaBerlakuTahun", label: "Masa Berlaku (tahun)", type: "currency", required: true },
      { key: "signatoryId", label: "Ditandatangani Oleh", type: "signatoryRef", required: true },
    ],
  },
  {
    jenisSuratKode: "SPN",
    versi: 1,
    namaTemplate: "Surat Penawaran Kerja Sama - Standar",
    componentKey: "SPN_v1",
    fields: [
      { key: "penerimaNamaManual", label: "Nama Kontak Calon Klien", type: "text", required: true },
      { key: "namaPerusahaanKlien", label: "Nama Perusahaan Calon Klien", type: "text", required: true },
      { key: "perihalPenawaran", label: "Perihal Penawaran (mis. \"Paket Digital Marketing - Growth\")", type: "text", required: true },
      { key: "ruangLingkupLayanan", label: "Ruang Lingkup Layanan (per poin)", type: "textList", required: true },
      {
        key: "rincianHarga",
        label: "Rincian Harga (per baris, mis. \"Social Media Management: Rp 5.000.000/bulan\")",
        type: "textList",
        required: true,
      },
      { key: "totalPenawaran", label: "Total Penawaran", type: "currency", required: true },
      { key: "jangkaWaktuKerjaSama", label: "Jangka Waktu Kerja Sama (mis. \"3 bulan\")", type: "text", required: true },
      { key: "masaBerlakuPenawaranHari", label: "Masa Berlaku Penawaran (hari kerja)", type: "currency", required: true },
      { key: "signatoryId", label: "Ditandatangani Oleh", type: "signatoryRef", required: true },
    ],
  },
  {
    jenisSuratKode: "SPRK",
    versi: 1,
    namaTemplate: "Surat Perintah Kerja - Standar",
    componentKey: "SPRK_v1",
    fields: [
      { key: "penerimaNamaManual", label: "Nama PIC Klien", type: "text", required: true },
      { key: "namaKlien", label: "Nama Klien/Perusahaan", type: "text", required: true },
      { key: "namaProyek", label: "Nama Proyek/Campaign", type: "text", required: true },
      { key: "lingkupPekerjaan", label: "Lingkup Pekerjaan", type: "textarea", required: true },
      { key: "deliverables", label: "Deliverables (per poin)", type: "textList", required: true },
      { key: "tanggalMulaiProyek", label: "Tanggal Mulai Proyek", type: "date", required: true },
      { key: "tanggalSelesaiProyek", label: "Tanggal Selesai Proyek", type: "date", required: true },
      { key: "nilaiKontrak", label: "Nilai Kontrak (opsional)", type: "currency", required: false },
      { key: "signatoryId", label: "Ditandatangani Oleh", type: "signatoryRef", required: true },
    ],
  },
  {
    jenisSuratKode: "SPP",
    versi: 1,
    namaTemplate: "Surat Peringatan Pembayaran - Standar",
    componentKey: "SPP_v1",
    fields: [
      { key: "penerimaNamaManual", label: "Nama PIC Klien", type: "text", required: true },
      { key: "namaKlien", label: "Nama Klien/Perusahaan", type: "text", required: true },
      { key: "nomorInvoice", label: "Nomor Invoice", type: "text", required: true },
      { key: "tanggalJatuhTempo", label: "Tanggal Jatuh Tempo", type: "date", required: true },
      { key: "jumlahTagihan", label: "Jumlah Tagihan", type: "currency", required: true },
      { key: "jumlahHariKeterlambatan", label: "Jumlah Hari Keterlambatan", type: "currency", required: true },
      { key: "batasWaktuPembayaranBaru", label: "Batas Waktu Pembayaran Baru", type: "date", required: true },
      { key: "signatoryId", label: "Ditandatangani Oleh", type: "signatoryRef", required: true },
    ],
  },
];

async function main() {
  for (const d of DIVISI) {
    await prisma.divisi.upsert({
      where: { kode: d.kode },
      update: { nama: d.nama },
      create: d,
    });
  }

  // Bersihkan divisi lama (fiktif) yang sudah tidak dipakai - hanya kalau
  // benar-benar tidak direferensikan data lain (aman untuk data test/dev).
  const staleDivisi = await prisma.divisi.findMany({ where: { kode: { in: STALE_DIVISI_KODE } } });
  for (const d of staleDivisi) {
    const usageCount =
      (await prisma.masterKaryawan.count({ where: { divisiId: d.id } })) +
      (await prisma.logSurat.count({ where: { divisiId: d.id } })) +
      (await prisma.user.count({ where: { divisiId: d.id } })) +
      (await prisma.counterSurat.count({ where: { divisiId: d.id } }));
    if (usageCount === 0) {
      await prisma.divisi.delete({ where: { id: d.id } });
    } else {
      console.warn(`Divisi ${d.kode} tidak dihapus - masih direferensikan ${usageCount} row.`);
    }
  }

  for (const j of JENIS_SURAT) {
    await prisma.jenisSurat.upsert({
      where: { kode: j.kode },
      update: { nama: j.nama, kategori: j.kategori, isActive: j.isActive ?? true },
      create: j,
    });
  }

  for (const t of SURAT_TEMPLATES) {
    const jenis = await prisma.jenisSurat.findUniqueOrThrow({ where: { kode: t.jenisSuratKode } });
    await prisma.suratTemplate.upsert({
      where: { jenisSuratId_versi: { jenisSuratId: jenis.id, versi: t.versi } },
      update: {
        namaTemplate: t.namaTemplate,
        componentKey: t.componentKey,
        formSchemaJson: { fields: t.fields },
      },
      create: {
        jenisSuratId: jenis.id,
        versi: t.versi,
        namaTemplate: t.namaTemplate,
        componentKey: t.componentKey,
        formSchemaJson: { fields: t.fields },
      },
    });
  }

  // Nama-nama lama (mis. "Ferry", "Cindy") dari seed sebelum data personalia
  // asli tersedia - rename dulu SEBELUM upsert utama di bawah, supaya upsert
  // menemukan row yang sudah di-rename (findFirst by nama baru) dan meng-UPDATE
  // di tempat, bukan malah membuat row duplikat baru dengan nama yang sama.
  const RENAME_MAP: Record<string, string> = {
    Afriliza: "Afriliza Christine",
    Cindy: "Cindy Meilany Putri",
    Dinar: "Dinar Azhara Septia Maharani Dinab",
    Ferry: "Ferry Ariessahi Fadillah",
    Salman: "Salman Farisy",
  };
  for (const [oldNama, newNama] of Object.entries(RENAME_MAP)) {
    const dupe = await prisma.signatory.findFirst({ where: { nama: newNama } });
    if (dupe) {
      // Row dengan nama baru sudah ada dari run sebelumnya - hapus row lama
      // (nama pendek) supaya tidak ada duplikat, biarkan yang baru di-upsert normal.
      await prisma.signatory.deleteMany({ where: { nama: oldNama } });
    } else {
      await prisma.signatory.updateMany({ where: { nama: oldNama }, data: { nama: newNama } });
    }
  }

  for (const s of SIGNATORY) {
    const existing = await prisma.signatory.findFirst({ where: { nama: s.nama } });
    const data = {
      nama: s.nama,
      jabatan: s.jabatan,
      signatureImageUrl: `/assets/signatures/${s.file}`,
      stampImageUrl: STAMP_URL,
      isActive: s.isActive ?? true,
    };
    if (existing) {
      await prisma.signatory.update({ where: { id: existing.id }, data });
    } else {
      await prisma.signatory.create({ data });
    }
  }

  // Data karyawan nyata - upsert by idPersonalia supaya bisa dijalankan ulang
  // dengan aman. nikKtp diisi "-" (placeholder eksplisit, BUKAN angka
  // karangan) karena rekap personalia tidak menyertakan NIK KTP.
  for (const k of MASTER_KARYAWAN) {
    const divisi = await prisma.divisi.findUniqueOrThrow({ where: { kode: k.divisiKode } });
    const existing = await prisma.masterKaryawan.findFirst({ where: { idPersonalia: k.idPersonalia } });
    const data = {
      namaLengkap: k.namaLengkap,
      idPersonalia: k.idPersonalia,
      jabatan: k.jabatan,
      email: k.email,
      divisiId: divisi.id,
      nikKtp: "-",
    };
    if (existing) {
      await prisma.masterKaryawan.update({ where: { id: existing.id }, data });
    } else {
      await prisma.masterKaryawan.create({ data });
    }
  }

  // Bersihkan karyawan contoh/test lama (dibuat manual sebelum data personalia
  // asli tersedia) yang tidak sesuai satupun nama di data personalia asli.
  const realNames = new Set(MASTER_KARYAWAN.map((k) => k.namaLengkap));
  const testKaryawan = await prisma.masterKaryawan.findMany({ where: { idPersonalia: null } });
  for (const k of testKaryawan) {
    if (!realNames.has(k.namaLengkap)) {
      const refCount = await prisma.logSurat.count({ where: { penerimaKaryawanId: k.id } });
      if (refCount === 0) {
        await prisma.masterKaryawan.delete({ where: { id: k.id } });
      } else {
        // Masih direferensikan LogSurat lama (test data) - jangan dihapus
        // (rusak integritas riwayat), cukup nonaktifkan supaya tidak muncul
        // lagi di dropdown pemilihan karyawan aktif.
        await prisma.masterKaryawan.update({ where: { id: k.id }, data: { isActive: false } });
      }
    }
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@bananadigitalboost.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ubah-password-ini";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      namaLengkap: "Admin BDB DocGen",
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
    },
  });

  console.log("Seed selesai.");
  console.log(`Admin login: ${adminEmail} / ${adminPassword} (GANTI setelah login pertama)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
