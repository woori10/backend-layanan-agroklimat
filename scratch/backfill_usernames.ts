import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
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
        where: {
            role: { not: 'publik' },
            username: null,
        },
        include: { unit_teknis: true },
    });

    console.log(`Ditemukan ${users.length} user internal tanpa username.`);

    for (const u of users) {
        let defaultUsername = '';

        if (u.role === 'kepala_balai') {
            defaultUsername = 'kepala_balai';
        } else if (u.role === 'admin') {
            defaultUsername = `admin_${u.nama.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        } else if (u.role === 'pegawai') {
            const unitPart = u.unit_teknis
                ? u.unit_teknis.nama.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 15)
                : u.nama.toLowerCase().replace(/[^a-z0-9]/g, '_');
            defaultUsername = `pegawai_${unitPart}`;
        } else {
            defaultUsername = u.nama.toLowerCase().replace(/[^a-z0-9]/g, '_');
        }

        // Pastikan tidak duplikat
        let finalUsername = defaultUsername.replace(/^_+|_+$/g, '');
        const exists = await prisma.user.findUnique({ where: { username: finalUsername } });
        if (exists) {
            finalUsername = `${finalUsername}_${u.id}`;
        }

        await prisma.user.update({
            where: { id: u.id },
            data: { username: finalUsername },
        });

        console.log(`User [${u.id}] "${u.nama}" (${u.role}) -> username: "${finalUsername}"`);
    }

    console.log('Selesai update username akun pegawai!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
