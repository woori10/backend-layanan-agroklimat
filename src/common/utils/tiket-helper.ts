export function generateNomorTiket(urutan: number): string {
    const tahun = new Date().getFullYear();
    const nomorUrut = String(urutan).padStart(5, '0');
    return `TIK-${tahun}-${nomorUrut}`;
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