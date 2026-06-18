import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma"; // Импортируем твой настроенный клиент из lib/prisma.ts

export const auth = betterAuth({
    // Подключаем Prisma адаптер
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    // Включаем вход по email и паролю
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,

    },
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
});