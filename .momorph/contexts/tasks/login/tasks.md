# Task Breakdown: Login Screen

**Frame ID**: `662:14387` | **MoMorph Frame ID**: `6381`
**Plan**: `.momorph/contexts/plans/login/plan.md`
**Specs**: `.momorph/contexts/specs/login/spec.md`
**Design**: `.momorph/contexts/specs/login/design-style.md`
**Created**: 2026-03-23

---

## Priority & Sequencing

```
P0 (Blocking) → T01, T02, T03, T04, T05
P1 (Core)     → T06, T07, T08, T09, T10, T11
P2 (Feature)  → T12, T13, T14, T15
P3 (Polish)   → T16, T17, T18, T19
```

**Execution order**: P0 → P1 (T06–T08 parallel with T09–T11) → P2 → P3

---

## P0 — Project Setup (must complete first, sequential)

### T01 · Install `next-intl`

| | |
|---|---|
| **Type** | Dependency |
| **File** | `package.json` |
| **Effort** | XS |
| **Blocks** | T06, T07, T08, T12, T13 |

**Action**:
```bash
yarn add next-intl
```

**Done when**: `next-intl` appears in `package.json` `dependencies`.

---

### T02 · Add `NEXT_PUBLIC_SITE_URL` env var

| | |
|---|---|
| **Type** | Config |
| **Files** | `.env.example`, `.env` |
| **Effort** | XS |
| **Blocks** | T10 (OAuth `redirectTo` uses this) |

**Action**: Add to both files:
```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Done when**: `process.env.NEXT_PUBLIC_SITE_URL` resolves to `http://localhost:3000` locally.

---

### T03 · Update `globals.css` with SAA 2025 design tokens

| | |
|---|---|
| **Type** | Styling |
| **File** | `src/app/globals.css` |
| **Effort** | S |
| **Blocks** | T12, T13, T14, T15 (all UI work depends on tokens being available) |

**Action**: Replace file content (keep `@import "tailwindcss"` at top):

```css
@import "tailwindcss";

:root {
  --Details-Background: #00101A;
  --Details-Container: #101417;
  --Details-Container-2: #00070C;
  --Details-Divider: #2E3940;
  --Details-Border: #998C5F;
  --Details-Error: #B3261E;
  --BG-Update: #1E2D39;
  --Details-Text-Primary-1: #FFEA9E;
  --Details-Text-Primary-2: #00101A;
  --Details-Text-Secondary-1: #FFFFFF;
  --Details-Text-Secondary-2: #999999;
  --Details-TextButton-Normal: rgba(255, 234, 158, 0.10);
  --Details-PrimaryButton-Hover: #FFF8E1;
  --Details-ButtonSecondary-Hover: rgba(255, 234, 158, 0.40);
  --Details-SecondaryButton-Normal: rgba(255, 234, 158, 0.10);
  --Details-Dropdown-List-Hover: rgba(255, 255, 255, 0.08);
  --Details-Dropdown-List-Selected: rgba(255, 234, 158, 0.15);
  --focus-ring: 2px solid #FFEA9E;
  --focus-ring-offset: 2px;
  --page-padding-x: 144px;
  --page-padding-y: 96px;
  --header-height: 80px;
}

@theme inline {
  --color-background: var(--Details-Background);
  --color-foreground: var(--Details-Text-Secondary-1);
  --font-sans: var(--font-montserrat);
  --font-alt: var(--font-montserrat-alt);
}

body {
  background-color: var(--Details-Background);
  color: var(--Details-Text-Secondary-1);
}
```

**Key removals**: Delete `--background`, `--foreground`, `@media (prefers-color-scheme: dark)` block, and Geist font references in `@theme inline`.

**Done when**: CSS vars available in browser DevTools, `@theme inline` references Montserrat vars.

---

### T04 · Update `layout.tsx` — Montserrat + NextIntlClientProvider

| | |
|---|---|
| **Type** | Layout |
| **File** | `src/app/layout.tsx` |
| **Effort** | S |
| **Blocks** | T12, T13, T14 (client components need provider) |
| **Depends on** | T01 (next-intl must be installed), T06 (request.ts must exist for getLocale/getMessages) |

**Action**: Replace file content:

```typescript
import type { Metadata } from 'next';
import { Montserrat, Montserrat_Alternates } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '700'],
  variable: '--font-montserrat',
  display: 'swap',
});

const montserratAlternates = Montserrat_Alternates({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-montserrat-alt',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SAA 2025 — Sun Annual Awards',
  description: 'Sun Annual Awards 2025 — ROOT FURTHER',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${montserrat.variable} ${montserratAlternates.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Done when**: App renders with Montserrat font, `<html lang>` is dynamic, no console errors about missing provider.

---

### T05 · Update `supabase/config.toml` — add callback to redirect allow-list

| | |
|---|---|
| **Type** | Config |
| **File** | `supabase/config.toml` |
| **Effort** | XS |
| **Blocks** | T10 (OAuth redirectTo is rejected without this) |

**Action**: Update `additional_redirect_urls`:
```toml
additional_redirect_urls = [
  "http://localhost:3000",
  "http://localhost:3000/auth/callback",
  "https://127.0.0.1:3000",
  "https://127.0.0.1:3000/auth/callback"
]
```

**Also required for production**: Supabase dashboard → Authentication → URL Configuration → add `${NEXT_PUBLIC_SITE_URL}/auth/callback`.

**Done when**: Local Supabase accepts OAuth redirect to `/auth/callback` without "Invalid redirect URL" error.

---

## P1 — Infrastructure (T06–T08 and T09–T11 can run in parallel)

### T06 · Create `src/i18n/request.ts`

| | |
|---|---|
| **Type** | Config (new file) |
| **File** | `src/i18n/request.ts` |
| **Effort** | S |
| **Depends on** | T01 (next-intl), T07 (vi.json), T08 (en.json) |
| **Blocks** | T04 (layout needs getLocale/getMessages) |

**Action**: Create file:

```typescript
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get('NEXT_LOCALE')?.value ?? 'vi';
  const locale = ['vi', 'en'].includes(raw) ? raw : 'vi';

  // Static conditional imports required for Cloudflare Workers compatibility
  const messages =
    locale === 'en'
      ? (await import('../../messages/en.json')).default
      : (await import('../../messages/vi.json')).default;

  return { locale, messages };
});
```

**Done when**: `getLocale()` and `getMessages()` work in Server Components; switching `NEXT_LOCALE` cookie changes returned locale.

---

### T07 · Create `messages/vi.json`

| | |
|---|---|
| **Type** | Content (new file) |
| **File** | `messages/vi.json` (project root) |
| **Effort** | XS |
| **Blocks** | T06, T12, T13, T14 |

**Action**: Create file:

```json
{
  "login": {
    "hero_line1": "Bắt đầu hành trình của bạn cùng SAA 2025.",
    "hero_line2": "Đăng nhập để khám phá!",
    "button": "LOGIN With Google",
    "loading": "Đang xử lý...",
    "error_oauth_failed": "Đăng nhập thất bại. Vui lòng thử lại.",
    "footer_copyright": "Bản quyền thuộc về Sun* © 2025"
  }
}
```

**Done when**: File exists at project root; `t('login.button')` resolves correctly.

---

### T08 · Create `messages/en.json`

| | |
|---|---|
| **Type** | Content (new file) |
| **File** | `messages/en.json` (project root) |
| **Effort** | XS |
| **Blocks** | T06 |

**Action**: Create file:

```json
{
  "login": {
    "hero_line1": "Begin your journey with SAA 2025.",
    "hero_line2": "Log in to explore!",
    "button": "LOGIN With Google",
    "loading": "Processing...",
    "error_oauth_failed": "Login failed. Please try again.",
    "footer_copyright": "Copyright © Sun* 2025"
  }
}
```

**Done when**: Switching locale to `en` renders English UI strings.

---

### T09 · Update `next.config.ts` — wire `withNextIntl`

| | |
|---|---|
| **Type** | Config |
| **File** | `next.config.ts` |
| **Effort** | XS |
| **Depends on** | T01, T06 |

**Action**: Wrap existing config with `withNextIntl`, **preserve** Cloudflare init:

```typescript
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);

// Enable calling `getCloudflareContext()` in `next dev`.
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();
```

**⚠️ Do NOT remove `initOpenNextCloudflareForDev()`** — required for Cloudflare bindings in `next dev`.

**Done when**: `yarn dev` starts without errors; `getRequestConfig` is invoked on each request.

---

### T10 · Create `src/middleware.ts` — session guard

| | |
|---|---|
| **Type** | Auth (new file) |
| **File** | `src/middleware.ts` |
| **Effort** | M |
| **Depends on** | T02 (env var), T05 (TOML redirect URLs) |
| **Blocks** | T15 (login page needs guard to be meaningful) |

**Action**: Create file:

```typescript
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/middleware';

const PUBLIC_PATHS = ['/login', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  // getUser() validates JWT server-side; getSession() does NOT — security risk
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
  const isAuthenticated = !getUserError && !!user;

  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

**Done when**: Unauthenticated access to `/` redirects to `/login`; authenticated access to `/login` redirects to `/`; `/auth/callback` is reachable without session.

---

### T11 · Create `src/app/auth/callback/route.ts`

| | |
|---|---|
| **Type** | Auth (new file) |
| **File** | `src/app/auth/callback/route.ts` |
| **Effort** | M |
| **Depends on** | T02, T05 |

**Action**: Create file:

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          ),
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  // Sync NEXT_LOCALE cookie → profiles.locale (first login + locale updates)
  const locale = cookieStore.get('NEXT_LOCALE')?.value;
  if (locale && ['vi', 'en'].includes(locale)) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ locale: locale as 'vi' | 'en' })
        .eq('id', user.id);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
```

**Done when**: Google OAuth flow completes end-to-end; `profiles.locale` updated in DB; errors redirect to `/login?error=oauth_failed`.

---

## P2 — UI Components + Page Assembly

### T12 · Create `src/components/auth/LoginButton.tsx`

| | |
|---|---|
| **Type** | Component (new file) |
| **File** | `src/components/auth/LoginButton.tsx` |
| **Effort** | M |
| **Depends on** | T01, T03, T04, T07, T08 |
| **Blocks** | T15 |

**Behaviour**:
- `'use client'`
- On click: `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: \`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback\` })`
- `isLoading` state: `true` while redirecting → disables button, replaces Google icon with spinner
- Uses `createClient()` from `@/libs/supabase/client`

**Visual spec** (from design-style.md):
- Size: `305×60px` desktop, `w-full h-14` mobile
- Background: `#FFEA9E` → hover `#FFF8E1` + `box-shadow: 0 4px 12px rgba(0,0,0,0.3)`
- Active/pressed: `rgba(255,234,158,0.8)` + slight `scale-[0.98]`
- Disabled/loading: `opacity-50 cursor-not-allowed pointer-events-none`
- Label: Montserrat 700, 22px, color `#00101A`
- Google icon: `24×24px` (right of label), replaced by spinner when loading
- Border-radius: `8px`

**Accessibility**:
- `aria-label="Login with Google"`
- `aria-busy={isLoading}`
- `disabled={isLoading}`
- Focus ring: `outline: var(--focus-ring); outline-offset: var(--focus-ring-offset)`

**Done when**: All 5 states render correctly; clicking initiates OAuth redirect; loading state prevents double-click.

---

### T13 · Create `src/components/auth/LanguageSelector.tsx`

| | |
|---|---|
| **Type** | Component (new file) |
| **File** | `src/components/auth/LanguageSelector.tsx` |
| **Effort** | M |
| **Depends on** | T01, T03, T04, T07, T08 |
| **Blocks** | T15 |

**Behaviour**:
- `'use client'`
- `currentLocale` prop (string) passed from Server Component
- Click trigger → toggle `isOpen` state
- Click outside (`useEffect` + `document.addEventListener('mousedown', ...)`) → close dropdown, return focus to trigger via `triggerRef.current?.focus()`
- `Escape` key → close dropdown, return focus to trigger
- Select locale: set cookie + `router.refresh()`

```typescript
// Cookie write pattern
document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
router.refresh();
```

**Visual spec** (from design-style.md):
- Trigger: `108×56px`, `border-radius: 4px`, bg `rgba(255,234,158,0.10)`
  - Hover: `rgba(255,234,158,0.20)` | Active/open: `rgba(255,234,158,0.30)`
- Flag icon: `20×15px` | Label "VN"/"EN": Montserrat 700, 16px | Chevron: `24×24px` (rotates 180° when open)
- Dropdown panel: `110×112px`, bg `#101417`, border `1px solid #2E3940`, `border-radius: 8px`
  - Position: absolute, top 100% of trigger, right-aligned, `z-index: 50`
- Each item: `110×56px`
  - Default: transparent bg, white text
  - Hover: `rgba(255,255,255,0.08)` bg
  - Selected (current locale): `rgba(255,234,158,0.15)` bg, `#FFEA9E` text

**Accessibility**:
- Trigger: `aria-haspopup="listbox"`, `aria-expanded={isOpen}`, `aria-label="Select language"`
- Dropdown: `role="listbox"`
- Items: `role="option"`, `aria-selected={locale === currentLocale}`

**Assets**: `public/assets/auth/icons/flag-vn.svg`, `flag-en.svg`, `chevron-down.svg`

**Done when**: Dropdown opens/closes; locale switches on click; Escape + click-outside close; selected state visible; `router.refresh()` re-renders page in new locale.

---

### T14 · Create `src/components/auth/ErrorToast.tsx`

| | |
|---|---|
| **Type** | Component (new file) |
| **File** | `src/components/auth/ErrorToast.tsx` |
| **Effort** | S |
| **Depends on** | T01, T03, T04, T07, T08 |
| **Blocks** | T15 |

**Behaviour**:
- `'use client'`
- `useSearchParams()` — reads `?error` param
- If `error === 'oauth_failed'`: show toast with `t('login.error_oauth_failed')`
- Auto-dismiss after 5 seconds (`useEffect` with `setTimeout`)
- On dismiss: `router.replace(pathname)` to clean `?error` from URL
- Manual dismiss: ✕ button

**Visual spec**:
- Position: fixed, top-4, left-1/2 translate-x-[-50%], `z-[200]`
- Background: `var(--Details-Error)` (`#B3261E`)
- Text: white, Montserrat 700
- Min-width: `320px`, padding: `12px 16px`
- Border-radius: `8px`
- Dismiss button: `×` character, right side

**Done when**: Navigate to `/login?error=oauth_failed` → toast renders; auto-dismisses at 5s; URL cleaned after dismiss.

---

### T15 · Create `src/app/(auth)/login/page.tsx`

| | |
|---|---|
| **Type** | Page (new file) |
| **File** | `src/app/(auth)/login/page.tsx` |
| **Effort** | L |
| **Depends on** | T03, T04, T10, T11, T12, T13, T14, T16 (assets needed) |

**Structure**:

```typescript
import { createClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Suspense } from 'react';
import { LoginButton } from '@/components/auth/LoginButton';
import { LanguageSelector } from '@/components/auth/LanguageSelector';
import { ErrorToast } from '@/components/auth/ErrorToast';

export default async function LoginPage() {
  // Belt-and-suspenders: middleware already redirects, but double-check here
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/');

  const t = await getTranslations('login');
  // currentLocale for LanguageSelector initial state
  // (read from cookie server-side via getLocale())

  return ( /* full layout per Figma */ );
}
```

**Layer composition** (Figma order, bottom to top):
1. `C_Keyvisual` — `<Image>` fill, absolute, `z-0`, `alt=""`
2. `Rectangle 57` — `<div>` absolute, left-fade gradient overlay, `z-10`
3. `A_Header` — fixed, `z-[100]`, `h-20`, blur bg
   - Left: Logo image `52×48px`
   - Right: `<LanguageSelector currentLocale={locale} />`
4. `B_Bìa` — relative, `top-[88px]`, flex-col, left-aligned
   - `B.1`: ROOT FURTHER `<Image>` `451×200px`
   - `B.2`: `<p>` text (from `t('hero_line1')` + `t('hero_line2')`)
   - `B.3`: `<LoginButton />`
5. `Cover` — absolute bottom gradient, `z-10`
6. `D_Footer` — absolute bottom-0, `border-t border-[#2E3940]`
   - Copyright `t('footer_copyright')`
   - `<Suspense fallback={null}><ErrorToast /></Suspense>`

**Responsive Tailwind classes**:

| Zone | Mobile (default) | Tablet (`md:`) | Desktop (`lg:`) |
|---|---|---|---|
| Header padding | `px-4` | `px-8` | `px-36` |
| Hero padding | `px-4 pt-20 pb-10` | `px-8 pt-20` | `px-36 pt-24` |
| Hero gap | `gap-10` | — | `gap-[120px]` |
| Login Button | `w-full h-14` | `w-auto min-w-[280px] h-[60px]` | `w-[305px] h-[60px]` |
| Footer padding | `px-4 py-6` | `px-8 py-8` | `px-[90px] py-[40px]` |

**Done when**: Page matches Figma at 375px, 768px, and 1440px; all components render; session check works.

---

### T16 · Download and place Figma assets

| | |
|---|---|
| **Type** | Asset |
| **Effort** | S |
| **Blocks** | T12, T13, T15 |

**Assets to download** via `momorph_downloadFigmaImage`:

| MoMorph ID | Destination | Format |
|---|---|---|
| `MM_MEDIA_Logo` | `public/assets/saa/logos/saa-logo.png` | PNG |
| `MM_MEDIA_Root Further Logo` | `public/assets/login/images/root-further.png` | PNG |
| `MM_MEDIA_Google` | `public/assets/auth/icons/google-icon.svg` | SVG |
| `MM_MEDIA_VN` | `public/assets/auth/icons/flag-vn.svg` | SVG |
| `MM_MEDIA_EN` | `public/assets/auth/icons/flag-en.svg` | SVG |
| `MM_MEDIA_Down` | `public/assets/auth/icons/chevron-down.svg` | SVG |
| Figma node `662:14389` | `public/assets/login/images/hero-bg.jpg` | JPG |

**Convention**: All under `public/assets/{group}/{type}/`, kebab-case filenames (per `constitution.md`).

**Done when**: All 7 assets exist at listed paths; no 404s when referenced in `<Image src=...>`.

---

## P3 — Polish & Hardening

### T17 · Update `src/app/page.tsx` — dashboard placeholder

| | |
|---|---|
| **Type** | Page |
| **File** | `src/app/page.tsx` |
| **Effort** | XS |
| **Depends on** | T10 (middleware must exist first) |

**Action**: Replace boilerplate content:

```typescript
import { createClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--Details-Background)' }}
    >
      <p className="text-white font-sans">Dashboard — coming soon</p>
    </main>
  );
}
```

**Done when**: Authenticated user lands on `/` and sees placeholder; unauthenticated user is redirected to `/login`.

---

### T18 · Accessibility audit

| | |
|---|---|
| **Type** | QA |
| **Effort** | S |
| **Depends on** | T12, T13, T14, T15 |

**Checklist**:
- [ ] `LoginButton`: `aria-label="Login with Google"`, `aria-busy={isLoading}`
- [ ] `LanguageSelector` trigger: `aria-haspopup="listbox"`, `aria-expanded={isOpen}`, `aria-label="Select language"`
- [ ] Dropdown options: `role="option"`, `aria-selected` reflects current locale
- [ ] All interactive elements: `outline: var(--focus-ring); outline-offset: var(--focus-ring-offset)` on `:focus-visible`
- [ ] Color contrast `#FFEA9E` on `#00101A`: 10.7:1 ✅ WCAG AAA
- [ ] Background images have `alt=""` (decorative); logo has descriptive alt
- [ ] Tab order: Logo → Language Selector → Login Button (no tab traps)

---

### T19 · Cloudflare + responsive smoke test

| | |
|---|---|
| **Type** | QA |
| **Effort** | S |
| **Depends on** | T15, T16, T17 |

**Cloudflare checklist**:
- [ ] No `fs`, `path`, `os`, or Node.js built-ins imported (breaks Workers runtime)
- [ ] All JSON imports are static (no template-literal dynamic `import()`)
- [ ] All env vars via `process.env.*` only
- [ ] Run `yarn build` → zero errors
- [ ] Run `npx wrangler dev` → app boots on Cloudflare runtime

**Responsive checklist** (test in browser DevTools):

| Breakpoint | Check |
|---|---|
| 375px | Button `w-full`, hero text 16px, header `px-4`, footer `padding: 24px 16px` |
| 768px | Button `min-w-[280px]`, hero `px-8` |
| 1440px | Button `305×60px`, header `px-36`, footer `px-[90px] py-[40px]` — exact Figma match |

---

## Summary

| ID | Task | Priority | Effort | Status |
|---|---|---|---|---|
| T01 | Install `next-intl` | P0 | XS | ⬜ |
| T02 | Add `NEXT_PUBLIC_SITE_URL` env var | P0 | XS | ⬜ |
| T03 | Update `globals.css` — design tokens | P0 | S | ⬜ |
| T04 | Update `layout.tsx` — Montserrat + Provider | P0 | S | ⬜ |
| T05 | Update `supabase/config.toml` — redirect URLs | P0 | XS | ⬜ |
| T06 | Create `src/i18n/request.ts` | P1 | S | ⬜ |
| T07 | Create `messages/vi.json` | P1 | XS | ⬜ |
| T08 | Create `messages/en.json` | P1 | XS | ⬜ |
| T09 | Update `next.config.ts` — withNextIntl | P1 | XS | ⬜ |
| T10 | Create `src/middleware.ts` | P1 | M | ⬜ |
| T11 | Create `src/app/auth/callback/route.ts` | P1 | M | ⬜ |
| T12 | Create `LoginButton.tsx` | P2 | M | ⬜ |
| T13 | Create `LanguageSelector.tsx` | P2 | M | ⬜ |
| T14 | Create `ErrorToast.tsx` | P2 | S | ⬜ |
| T15 | Create `src/app/(auth)/login/page.tsx` | P2 | L | ⬜ |
| T16 | Download & place Figma assets | P2 | S | ⬜ |
| T17 | Update `src/app/page.tsx` — placeholder | P3 | XS | ⬜ |
| T18 | Accessibility audit | P3 | S | ⬜ |
| T19 | Cloudflare + responsive smoke test | P3 | S | ⬜ |

**Effort legend**: XS < 15min · S 15–30min · M 30–60min · L 60–90min
