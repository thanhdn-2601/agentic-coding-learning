import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get('NEXT_LOCALE')?.value ?? 'vi';
  const locale = ['vi', 'en'].includes(raw) ? raw : 'vi';

  // Static conditional imports required for Cloudflare Workers compatibility
  // Dynamic template-literal imports (import(`.../${locale}.json`)) are NOT supported
  const messages =
    locale === 'en'
      ? (await import('../../messages/en.json')).default
      : (await import('../../messages/vi.json')).default;

  return { locale, messages };
});
