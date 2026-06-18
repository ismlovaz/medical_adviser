import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Деструктурируем готовые функции GET и POST прямо из объекта
export const { GET, POST } = toNextJsHandler(auth);