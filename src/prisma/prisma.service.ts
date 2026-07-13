import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
        const dbUrl = new URL(process.env.DATABASE_URL!);
        const adapter = new PrismaMariaDb({
            host: dbUrl.hostname,
            port: dbUrl.port ? parseInt(dbUrl.port, 10) : 3306,
            user: dbUrl.username,
            password: decodeURIComponent(dbUrl.password),
            database: dbUrl.pathname.replace(/^\//, ''),
            connectionLimit: 5,
        });
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
    }
}