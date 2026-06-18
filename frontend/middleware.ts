import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Пропускаем все пути api (для better-auth и др.), _next (статика) и файлы (с точкой)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
