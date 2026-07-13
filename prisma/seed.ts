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
    // 2. Seed akun super admin
    const existingSuperAdmin = await prisma.user.findUnique({
        where: { email: 'superadmin@agroklimat.go.id' },
    });

    if (!existingSuperAdmin) {
        const hashedPassword = await bcrypt.hash('GantiPasswordIni123!', 10);

        await prisma.user.create({
            data: {
                email: 'superadmin@agroklimat.go.id',
                password: hashedPassword,
                nama: 'Super Admin',
                no_hp: '000000000000',
                role: 'super_admin',
                must_change_password: false,
            },
        });

        console.log('Super admin berhasil dibuat');
    } else {
        console.log('Super admin sudah ada, dilewati');
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