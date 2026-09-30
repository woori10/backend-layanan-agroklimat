import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

const dbUrl = new URL(process.env.DATABASE_URL!);
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
    const users = await prisma.user.findMany({
        where: { role: { not: 'publik' } },
    });

    console.log(`Menemukan ${users.length} akun pegawai.`);

    const initialPasswords: Record<string, string> = {
        super_admin: 'SuperAdmin123',
        admin_jeon_wonwoo: 'Admin482',
        pegawai_tim_kerja_layan: 'Pegawai473',
        pegawai_koordinator_lab: 'Pegawai294',
        pegawai_tim_teknis_agro: 'Pegawai612',
        pegawai_tim_siap_tanam: 'Pegawai581',
        kepala_balai: 'KepalaBalai319',
        admin_verifikasi: 'Admin729',
    };

    for (const u of users) {
        const username = u.username || u.nama;
        const initialPass = initialPasswords[username] || (u.role === 'admin' ? 'Admin821' : u.role === 'kepala_balai' ? 'KepalaBalai821' : 'Pegawai821');
        const hashedPassword = await bcrypt.hash(initialPass, 10);

        await prisma.user.update({
            where: { id: u.id },
            data: {
                initial_password: initialPass,
                password: hashedPassword,
            },
        });

        console.log(`User [${u.id}] ${username} -> initial_password: ${initialPass}`);
    }

    console.log('Semua initial password berhasil diset!');
}

main().finally(() => prisma.$disconnect());
