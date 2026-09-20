import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in environment variables');
}

const dbUrl = new URL(process.env.DATABASE_URL);
const adapter = new PrismaMariaDb({
    host: dbUrl.hostname,
    port: dbUrl.port ? parseInt(dbUrl.port, 10) : 3306,
    user: dbUrl.username,
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.replace(/^\//, ''),
    connectionLimit: 1,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    await seedUnitTeknis();
    await seedLayanan();
    await seedAlat();
    await seedFaq();

    const existingSuperAdmin = await prisma.user.findUnique({
        where: { email: 'superadmin@agroklimat.go.id' },
    });

    if (!existingSuperAdmin) {
        const hashedPassword = await bcrypt.hash('2005031020050310', 10);

        await prisma.user.create({
            data: {
                email: 'superadmin@agroklimat.go.id',
                nip: '2005031020050310',
                password: hashedPassword,
                nama: 'Super Admin',
                no_hp: '08123456789',
                role: 'super_admin',
            },
        });

        console.log('Super admin berhasil dibuat');
    } else {
        const hashedPassword = await bcrypt.hash('2005031020050310', 10);
        await prisma.user.update({
            where: { email: 'superadmin@agroklimat.go.id' },
            data: {
                nip: '2005031020050310',
                password: hashedPassword,
            },
        });
        console.log('Super admin sudah ada, NIP diperbarui');
    }
}

async function seedUnitTeknis() {
    const unitTeknisList = [
        'Tim Teknis Agroklimat / Hidrologi',
        'Koordinator Laboratorium',
        'Tim Kerja Layanan dan Pendayagunaan Hasil',
        'Tim Siap Tanam',
        'Petugas Mess',
    ];

    for (const nama of unitTeknisList) {
        const existing = await prisma.unitTeknis.findFirst({ where: { nama } });

        if (!existing) {
            await prisma.unitTeknis.create({ data: { nama } });
            console.log(`Unit Teknis "${nama}" berhasil dibuat`);
        } else {
            console.log(`Unit Teknis "${nama}" sudah ada, dilewati`);
        }
    }
}

async function seedLayanan() {
    const layananList = [
        {
            nama_layanan: 'Rekomendasi Kalender Tanam',
            slug: 'rekomendasi-siap-tanam',
            biaya: { tipe: 'gratis' },
            sla_hari: 5,
            form_schema: {},
            unit_teknis_id: 4, // Tim Siap Tanam
        },
        {
            nama_layanan: 'Rekomendasi & Penilaian Kesesuaian Agroklimat/Hidrologi (SNI)',
            slug: 'rekomendasi-sni',
            biaya: { tipe: 'gratis' },
            sla_hari: 5,
            form_schema: {},
            unit_teknis_id: 1, // Tim Teknis Agroklimat / Hidrologi
        },
        {
            nama_layanan: 'Permohonan Data',
            slug: 'permohonan-data',
            biaya: { tipe: 'gratis' },
            sla_hari: 5,
            form_schema: {},
            unit_teknis_id: 1, // Tim Teknis Agroklimat / Hidrologi
        },
        {
            nama_layanan: 'Peminjaman Alat',
            slug: 'peminjaman-alat',
            biaya: { tipe: 'tetap', catatan: 'Tarif PNBP, nominal menyusul' },
            sla_hari: 5,
            form_schema: {},
            unit_teknis_id: 2, // Koordinator Laboratorium
        },
        {
            nama_layanan: 'Konsultasi Rekomendasi & Penilaian Kesesuaian',
            slug: 'konsultasi-rekomendasi',
            biaya: { tipe: 'gratis' },
            sla_hari: 5,
            form_schema: {},
            unit_teknis_id: 1, // Tim Teknis Agroklimat / Hidrologi
        },
        {
            nama_layanan: 'Bimbingan Teknis & Narasumber',
            slug: 'bimbingan-teknis',
            biaya: { tipe: 'gratis' },
            sla_hari: null,
            form_schema: {},
            unit_teknis_id: 3, // Tim Kerja Layanan dan Pendayagunaan Hasil
        },
        {
            nama_layanan: 'Magang Teknis / PKL',
            slug: 'magang-pkl',
            biaya: { tipe: 'gratis' },
            sla_hari: null,
            form_schema: {},
            unit_teknis_id: 3, // Tim Kerja Layanan dan Pendayagunaan Hasil
        },
        {
            nama_layanan: 'Layanan Perpustakaan',
            slug: 'layanan-perpustakaan',
            biaya: { tipe: 'gratis' },
            sla_hari: null,
            form_schema: {},
            unit_teknis_id: 3, // Tim Kerja Layanan dan Pendayagunaan Hasil
        },
        {
            nama_layanan: 'Agroedukasi / Kunjungan Edukasi',
            slug: 'agroedukasi',
            biaya: { tipe: 'gratis' },
            sla_hari: 5,
            form_schema: {},
            unit_teknis_id: 3, // Tim Kerja Layanan dan Pendayagunaan Hasil
        },
        {
            nama_layanan: 'Layanan Mess',
            slug: 'layanan-mess',
            biaya: { tipe: 'per_satuan', nominal: 100000, satuan: 'kamar/malam' },
            sla_hari: 1,
            form_schema: {},
            unit_teknis_id: 5, // Petugas Mess
        },
    ];

    for (const layanan of layananList) {
        await prisma.layanan.upsert({
            where: { nama_layanan: layanan.nama_layanan },
            update: { slug: layanan.slug, unit_teknis_id: layanan.unit_teknis_id },
            create: layanan,
        });
        console.log(`Layanan "${layanan.nama_layanan}" siap dengan slug "${layanan.slug}"`);
    }
}

async function seedAlat() {
    const alatList = [
        { nama_alat: "Automatic Weather Station (AWS)", harga_peminjaman: 500000, is_active: true },
        { nama_alat: "Anemometer Digital", harga_peminjaman: 150000, is_active: true },
        { nama_alat: "Barometer Analog", harga_peminjaman: 100000, is_active: false },
        { nama_alat: "Solarimeter (Pyranometer)", harga_peminjaman: 250000, is_active: true },
        { nama_alat: "Ombrometer (Penakar Hujan)", harga_peminjaman: 75000, is_active: true },
    ];

    for (const alat of alatList) {
        const existing = await prisma.alat.findFirst({
            where: { nama_alat: alat.nama_alat },
        });

        if (!existing) {
            await prisma.alat.create({ data: alat });
            console.log(`Alat "${alat.nama_alat}" berhasil dibuat`);
        } else {
            console.log(`Alat "${alat.nama_alat}" sudah ada, dilewati`);
        }
    }
}

async function seedFaq() {
    const faqList = [
        {
            pertanyaan: "Bagaimana cara mengajukan peminjaman alat?",
            jawaban: "Anda dapat mengajukan peminjaman alat dengan mendaftar akun terlebih dahulu, memilih menu Layanan Peminjaman Alat, mengisi formulir pengajuan, dan menunggu verifikasi dari petugas kami.",
            urutan: 1,
            is_active: true,
        },
        {
            pertanyaan: "Apakah layanan konsultasi dikenakan biaya?",
            jawaban: "Layanan konsultasi dasar tidak dikenakan biaya. Namun, untuk konsultasi khusus yang memerlukan pengkajian mendalam atau survei lapangan, biaya akan disesuaikan dengan ketentuan tarif PNBP yang berlaku.",
            urutan: 2,
            is_active: true,
        },
        {
            pertanyaan: "Berapa lama waktu pengolahan data agroklimat?",
            jawaban: "Waktu pengolahan data bervariasi antara 3 hingga 7 hari kerja tergantung pada cakupan wilayah, kompleksitas parameter data, serta kelengkapan dokumen pengajuan Anda.",
            urutan: 3,
            is_active: true,
        },
    ];

    for (const faq of faqList) {
        const existing = await prisma.faq.findFirst({
            where: { pertanyaan: faq.pertanyaan },
        });

        if (!existing) {
            await prisma.faq.create({ data: faq });
            console.log(`FAQ "${faq.pertanyaan.substring(0, 30)}..." berhasil dibuat`);
        } else {
            console.log(`FAQ "${faq.pertanyaan.substring(0, 30)}..." sudah ada, dilewati`);
        }
    }
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });