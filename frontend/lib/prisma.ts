import { PrismaClient } from './generated/prisma';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Подключаемся к базе используя классический Pool из библиотеки pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Оборачиваем Pool в адаптер Prisma
const adapter = new PrismaPg(pool);

// Передаем адаптер в клиент
export const prisma = new PrismaClient({ adapter });
