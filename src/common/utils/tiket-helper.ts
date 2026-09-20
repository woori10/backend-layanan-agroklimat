const SLUG_TO_CODE: Record<string, string> = {
    'magang-pkl': 'MAGANG',
    'peminjaman-alat': 'ALAT',
    'permohonan-data': 'DATA',
    'rekomendasi-siap-tanam': 'KATAM',
    'rekomendasi-sni': 'SNI',
    'konsultasi-rekomendasi': 'KONSULTASI',
    'bimbingan-teknis': 'BIMTEK',
    'layanan-perpustakaan': 'PERPUS',
    'agroedukasi': 'AGROEDUKASI',
    'layanan-mess': 'MESS',
};

export function getKodeLayanan(slugOrName?: string): string {
    if (!slugOrName) return 'GEN';
    const s = slugOrName.toLowerCase();
    if (SLUG_TO_CODE[s]) return SLUG_TO_CODE[s];

    if (s.includes('magang') || s.includes('pkl')) return 'MAGANG';
    if (s.includes('alat')) return 'ALAT';
    if (s.includes('data')) return 'DATA';
    if (s.includes('tanam') || s.includes('katam')) return 'KATAM';
    if (s.includes('sni')) return 'SNI';
    if (s.includes('konsultasi')) return 'KONSULTASI';
    if (s.includes('bimtek') || s.includes('bimbingan')) return 'BIMTEK';
    if (s.includes('perpus') || s.includes('pustaka')) return 'PERPUS';
    if (s.includes('edukasi')) return 'AGROEDUKASI';
    if (s.includes('mess') || s.includes('wisma')) return 'MESS';

    return s.replace(/[^a-z0-9]/g, '').slice(0, 6).toUpperCase() || 'GEN';
}

export function generateNomorTiket(userId: number, urutan: number, slugOrName?: string): string {
    const tahun = new Date().getFullYear();
    const kode = getKodeLayanan(slugOrName);
    const nomorUrut = String(urutan).padStart(4, '0');
    return `TIK-${kode}-${tahun}-${userId}-${nomorUrut}`;
}

export function hitungTanggalSla(tanggalMulai: Date, slaHari: number): Date {
    let hasil = new Date(tanggalMulai);
    let hariDitambahkan = 0;

    while (hariDitambahkan < slaHari) {
        hasil.setDate(hasil.getDate() + 1);
        const hariDalamMinggu = hasil.getDay(); // 0 = Minggu, 6 = Sabtu
        if (hariDalamMinggu !== 0 && hariDalamMinggu !== 6) {
            hariDitambahkan++;
        }
    }

    return hasil;
}