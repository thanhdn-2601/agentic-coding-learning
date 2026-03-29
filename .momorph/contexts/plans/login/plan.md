# Development Plan: Login Screen

**Frame ID**: `662:14387` | **MoMorph Frame ID**: `6381`
**Stack**: Next.js 15 (App Router) · Supabase Auth · Cloudflare Workers · Tailwind CSS v4 · next-intl
**Specs**: `.momorph/contexts/specs/login/spec.md`
**Design**: `.momorph/contexts/specs/login/design-style.md`
**Created**: 2026-03-23
**Status**: Ready to implement

---

## Current State Assessment

| Area | Status | Notes |
|---|---|---|
| `next-intl` | ❌ Not installed | Must add to `package.json` |
| Root `middleware.ts` | ❌ Missing | Only helper exists at `src/libs/supabase/middleware.ts` |
| `src/app/(auth)/login/` | ❌ Missing | Needs to be created |
| `src/app/auth/callback/` | ❌ Missing | Needs to be created |
| `src/components/auth/` | ❌ Missing | Needs to be created |
| `src/i18n/` | ❌ Missing | next-intl routing config |
| `messages/` (project root) | ❌ Missing | `vi.json`, `en.json` |
| `src/app/page.tsx` | ⚠️ Boilerplate | Replace with redirect to `/login` |
| `src/app/layout.tsx` | ⚠️ Boilerplate | Update fonts (Montserrat), metadata, lang attr |
| `src/app/globals.css` | ⚠️ Incomplete | Add SAA 2025 CSS variables + Montserrat font |
| `.env.example` | ⚠️ Incomplete | Missing `NEXT_PUBLIC_SITE_URL` |
| Supabase migration | ✅ Done | `20260323000000_initial_schema.sql` |
| TypeScript types | ✅ Done | `src/types/database.ts` |

---

## Milestones

```
M1 → Setup (dependencies + env + fonts + CSS variables)
M2 → i18n Foundation (next-intl config + message files)
M3 → Auth Infrastructure (middleware + callback route)
M4 → UI Components (LoginButton + LanguageSelector)
M5 → Login Page (Server Component + layout assembly)
M6 → Polish (accessibility + responsive + error toast)
```

---

## Milestone 1 — Setup

> **Goal**: Project foundations ready — packages, env vars, fonts, global styles.

### Task 1.1 — Install `next-intl`

```bash
yarn add next-intl
```

**Verify**: `next-intl` appears in `package.json` dependencies.

---

### Task 1.2 — Update `.env.example`

Add missing env var:

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**File**: `.env.example`
**Also add to `.env`** (local dev value `http://localhost:3000`).

---

### Task 1.3 — Update `src/app/globals.css`

Add SAA 2025 design tokens as CSS custom properties and Montserrat font import.

**Note**: Do NOT add a `@import url('https://fonts.googleapis.com/...')` here — fonts are loaded via `next/font/google` in `layout.tsx` (Task 1.4) and injected automatically. Adding both would double-load the font.

**What to add**:

```css
:root {
  /* SAA 2025 Brand Colors */
  --Details-Background: #00101A;
  --Details-Container: #101417;
  --Details-Container-2: #00070C;
  --Details-Divider: #2E3940;
  --Details-Border: #998C5F;
  --Details-Error: #B3261E;
  --BG-Update: #1E2D39;

  /* Text Colors */
  --Details-Text-Primary-1: #FFEA9E;
  --Details-Text-Primary-2: #00101A;
  --Details-Text-Secondary-1: #FFFFFF;
  --Details-Text-Secondary-2: #999999;

  /* Button Colors */
  --Details-TextButton-Normal: rgba(255, 234, 158, 0.10);
  --Details-PrimaryButton-Hover: #FFF8E1;
  --Details-ButtonSecondary-Hover: rgba(255, 234, 158, 0.40);
  --Details-SecondaryButton-Normal: rgba(255, 234, 158, 0.10);
  --Details-Dropdown-List-Hover: rgba(255, 255, 255, 0.08);
  --Details-Dropdown-List-Selected: rgba(255, 234, 158, 0.15);

  /* Accessibility */
  --focus-ring: 2px solid #FFEA9E;
  --focus-ring-offset: 2px;

  /* Layout */
  --page-padding-x: 144px;
  --page-padding-y: 96px;
  --header-height: 80px;
}

/* Replace the existing @theme inline block — Tailwind v4 uses this to map
   CSS vars to utility classes. Remove Geist references, add Montserrat. */
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

**What changes vs. existing file**:
- Remove `--background`/`--foreground` vars (replaced by SAA tokens)
- Remove `@media (prefers-color-scheme: dark)` block (app is always dark)
- Replace `@theme inline` → remove `--font-geist-sans`/`--font-geist-mono`, add `--font-montserrat`/`--font-montserrat-alt`
- Keep `@import "tailwindcss";` at top (do not remove)

**File**: `src/app/globals.css`

---

### Task 1.4 — Update `src/app/layout.tsx`

Replace Geist fonts with Montserrat. Update metadata and `<html lang>` to be dynamic (set by next-intl).

Also add `NextIntlClientProvider` so client components (e.g. `ErrorToast`, `LanguageSelector`) can use `useTranslations()`.

```typescript
// src/app/layout.tsx
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

**File**: `src/app/layout.tsx`

**Why `async` layout**: `getLocale()` and `getMessages()` are async server functions from `next-intl/server`. The `lang` attribute on `<html>` is now dynamic, reflecting the active locale.

---

## Milestone 2 — i18n Foundation

> **Goal**: `next-intl` configured with cookie-based locale. Vietnamese and English message files ready.

### Task 2.1 — ~~Create `src/i18n/routing.ts`~~ (NOT needed)

> **Skip this task.** `defineRouting()` from `next-intl/routing` is designed for **URL-prefix based routing** (e.g. `/vi/login`, `/en/login`). This app uses **cookie-based locale** with no URL prefix. Creating `routing.ts` would introduce unused code that could mislead developers and conflict with the cookie approach.
>
> The only required config file is `src/i18n/request.ts` (Task 2.2).

---

### Task 2.2 — Create `src/i18n/request.ts`

```typescript
// src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get('NEXT_LOCALE')?.value ?? 'vi';
  const locale = ['vi', 'en'].includes(raw) ? raw : 'vi';

  // Use static conditional imports — Cloudflare Workers does NOT support
  // dynamic template-literal imports (e.g. import(`.../${locale}.json`)).
  const messages =
    locale === 'en'
      ? (await import('../../messages/en.json')).default
      : (await import('../../messages/vi.json')).default;

  return { locale, messages };
});
```

**File**: `src/i18n/request.ts` *(create new)*

**Why static imports**: Cloudflare Workers (via `@opennextjs/cloudflare`) requires all imports to be statically analyzable at build time. Template-literal dynamic imports are not supported and will throw at runtime.

---

### Task 2.3 — Create `messages/vi.json`

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

**File**: `messages/vi.json` *(create new)*

---

### Task 2.4 — Create `messages/en.json`

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

**File**: `messages/en.json` *(create new)*

---

### Task 2.5 — Update `next.config.ts`

Wire `next-intl` plugin **while preserving the existing Cloudflare dev init**:

```typescript
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);

// Enable calling `getCloudflareContext()` in `next dev`.
// See https://opennext.js.org/cloudflare/bindings#local-access-to-bindings.
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();
```

**CRITICAL**: Do not remove `initOpenNextCloudflareForDev()` — it is required for Cloudflare bindings to work in `next dev`.

**File**: `next.config.ts`

---

## Milestone 3 — Auth Infrastructure

> **Goal**: Middleware guards all routes. `/auth/callback` handles OAuth code exchange and errors.

### Task 3.0 — Update `supabase/config.toml` redirect URLs

The local Supabase config already has `site_url = "http://localhost:3000"` and Google OAuth enabled. However, the `additional_redirect_urls` list **must include the `/auth/callback` path** — Supabase checks the `redirectTo` URL against this allow-list exactly.

Current:
```toml
additional_redirect_urls = ["http://localhost:3000", "https://127.0.0.1:3000"]
```

Update to:
```toml
additional_redirect_urls = [
  "http://localhost:3000",
  "http://localhost:3000/auth/callback",
  "https://127.0.0.1:3000",
  "https://127.0.0.1:3000/auth/callback"
]
```

**File**: `supabase/config.toml`

**Also required for production**: In the Supabase dashboard → Authentication → URL Configuration, add `${NEXT_PUBLIC_SITE_URL}/auth/callback` to the **Redirect URLs** allow-list.

---

### Task 3.1 — Create root `middleware.ts`

Responsibilities:
1. Refresh Supabase session (via `src/libs/supabase/middleware.ts` helper)
2. Guard protected routes — redirect unauthenticated users to `/login`
3. Guard `/login` — redirect authenticated users to `/`
4. Keep `/login` and `/auth/callback` public (no session required)

```typescript
// middleware.ts  (at project root src/ level → actually src/middleware.ts in App Router)
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/libs/supabase/middleware';

const PUBLIC_PATHS = ['/login', '/auth/callback'];

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  // MUST use getUser() not getSession() — getSession() does not validate the JWT
  // server-side and is a security risk (relies on unverified cookie data).
  // Destructure error too: if Supabase is unreachable, treat as unauthenticated
  // (fail-safe) rather than crashing the middleware.
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
  const isAuthenticated = !getUserError && !!user;

  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  if (!isAuthenticated && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && pathname === '/login') {
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

**File**: `src/middleware.ts` *(create new)*

---

### Task 3.2 — Create `/auth/callback` route handler

Responsibilities:
1. Exchange `?code` for session via `exchangeCodeForSession`
2. On success: sync `NEXT_LOCALE` cookie → `profiles.locale`, then redirect to `/`
3. On error (`?error` param): redirect to `/login?error=oauth_failed`

```typescript
// src/app/auth/callback/route.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // OAuth error returned by Google/Supabase
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  // Sync locale preference from cookie → profiles.locale
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

**File**: `src/app/auth/callback/route.ts` *(create new)*

---

### Task 3.3 — Update `src/app/page.tsx`

The root route is the "dashboard" (post-login). For now, it should be protected with a lightweight check. Since middleware handles the redirect, page.tsx just needs to be a placeholder.

```typescript
// src/app/page.tsx
import { createClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Belt-and-suspenders check (middleware already guards this)
  if (!user) redirect('/login');

  return (
    <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--Details-Background)' }}>
      <p className="text-white font-montserrat">Dashboard — coming soon</p>
    </main>
  );
}
```

**File**: `src/app/page.tsx`

---

## Milestone 4 — UI Components

> **Goal**: `LoginButton` and `LanguageSelector` client components built, fully styled per Figma, accessible.

### Task 4.1 — Create `src/components/auth/LoginButton.tsx`

**Requirements** (from spec):
- Client Component (`'use client'`)
- On click: calls `supabase.auth.signInWithOAuth` with redirect flow
- States: Default / Hover / Active / Disabled / Loading
- Loading: replaces Google icon with spinner, button `disabled`
- Shows error toast when `?error=oauth_failed` is in URL
- `aria-label` and visible focus ring

**Key design**:
- Background: `#FFEA9E`, text: `#00101A`, border-radius: `8px`
- Size: `305×60px` desktop, `100% width / 56px height` mobile
- Hover: `#FFF8E1` + `box-shadow: 0 4px 12px rgba(0,0,0,0.3)`
- Font: Montserrat 700, 22px

**File**: `src/components/auth/LoginButton.tsx` *(create new)*

---

### Task 4.2 — Create `src/components/auth/LanguageSelector.tsx`

**Requirements** (from spec):
- Client Component (`'use client'`)
- Trigger button: flag icon + locale code ("VN"/"EN") + chevron down
- Click opens/closes the dropdown panel
- Clicking VN or EN: sets `NEXT_LOCALE` cookie (path `/`) and calls `router.refresh()`
- Click outside / `Escape` key → closes dropdown and returns focus to trigger
- Selected item highlighted with `rgba(255, 234, 158, 0.15)` bg + `#FFEA9E` text

**Key design**:
- Trigger: `108×56px`, `border-radius: 4px`, bg: `rgba(255,234,158,0.10)`
- Dropdown panel: `110px` wide, 2×`56px` items, bg `#101417`, border `1px solid #2E3940`, `border-radius: 8px`
- Position: absolute, top 100%, right-aligned, z-index 50
- Focus ring: `2px solid #FFEA9E` with `outline-offset: 2px`

**Implementation detail**:
```typescript
// Set locale cookie (client side)
document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
router.refresh(); // Re-fetch server component with new locale
```

**File**: `src/components/auth/LanguageSelector.tsx` *(create new)*

---

### Task 4.3 — Create `src/components/auth/ErrorToast.tsx`

Lightweight client component: reads `?error` search param, shows dismissible toast message.

**Trigger**: `?error=oauth_failed` → display translated error string from `t('login.error_oauth_failed')`
**Position**: top-center, `z-index: 200`
**Auto-dismiss**: after 5 seconds
**Colors**: background `#B3261E` (error), text white

**File**: `src/components/auth/ErrorToast.tsx` *(create new)*

---

## Milestone 5 — Login Page Assembly

> **Goal**: Login page fully rendered, matching Figma 1:1 at all breakpoints.

### Task 5.1 — Create `src/app/(auth)/login/page.tsx`

Server Component. Checks session server-side (belt-and-suspenders). Renders the full Login layout.

**Layout structure** (reflecting Figma layers):
```
<div> (min-h-screen, bg #00101A, relative overflow-hidden)
  ├── C_Keyvisual    (absolute, full-bleed background image)
  ├── Rectangle 57  (absolute, left-fade gradient overlay)
  ├── A_Header       (fixed, top-0, z-100)
  │   ├── A.1_Logo  (left)
  │   └── A.2_Language → <LanguageSelector />
  ├── B_Bìa Hero    (relative, padding 96px 144px, top 88px)
  │   ├── B.1_Key Visual (ROOT FURTHER image)
  │   ├── B.2_Content text (2 lines, from next-intl)
  │   └── B.3_Login → <LoginButton />
  ├── Cover          (absolute, bottom gradient overlay)
  └── D_Footer       (absolute, bottom-0)
      ├── Copyright text
      └── <Suspense fallback={null}><ErrorToast /></Suspense>
```

> **Why Suspense around ErrorToast**: `ErrorToast` calls `useSearchParams()` internally. In Next.js App Router, any component using `useSearchParams()` must be wrapped in `<Suspense>` or the build will fail with an error about missing Suspense boundary during static rendering.

**Responsive behaviour** (Tailwind classes):
- Tablet (`md:`): `px-8 py-20`
- Desktop (`lg:`): `px-[144px] py-[96px] gap-[120px]`

**Includes**: `<ErrorToast />` component for OAuth error display.

**File**: `src/app/(auth)/login/page.tsx` *(create new)*

---

### Task 5.2 — Add image assets to `public/`

Download from Figma using MoMorph media IDs and place in `public/`:

| Asset | MoMorph ID | Destination |
|---|---|---|
| SAA 2025 Logo | `MM_MEDIA_Logo` | `public/assets/saa/logos/saa-logo.png` |
| ROOT FURTHER artwork | `MM_MEDIA_Root Further Logo` | `public/assets/login/images/root-further.png` |
| Google icon | `MM_MEDIA_Google` | `public/assets/auth/icons/google-icon.svg` |
| VN flag | `MM_MEDIA_VN` | `public/assets/auth/icons/flag-vn.svg` |
| EN flag | `MM_MEDIA_EN` | `public/assets/auth/icons/flag-en.svg` |
| Chevron Down | `MM_MEDIA_Down` | `public/assets/auth/icons/chevron-down.svg` |
| Hero background | Figma node `662:14389` | `public/assets/login/images/hero-bg.jpg` |

**Convention** (from `constitution.md`): All assets go under `public/assets/{group}/{icons\|images\|logos}/` with kebab-case filenames.

---

## Milestone 6 — Polish & Hardening

> **Goal**: Accessibility, responsive correctness, error handling completeness, Cloudflare compatibility.

### Task 6.1 — Accessibility audit

Verify:
- [ ] `LoginButton` has `aria-label="Login with Google"` and `aria-busy={isLoading}`
- [ ] `LanguageSelector` trigger has `aria-haspopup="listbox"`, `aria-expanded={isOpen}`
- [ ] Dropdown options have `role="option"`, `aria-selected` per locale
- [ ] All interactive elements have visible focus ring (`outline: var(--focus-ring)`)  
- [ ] Color contrast: `#FFEA9E` on `#00101A` = 10.7:1 ✅ (WCAG AAA)
- [ ] `<img>` tags have `alt` text; decorative images have `alt=""`

### Task 6.2 — Responsive smoke test

Check at 3 breakpoints:
- **375px**: Button full-width, hero text 16px, header padding `16px`, footer `24px 16px`
- **768px**: Button min-width 280px, hero padding `32px`
- **1440px**: Exact Figma dimensions match

### Task 6.3 — Cloudflare Workers compatibility check

- [ ] No `fs`, `path`, or Node.js built-ins used directly
- [ ] `next-intl` imports only from `next-intl/server` (not dynamic `require`)
- [ ] `messages/*.json` imported statically (no `fs.readFile`)
- [ ] All env vars accessed via `process.env.*` (Cloudflare runtime compatible)
- [ ] Test with `yarn build && npx wrangler dev` locally

### Task 6.4 — Error states integration test

- [ ] Navigate to `/login?error=oauth_failed` → ErrorToast appears with correct message
- [ ] Toast auto-dismisses after 5 seconds
- [ ] URL is cleaned (`?error` removed) after toast dismisses (use `router.replace`)

---

## Dependencies Map

```
M1 (Setup)
  └─▶ M2 (i18n) ─────┐
  └─▶ M3 (Auth Infra)─┤
                       └─▶ M4 (UI Components)
                             └─▶ M5 (Login Page Assembly)
                                   └─▶ M6 (Polish)
```

M1 must complete before anything else. M2 and M3 can run in parallel. M4 depends on both M2 (for `useTranslations`) and M3 (for `createBrowserClient`). M5 depends on M4.

---

## Files to Create / Modify

### New files

| File | Milestone | Description |
|---|---|---|
| `src/middleware.ts` | M3 | Root middleware — session guard |
| `src/app/auth/callback/route.ts` | M3 | OAuth callback handler |
| `src/app/(auth)/login/page.tsx` | M5 | Login page (Server Component) |
| `src/components/auth/LoginButton.tsx` | M4 | Google login button (Client) |
| `src/components/auth/LanguageSelector.tsx` | M4 | Language dropdown (Client) |
| `src/components/auth/ErrorToast.tsx` | M4 | OAuth error toast (Client) |
| `src/i18n/routing.ts` | M2 | ~~next-intl routing config~~ **SKIP — not needed for cookie-based locale** |
| `src/i18n/request.ts` | M2 | next-intl request config |
| `messages/vi.json` | M2 | Vietnamese strings (at **project root**, not under `src/`) |
| `messages/en.json` | M2 | English strings (at **project root**, not under `src/`) |

### Modified files

| File | Milestone | Change |
|---|---|---|
| `package.json` | M1 | Add `next-intl` |
| `.env.example` | M1 | Add `NEXT_PUBLIC_SITE_URL` |
| `.env` | M1 | Add `NEXT_PUBLIC_SITE_URL=http://localhost:3000` |
| `src/app/globals.css` | M1 | Add CSS variables + Montserrat import |
| `src/app/layout.tsx` | M1 | Replace Geist → Montserrat, update metadata |
| `next.config.ts` | M2 | Wrap with `withNextIntl()` |
| `src/app/page.tsx` | M3 | Replace boilerplate → dashboard placeholder |
| `supabase/config.toml` | M3 | Add `/auth/callback` to `additional_redirect_urls` |

---

## Acceptance Criteria Mapping

| Acceptance Scenario | Milestone | Task |
|---|---|---|
| US1-1: Unauthenticated → show Login page | M3 | Task 3.1 middleware |
| US1-2: Click button → redirect to Google OAuth | M4 | Task 4.1 LoginButton |
| US1-3: OAuth complete → redirect to dashboard | M3 | Task 3.2 callback route |
| US1-4: First login → profile auto-created | DB trigger | Already in migration |
| US2-1: Authenticated → skip Login, go home | M3 | Task 3.1 middleware |
| US2-2: Session expired → back to Login | M3 | Task 3.1 middleware |
| US3-1: Click "VN" → dropdown opens | M4 | Task 4.2 LanguageSelector |
| US3-2: Select "EN" → locale changes | M4 | Task 4.2 LanguageSelector |
| US3-4: Click outside → dropdown closes | M4 | Task 4.2 LanguageSelector |
| US3-5: Post-login → locale synced to profiles | M3 | Task 3.2 callback route |
| US3-6: Pre-login locale → cookie persists | M4 | Task 4.2 LanguageSelector |
| US3-7: Escape key → dropdown closes | M4 | Task 4.2 LanguageSelector |
| Edge: OAuth error → toast on /login | M4+M6 | Task 4.3 + 6.4 |
| Edge: Loading state → button disabled | M4 | Task 4.1 LoginButton |
| Edge: Mobile tap-friendly | M6 | Task 6.2 |
