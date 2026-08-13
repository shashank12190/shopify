# Build Plan

Phased implementation checklist for this project, derived from `docs/00-build-map.md`
and the full lesson text in `docs/`. Each phase maps to one `docs/` section; each step
maps to one lesson file and is broken into concrete substeps (files, commands, code
elements). Check items off as they're completed. Phases and steps are dependency-ordered
— do not skip ahead within or across phases.

---

## Phase 0 — Setup Decisions

- [x] **`src/` vs root layout.** Docs assume root-level `app/`, `lib/`, `db/`, `components/`.
      This repo has `src/app` from `create-next-app`.
  - [x] **Decision: keep `src/`.** `tsconfig.json` already maps `@/*` → `src/*`
        (`"paths": {"@/*": ["./src/*"]}`) — no change needed
  - [x] Apply that mapping mentally to every file path referenced in later phases
        (e.g. a doc path `app/(root)/page.tsx` becomes `src/app/(root)/page.tsx`)
- [x] **Framework version check.** Skimmed `node_modules/next/dist/docs/` (Next.js
      16.3.0). Confirmed one breaking change relevant to this course, noted below.
- [x] **Environment check.** Node v24.17.0, npm 11.13.0. `npm install --legacy-peer-deps`
      completes cleanly (359 packages, 0 vulnerabilities).
- [x] **Reference repo discovered mid-build:** `prostore-main/` (project root) contains
      the *complete finished course implementation* — not just partial assets like
      `resources/`. Use it as source of truth for every remaining step (exact code for
      `db/sample-data.ts`, `db/seed.ts`, `prisma/schema.prisma`, all `app/`/`components/`
      files, `auth.ts`, etc.), adapting only for: this repo's `src/` layout, Next.js 16's
      `middleware.ts`→`proxy.ts` rename (below), and Prisma 7's generator/driver-adapter
      changes (see Phase 2). `resources/` is now effectively superseded by this — kept
      around but no longer the primary reference.

### ⚠️ Breaking change found: `middleware.ts` → `proxy.ts`

Next.js 16 renamed Middleware to **Proxy**. Functionality is identical, but the file
and export name changed:

- File must be named `proxy.ts` (project root, or inside `src/` — same level as
  `app/`), not `middleware.ts`.
- Export a `proxy` function (named or default), not `middleware`. The `matcher`
  config export is unchanged.
- `export { auth as middleware } from '@/auth'` (the course's NextAuth pattern)
  becomes **`export { auth as proxy } from '@/auth'`** in `proxy.ts`.

This affects two later steps — both already updated below:
- **Step 4.3** (session cart cookie) — create `proxy.ts` instead of `middleware.ts`.
- **Step 17.1** (Vercel Hobby-tier fix) — the lightweight-config split targets
  `proxy.ts`, exporting `proxy` from `NextAuth(authConfig)`.

### ⚠️ Breaking change found: Prisma 7 custom client output + `prisma.config.ts`

Installed `prisma@7.9.1` (course assumes an older Prisma with the classic
`prisma-client-js` generator). Two differences:

- `npx prisma init` scaffolds `generator client { provider = "prisma-client"
  output = "../src/generated/prisma" }` — the client generates to
  **`src/generated/prisma`**, not into `node_modules/@prisma/client`.
  **Every future `import { PrismaClient } from '@prisma/client'` in the
  course text must instead import from the generated path** (e.g.
  `@/generated/prisma` via the `@/*` → `src/*` alias). Applies to
  `db/seed.ts` (Step 2.3), `db/prisma.ts` (Step 2.6), and anywhere else a
  raw `PrismaClient` is instantiated.
- `npx prisma init` also scaffolds a root `prisma.config.ts` (Prisma's new
  config file, supersedes some `schema.prisma`-only behavior) that does
  `import "dotenv/config"` to load `.env`. This resolves today because
  `dotenv` is present transitively (via `prisma`'s and `shadcn`'s own
  dependency trees) — not a direct project dependency. Works, but is worth
  knowing about if a clean install ever drops it; install `dotenv` directly
  as a dev dependency if `prisma generate`/`migrate` ever fails to pick up
  `DATABASE_URL`.

---

## Phase 1 — App Shell & Basic Layout (docs §02)

### Step 1.1 — Create Next app & assets (02-02) ✅
- [x] Confirm scaffold matches: TypeScript, ESLint, Tailwind, App Router (already done by
      `create-next-app`, adjusted for `src/`)
- [x] Swap default font to Inter in `src/app/layout.tsx`
- [x] Move `globals.css` → `src/assets/styles/globals.css` (kept Tailwind v4 syntax —
      the course's `resources/assets/styles/globals.css` is Tailwind v3, not copied
      verbatim; see note below)
- [x] Clear `src/app/page.tsx` to a blank starting point
- [x] Copy `resources/images/logo.svg` → `public/images/logo.svg`
- [x] Copy `resources/favicon.ico` → `src/app/favicon.ico`
- [x] Add Tailwind `@layer utilities` classes to `globals.css`: `.wrapper`,
      `.flex-start`/`.flex-center`/`.flex-between`, `.h1-bold`/`.h2-bold`/`.h3-bold`
      (v4 `@layer utilities` + `@apply` — same output, v4-compatible source)

> **Note:** this project uses Tailwind v4 (`@import "tailwindcss"`, `@theme inline`),
> while the course resources use Tailwind v3 syntax (`@tailwind base/components/
> utilities`, HSL `hsl(var(--x))` theme variables). Utility classes were ported with
> the same names/behavior in v4 syntax. Step 1.2 (`shadcn init`) will generate v4-style
> theme variables (oklch) rather than the course's v3 HSL variables — expect ShadCN
> component styling to match visually but differ under the hood from the course video.

### Step 1.2 — ShadCN setup (02-03)
- [x] Run `npx shadcn@latest init` — **CLI has changed significantly since the course
      was recorded; see note below.** Ran `npx shadcn@latest init --base radix --defaults
      --force`, confirmed at the "switching from base to radix" prompt.
- [x] `init` itself scaffolds a test component (`src/components/ui/button.tsx`) and
      `src/lib/utils.ts` — substep satisfied, no separate `add button` needed
- [x] Disable `@typescript-eslint/no-empty-object-type` — **not needed.** Ran
      `npx eslint .` across the project: zero errors/warnings. This shadcn CLI
      version generates `button.tsx` with an inline type intersection
      (`React.ComponentProps<"button"> & VariantProps<...> & {...}`) instead of the
      old empty-`interface X extends Y {}"` pattern that used to trip this rule, so
      there's nothing to disable.

> **Note — shadcn CLI v4.17.0 divergence from the course:**
> - No more "style: default + base color: Slate" prompts. Replaced by named presets
>   (`nova`, `vega`, `maia`, `lyra`, `mira`, `luma`, `sera`, `rhea`) with no Slate
>   equivalent. Used `--defaults` → preset **`nova`**.
> - New `--base <base>` flag picks the component-primitive library: `base` (Base UI,
>   the new CLI default), `radix`, or `aria`. **The course's code assumes Radix UI.**
>   First `init` run defaulted to Base UI (installed `@base-ui/react`) and also
>   mis-detected `resources/assets/styles/globals.css` (the untouched course
>   reference copy) as the project stylesheet, writing shadcn's CSS into it.
>   Corrected by: restoring `resources/assets/styles/globals.css` to its original
>   content, fixing `components.json`'s `tailwind.css` path to
>   `src/assets/styles/globals.css`, re-running `init` with `--base radix --force`
>   (user confirmed this choice), removing the leftover `@base-ui/react` dependency,
>   and re-merging our `.wrapper`/`.flex-*`/`.h1-bold` utility classes (the second
>   `init` run preserved them automatically this time).
> - `components.json`: `"style": "radix-nova"`, `"baseColor": "neutral"` (closest
>   available to the course's "Slate").
> - `src/app/layout.tsx`: `shadcn init`'s "Updating fonts" step added a second
>   (`Geist`) font alongside our Step-1.1 Inter choice. Removed Geist; Inter is now
>   wired as the `--font-sans` CSS variable via `variable: "--font-sans"` +
>   `inter.variable` on `<html>`, which is what the generated stylesheet expects.
> - `button.tsx` now imports `{ Slot } from "radix-ui"` (the new unified Radix
>   package) rather than per-component packages like `@radix-ui/react-slot` — same
>   API, different import path. Expect this pattern on every future
>   `npx shadcn@latest add <component>` call in later phases.
> - Verified after all fixes: `tsc --noEmit` clean (no new errors), dev server
>   returns 200.

### Step 1.3 — Root layout and constants (02-04) ✅
- [x] Create route group `src/app/(root)/layout.tsx` (wraps children in a `.wrapper` div)
      — also moved `page.tsx` into the group (route groups only apply to nested pages)
- [x] Simplify `src/app/layout.tsx` to a bare `{children}` passthrough — already
      satisfied, no change needed
- [x] Create `src/lib/constants/index.ts`: `APP_NAME`, `APP_DESCRIPTION`, `SERVER_URL`
      (read from `NEXT_PUBLIC_*` env vars, default `"Prostore"` matching the course)
- [x] Add `.env` (already covered by `.gitignore`'s `.env*` pattern) with matching
      `NEXT_PUBLIC_APP_NAME`/`NEXT_PUBLIC_APP_DESCRIPTION`/`NEXT_PUBLIC_SERVER_URL`
- [x] Wire constants into `metadata` in `src/app/layout.tsx`: title template
      (`%s | ${APP_NAME}`), `description`, `metadataBase: new URL(SERVER_URL)` —
      verified rendered `<title>Prostore</title>`

### Step 1.4 — Header & footer (02-05) ✅
- [x] Create `components/shared/header/index.tsx`: logo, cart link, sign-in button
      (`Button`/`Link`/`lucide-react` icons)
- [x] Create `components/footer.tsx`: copyright line (dynamic year)
- [x] Embed both into `app/(root)/layout.tsx` — Header + `<main class="flex-1 wrapper">`
      + Footer in a `flex h-screen flex-col` shell; verified rendered on homepage

### Step 1.5 — Theme mode toggle (02-06) ✅
- [x] `npx shadcn@latest add dropdown-menu`
- [x] `npm install next-themes`
- [x] Create `components/shared/header/mode-toggle.tsx`: client component, `useTheme`,
      dropdown with System/Light/Dark options
- [x] Wrap app in `<ThemeProvider>` in `app/layout.tsx`
- [x] Fix hydration mismatch: `suppressHydrationWarning` on `<html>` + a `mounted` state
      guard in the toggle component

### Step 1.6 — Loading & not-found pages (02-07) ✅
- [x] Copy `resources/assets/loader.gif` → `assets/loader.gif`
- [x] Create `app/loading.tsx` using the loader gif
- [x] Create `app/not-found.tsx`: client component, logo + "Back to home" button

### Step 1.7 — Responsive sheet menu (02-08) ✅
- [x] `npx shadcn@latest add sheet`
- [x] Create `components/shared/header/menu.tsx`: desktop nav + mobile `Sheet`/
      `SheetTrigger`/`SheetContent` triggered by an `EllipsisVertical` icon
- [x] Replace the inline header nav from Step 1.4 with `<Menu />`

### Step 1.8 — List sample products (02-09) ✅
- [x] Course's `db/sample-data.ts` wasn't present in `resources/` at first — briefly
      used a fabricated placeholder dataset, then replaced with the **real** data
      from `prostore-main/db/sample-data.ts` (the full reference repo found later —
      see Phase 0/project memory) once discovered: 6 clothing products + a `users`
      array (admin/regular, plaintext passwords for Phase 3 hashing)
- [x] Copy sample product images + `banner-1.jpg`/`banner-2.jpg` into
      `public/images/` (from `resources/images/`)
- [x] Create `components/shared/product/product-list.tsx`: grid layout, `limit` prop
- [x] Wire `<ProductList>` into `app/(root)/page.tsx` using `sampleData.products`

### Step 1.9 — Product card component (02-10) ✅
- [x] `npx shadcn@latest add card`
- [x] Create `components/shared/product/product-card.tsx`: image, brand, name, rating,
      price / out-of-stock state
- [x] Use `<ProductCard>` inside `<ProductList>`

### Step 1.10 — Product price component (02-11) ✅
- [x] Create `components/product/product-price.tsx`: splits price into integer/decimal
      parts with `$` superscript styling
- [x] Wire `<ProductPrice>` into `<ProductCard>`

**Checkpoint:** homepage renders a product grid from static sample data, with working
theme toggle and responsive nav.

---

## Phase 2 — Database, Prisma & Product Display (docs §03)

> **⚠️ Reordered for Prisma 7 (see Phase 0 breaking-change note).** The course
> builds `getLatestProducts()` first with a bare `new PrismaClient()` (works
> in the course's older Prisma) and only adds the Neon driver adapter later
> in 03-07. **Prisma 7 requires a driver adapter for every SQL connection —
> a bare `new PrismaClient()` throws at runtime.** So `db/prisma.ts` (the
> course's 03-07 step) is pulled forward to Step 2.3, ahead of seeding
> (2.4) and querying (2.5), instead of being added afterward. Step numbers
> below reflect the new order; docs references in parens still point at the
> original lesson for that content.

### Step 2.1 — Postgres & Prisma setup (03-02) ✅
- [x] Create a database — **user chose Neon directly** (not Vercel Postgres) —
      project `neon-emerald-bucket`, database `ecommerce`
- [x] `npm install -D prisma @prisma/client` (installed `prisma@7.9.1`)
- [x] `npx prisma init` → created `prisma/schema.prisma` + placeholder
      `DATABASE_URL` in `.env`
- [x] Replaced placeholder with the real Neon connection string (retrieved via
      browser from the Neon console, written directly to `.env`)
- [ ] Prisma VS Code extension + format-on-save — optional, not done (mention
      to user, no action needed from me)

### Step 2.2 — Prisma models & migrations (03-03) ✅
- [x] Add `Product` model to `prisma/schema.prisma`: uuid `id`, unique `slug`,
      `price`/`rating` as `Decimal`, `isFeatured`, `banner`, `createdAt` (verified
      against `prostore-main/prisma/schema.prisma`)
- [x] Add `"postinstall": "prisma generate"` to `package.json` scripts
- [x] `npx prisma generate` — client generated to `src/generated/prisma`
- [x] `npx prisma migrate dev --name init` — migration `20260813084854_init`
      created against the Neon `ecommerce` database
- [ ] `npx prisma studio` — optional, skipped for now

### Step 2.3 — Serverless env config / Neon driver adapter (moved up from 03-07) ✅
- [x] `npm install @neondatabase/serverless @prisma/adapter-neon ws`
- [x] `npm install -D @types/ws`
- [x] Create `src/db/prisma.ts` adapted from `prostore-main/db/prisma.ts` for
      Prisma 7: imports `PrismaClient` from `@/generated/prisma/client`;
      `PrismaNeon` constructor verified against the installed adapter's
      `.d.ts` — takes `{ connectionString }` (v7, adapter builds its own pool
      internally), not a raw `Pool` instance like v6. Kept only the `product`
      `.$extends()` block (cart/order blocks come later once those models
      exist)
- [x] No `previewFeatures = ["driverAdapters"]` needed — adapters are the
      default/required SQL path in v7, not a preview feature
- [x] Excluded `prostore-main/` from `tsconfig.json`'s `exclude` array — it
      was being type-checked against our `@/*` alias and producing false
      errors

### Step 2.4 — Seed sample data (03-04) ✅
- [x] Create `db/seed.ts`: deletes existing products, then `createMany` from
      `sample-data.ts` — import the shared client from `@/db/prisma` (not a
      bare `new PrismaClient()`, which will throw without an adapter)
- [x] Run `npx tsx ./db/seed`

### Step 2.5 — Load products from database (03-05) ✅
- [x] Add `convertToPlainObject<T>()` to `lib/utils.ts`
- [x] Create `lib/actions/product.actions.ts` (`'use server'`): `getLatestProducts()`
      via `prisma.product.findMany`, importing the shared client from `@/db/prisma`
- [x] Add `LATEST_PRODUCTS_LIMIT` constant
- [x] Wire `getLatestProducts()` into `app/(root)/page.tsx`, replacing sample-data usage

### Step 2.6 — Zod validation & type inference (03-06) ✅
- [x] `npm install zod`
- [x] Create `lib/validator.ts`: `insertProductSchema`, `currency` refined string schema
- [x] Add `formatNumberWithDecimal()` to `lib/utils.ts`
- [x] Create `types/index.ts`: `Product` type via `z.infer<typeof insertProductSchema>`
      plus extra fields (id, rating, etc.)
- [x] Update `ProductCard`/`ProductList` prop types to use `Product` instead of `any`

### Step 2.7 — Product details page (03-08) ✅
- [x] Add `getProductBySlug(slug)` to `product.actions.ts`
- [x] `npx shadcn@latest add badge`
- [x] Create `app/(root)/product/[slug]/page.tsx`: images/details/action column grid,
      `notFound()` on missing product, `<ProductPrice>`, `<Badge>` for stock status,
      static "Add to cart" placeholder button

### Step 2.8 — Product images component (03-09) ✅
- [x] Create `components/product/product-images.tsx`: client component, `useState` for
      selected image, thumbnail row
- [x] Wire into the product details page

### Step 2.9 — Initial deployment (03-10)
- [ ] **Confirm with user before any git push / deploy.**
- [ ] `git init` / commit / push to GitHub (if not already done)
- [ ] Import the project into a Vercel project
- [ ] Copy all current `.env` values into the Vercel dashboard env vars
- [ ] If install fails on Vercel, set install command to
      `npm install --legacy-peer-deps`
- [ ] Update `SERVER_URL` to the deployed URL post-deploy

### Step 2.10 — Note on ESLint/TS errors (03-11)
- [ ] Adopt the recommended approach: fix `no-unused-vars` etc. as they appear rather
      than suppressing
- [ ] Do **not** enable `next.config.ts` `typescript.ignoreBuildErrors` or blanket-disable
      ESLint rules — treat as a last resort only, discuss with user first

**Checkpoint:** products load from the real database; product details page works;
app is deployed and auto-deploys on push (only if user approves the deploy step).

---

## Phase 3 — Authentication (docs §04)

### Step 3.1 — Prisma user-related models (04-02)
- [ ] Add `User`, `Account`, `Session`, `VerificationToken` models to
      `prisma/schema.prisma` (Auth.js Prisma-adapter shape, customized: `role` default
      `"user"`, `address` as `Json`, `paymentMethod`)
- [ ] `npx prisma generate`
- [ ] `npx prisma migrate dev --name add_user_based_tables`

### Step 3.2 — Seed user data (04-03)
- [ ] `npm install bcrypt-ts-edge`
- [ ] Add a `users` array (admin + regular user, passwords via `hashSync`) to
      `db/sample-data.ts`
- [ ] Update `db/seed.ts` to also delete/seed `account`, `session`,
      `verificationToken`, `user`

### Step 3.3 — NextAuth setup (04-04)
- [ ] `npm install next-auth@5.0.0-beta.25 --legacy-peer-deps`
- [ ] `npm install @auth/prisma-adapter`
- [ ] Generate `NEXTAUTH_SECRET` (`openssl rand -base64 32` or equivalent)
- [ ] Add `NEXTAUTH_URL` / `NEXTAUTH_URL_INTERNAL` to `.env`
- [ ] Create root `auth.ts`: `config` object (pages, `session: {strategy: 'jwt',
      maxAge: 30 days}`, `PrismaAdapter(prisma)`, `CredentialsProvider` with
      `authorize()` using `compareSync`, `session` callback)
- [ ] Export `handlers, auth, signIn, signOut` via `NextAuth(config)`

### Step 3.4 — NextAuth catch-all route (04-05)
- [ ] Create `app/api/auth/[...nextauth]/route.ts` exporting `GET`/`POST` from
      `handlers`

### Step 3.5 — Sign-in/sign-out action (04-06)
- [ ] Add `signInFormSchema` to `lib/validator.ts`
- [ ] Create `lib/actions/user.actions.ts` (`'use server'`):
      `signInWithCredentials(prevState, formData)` (Zod-parses input, calls `signIn`,
      handles `isRedirectError`), `signOutUser()`

### Step 3.6 — Auth layout & sign-in page (04-07)
- [ ] Create `app/(auth)/layout.tsx`: centered layout, no header/footer
- [ ] Create `app/(auth)/sign-in/page.tsx`: `Card` with logo/title, metadata title
      "Sign In"

### Step 3.7 — Credentials sign-in form (04-08)
- [ ] `npx shadcn@latest add input label`
- [ ] Create `app/(auth)/sign-in/credentials-signin-form.tsx`: client form,
      `signInDefaultValues` constant, link to `/sign-up`

### Step 3.8 — Hook up sign-in form (04-09)
- [ ] Wire the form via `useActionState(signInWithCredentials, ...)` +
      `useFormStatus` (disabled/"Signing In..." button while pending)
- [ ] Display action error messages in the form
- [ ] On the sign-in page, check `auth()` session and redirect to `/` if already
      logged in

### Step 3.9 — CallbackUrl redirect (04-10)
- [ ] Sign-in page reads `searchParams.callbackUrl` and redirects there post-login
- [ ] Form passes `callbackUrl` as a hidden input via `useSearchParams()`

### Step 3.10 — User button / sign-out (04-11)
- [ ] Create `components/shared/header/user-button.tsx`: async server component —
      "Sign In" link if no session, else dropdown with user initial/name/email and a
      `SignOutUser` form action
- [ ] Embed `<UserButton>` in `<Menu>` (desktop nav + mobile sheet)

### Step 3.11 — Sign-up schema & action (04-12)
- [ ] Add `signUpFormSchema` (name/email/password/confirmPassword with `.refine()`
      password-match check) to `lib/validator.ts`
- [ ] Add `signUp(prevState, formData)` action to `user.actions.ts` (hashes password,
      `prisma.user.create`, then calls `signIn`)

### Step 3.12 — Sign-up form (04-13)
- [ ] Create `app/(auth)/sign-up/page.tsx` + `app/(auth)/sign-up/signup-form.tsx`
      (mirrors the sign-in form pattern, `useActionState(signUp, ...)`)
- [ ] Add `signUpDefaultValues` constant

### Step 3.13 — Sign-up error handling (04-14)
- [ ] Add `formatError(error)` to `lib/utils.ts`: handles `ZodError` and Prisma
      `P2002` unique-constraint errors with user-friendly messages
- [ ] Wire `formatError` into the catch blocks of `signUp` and
      `signInWithCredentials`

### Step 3.14 — Customize token with JWT callback (04-15)
- [ ] Add a `jwt` callback to `auth.ts`: assigns `token.role`, defaults `name` to the
      email prefix when `NO_NAME`, syncs to DB, handles `trigger === 'update'`
- [ ] Update the `session` callback to map `token.id`/`token.name`/`token.role` onto
      `session.user`

**Checkpoint:** users can sign up, sign in, sign out; session reflects role; protected
redirect-after-login works.

---

## Phase 4 — Cart (docs §05)

### Step 4.1 — Cart schema & model (05-02)
- [ ] Add `cartItemSchema`, `insertCartSchema` to `lib/validator.ts`
- [ ] Add `Cart`, `CartItem` types to `types/index.ts`
- [ ] Add `Cart` model to `prisma/schema.prisma`: `items Json[]`,
      `itemsPrice`/`shippingPrice`/`taxPrice`/`totalPrice` as `Decimal`, relation to
      `User`; add `Cart Cart[]` to the `User` model
- [ ] `npx prisma generate` + `npx prisma migrate dev --name add-cart`

### Step 4.2 — Add-to-cart component (05-03)
- [ ] `npx shadcn@latest add toast`
- [ ] Add `<Toaster />` to `app/layout.tsx`
- [ ] Create `components/shared/product/add-to-cart.tsx`: client component,
      `useRouter`, `useToast`, `handleAddToCart`
- [ ] Wire into the product details page
- [ ] Create stub `lib/actions/cart.actions.ts` with a hardcoded
      `addItemToCart(data: CartItem)` for wiring/testing before real logic exists

### Step 4.3 — Set session cart cookie (05-04)
- [ ] Create root `proxy.ts` **(renamed from `middleware.ts` in Next.js 16 — see
      Phase 0)**: `export { auth as proxy } from '@/auth'`
- [ ] Add an `authorized({request, auth})` callback to `auth.ts` that generates and
      sets a `sessionCartId` cookie via `NextResponse` when missing

### Step 4.4 — Get item for cart (05-05)
- [ ] Flesh out `addItemToCart` in `cart.actions.ts`: reads `sessionCartId` cookie +
      `auth()` session
- [ ] Add `getMyCart()`: finds cart by `userId` or `sessionCartId`, converts Decimal
      fields to strings via `convertToPlainObject`

### Step 4.5 — Price calc, add to database (05-06)
- [ ] Add `round2()` to `lib/utils.ts`
- [ ] Add `calcPrice(items)` to `cart.actions.ts`: `itemsPrice`, `shippingPrice`
      ($10 if ≤$100 else free), `taxPrice` (15%), `totalPrice`
- [ ] `addItemToCart` creates a new `Cart` row via `insertCartSchema.parse` +
      `prisma.cart.create`, then `revalidatePath`

### Step 4.6 — Handle quantity / multiple items (05-07)
- [ ] Add the "existing cart" branch to `addItemToCart`: find existing item, check
      stock, increment qty or push new item, `prisma.cart.update` with recalculated
      prices

### Step 4.7 — Remove-from-cart action (05-08)
- [ ] Add `removeItemFromCart(productId)` to `cart.actions.ts`: decrements qty or
      removes the item, updates DB, revalidates

### Step 4.8 — Dynamic cart button (05-09)
- [ ] Pass `cart` (from `getMyCart()`) into `<AddToCart>` on the product details page
- [ ] `add-to-cart.tsx`: accept `cart` prop, compute `existItem`, render +/- qty
      buttons vs. a plain "Add to cart" button; import `removeItemFromCart`

### Step 4.9 — useTransition hook (05-10)
- [ ] Wrap `handleAddToCart`/`handleRemoveFromCart` in `useTransition`'s
      `startTransition`
- [ ] Disable buttons and show a spinning `Loader` icon while `isPending`

**Checkpoint:** guests and logged-in users can add/remove/adjust cart items, persisted
server-side.

---

## Phase 5 — Cart & Shipping Pages (docs §06)

### Step 5.1 — Cart page (06-02)
- [ ] Create `app/(root)/cart/page.tsx`: fetches `getMyCart()`
- [ ] Create `app/(root)/cart/cart-table.tsx`: client component, empty-cart message vs.
      grid layout, `useTransition`/`useToast`/`useRouter`

### Step 5.2 — ShadCN table (06-03)
- [ ] `npx shadcn@latest add table`
- [ ] Build `<CartTable>` with `Table`/`TableHeader`/`TableBody`: item image+name cell,
      qty +/- cell (reusing `addItemToCart`/`removeItemFromCart` with
      `startTransition` + loader), price cell

### Step 5.3 — Subtotal card (06-04)
- [ ] Add `formatCurrency()` to `lib/utils.ts` (via `Intl.NumberFormat`)
- [ ] Add a subtotal `Card` to `<CartTable>` (total qty via `reduce`) +
      "Proceed to Checkout" button routing to `/shipping-address`

### Step 5.4 — Shipping address page (06-05)
- [ ] Add `shippingAddressSchema` (Zod) to `lib/validator.ts`
- [ ] Add `ShippingAddress` type to `types/index.ts`
- [ ] Add `shippingAddressDefaultValues` constant
- [ ] Create `app/(root)/shipping-address/page.tsx`: redirects to `/cart` if empty,
      requires session, fetches user via new `getUserById(userId)` in
      `user.actions.ts`

### Step 5.5 — Shipping address form (06-06)
- [ ] `npm install react-hook-form @hookform/resolvers`
- [ ] `npx shadcn@latest add form`
- [ ] Create `app/(root)/shipping-address/shipping-address-form.tsx`: client,
      `useForm` + `zodResolver(shippingAddressSchema)`, `FormField`/`FormItem`/
      `FormControl`/`FormMessage` for fullName/streetAddress/city/country/postalCode,
      submit button with `useTransition` loader

### Step 5.6 — Update user address (06-07)
- [ ] Add `updateUserAddress(data: ShippingAddress)` to `user.actions.ts`
      (parses + `prisma.user.update` on the `address` Json field)
- [ ] Wire form `onSubmit` via `SubmitHandler`, redirect to `/payment-method` on
      success

### Step 5.7 — Checkout steps component (06-08)
- [ ] Create `components/shared/checkout-steps.tsx`: steps (User Login / Shipping
      Address / Payment Method / Place Order), `current` prop highlights active step
- [ ] Embed with `current={1}` in the shipping address form

### Step 5.8 — Persist session cart (06-09)
- [ ] Extend `auth.ts`'s `jwt` callback: on `trigger === 'signIn' | 'signUp'`, read
      the `sessionCartId` cookie, find the guest cart, delete any existing user cart,
      reassign the guest cart's `userId` to the logged-in user (overwrite strategy,
      not merge)

### Step 5.9 — Protecting paths (06-10)
- [ ] Add a `protectedPaths` regex array to the `authorized` callback in `auth.ts`:
      `/shipping-address`, `/payment-method`, `/place-order`, `/profile`, `/user/*`,
      `/order/*`, `/admin`
- [ ] Return `false` (redirect to sign-in) if an unauthenticated user hits a
      protected path

**Checkpoint:** full cart → shipping-address flow works and is route-protected.

---

## Phase 6 — Payment Method & Orders (docs §07)

### Step 6.1 — Payment method action & schema (07-02)
- [ ] Add `PAYMENT_METHODS`/`DEFAULT_PAYMENT_METHOD` env vars + exports in
      `lib/constants/index.ts`
- [ ] Add `paymentMethodSchema` to `lib/validator.ts`
- [ ] Add `updateUserPaymentMethod` action to `user.actions.ts`

### Step 6.2 — Payment method page (07-03)
- [ ] Create `app/(root)/payment-method/page.tsx`: server component, fetches user via
      `getUserById`
- [ ] Create `app/(root)/payment-method/payment-method-form.tsx`: client shell with
      react-hook-form initialization

### Step 6.3 — Payment method form & submission (07-04)
- [ ] `npx shadcn@latest add radio-group`
- [ ] Build out the full form UI; `onSubmit` calls `updateUserPaymentMethod`,
      redirects to `/place-order`

### Step 6.4 — Order/OrderItem Prisma models (07-05)
- [ ] Add `Order` model to `prisma/schema.prisma`: uuid id, `shippingAddress`/
      `paymentResult` as `Json`, prices as `Decimal`, `isPaid`/`isDelivered` flags
- [ ] Add `OrderItem` model: composite PK `orderId` + `productId`
- [ ] Add relations to `User`/`Product`
- [ ] `npx prisma migrate dev --name add-order` + `npx prisma generate`

### Step 6.5 — Order Zod schemas & types (07-06)
- [ ] Add `insertOrderSchema`, `insertOrderItemSchema` to `lib/validator.ts`
- [ ] Add `Order`/`OrderItem` types to `types/index.ts`

### Step 6.6 — Place order page (07-07)
- [ ] Create `app/(root)/place-order/page.tsx`: full order review UI (address /
      payment / items cards + price summary); redirect if cart empty / no address /
      no payment method

### Step 6.7 — Create order action (07-08)
- [ ] Add `createOrder` to `lib/actions/order.actions.ts`: validates via
      `insertOrderSchema`, uses `prisma.$transaction` to create the Order + OrderItems
      and clear the cart; returns `redirectTo`

### Step 6.8 — Place order form (07-09)
- [ ] Create `app/(root)/place-order/place-order-form.tsx`: client form wrapping a
      `PlaceOrderButton` (`useFormStatus`), calls `createOrder`, redirects via
      `res.redirectTo`

### Step 6.9 — Order details page (07-10)
- [ ] Add `getOrderById` to `order.actions.ts`
- [ ] Create `app/(root)/order/[id]/page.tsx`: server component, `notFound()` if
      missing

### Step 6.10 — Format utility functions (07-11)
- [ ] Add `formatId` (shorten uuid) and `formatDateTime`
      (dateTime/dateOnly/timeOnly via `Intl.DateTimeFormatOptions`) to `lib/utils.ts`

### Step 6.11 — Order details table (07-12)
- [ ] Create `app/(root)/order/[id]/order-details-table.tsx`: payment method/status,
      shipping address/delivery status, order items table, order summary — using
      `Badge`, `Card`, `Table`

**Checkpoint:** full checkout flow from cart to a created order with a details page.

---

## Phase 7 — PayPal Payments (docs §08)

*Requires a PayPal Developer sandbox account — confirm with user before starting.*

### Step 7.1 — PayPal sandbox setup (08-02)
- [ ] Create PayPal Developer sandbox business + personal test accounts
- [ ] Create a sandbox App, get Client ID / Secret
- [ ] Add `PAYPAL_API_URL`, `PAYPAL_CLIENT_ID`, `PAYPAL_APP_SECRET` to `.env`

### Step 7.2 — Generate access token (08-03)
- [ ] Create `lib/paypal.ts`: `base` URL constant, `generateAccessToken()` (Basic-auth
      POST to `/v1/oauth2/token`), `handleResponse()` helper

### Step 7.3 — Test generateToken with Jest (08-04)
- [ ] Install Jest/testing deps (`jest`, `ts-jest`, `ts-node`, `@types/jest`, `dotenv`)
- [ ] Set up `jest.config.ts` (`ts-jest` preset), `package.json` test scripts,
      `jest.setup.ts`
- [ ] Create `tests/paypal.test.ts` testing `generateAccessToken`

### Step 7.4 — Create order & capture requests (08-05)
- [ ] Add `paypal.createOrder(price)` and `paypal.capturePayment(orderId)` methods to
      the `paypal` object in `lib/paypal.ts`

### Step 7.5 — Test create order / capture with Jest (08-06)
- [ ] Add tests for `createOrder` (real sandbox call) and `capturePayment` (mocked via
      `jest.spyOn`) to `tests/paypal.test.ts`

### Step 7.6 — Create PayPal order action & schema (08-07)
- [ ] Add `paymentResultSchema` to `lib/validator.ts`
- [ ] Add `PaymentResult` type to `types/index.ts`
- [ ] Add `createPayPalOrder(orderId)` to `order.actions.ts`: creates the PayPal
      order, stores a `paymentResult` placeholder on the Order

### Step 7.7 — Approve and update actions (08-08)
- [ ] Add `approvePayPalOrder(orderId, data)` to `order.actions.ts`: calls
      `paypal.capturePayment`, validates status
- [ ] Add internal `updateOrderToPaid({orderId, paymentResult})`: transaction that
      decrements product stock and sets `isPaid`/`paidAt`

### Step 7.8 — Implement PayPal button (08-09)
- [ ] `npm install @paypal/react-paypal-js`
- [ ] Update `order-details-table.tsx`: `PayPalScriptProvider`/`PayPalButtons`/
      `usePayPalScriptReducer`, `handleCreatePayPalOrder`/`handleApprovePayPalOrder`
- [ ] Pass `paypalClientId` prop from `app/(root)/order/[id]/page.tsx`

**Checkpoint:** PayPal sandbox checkout marks an order paid end-to-end.

---

## Phase 8 — Order History & User Profiles (docs §09)

### Step 8.1 — User layout & menu (09-02)
- [ ] Create `app/user/layout.tsx`: custom header/layout for the user area
- [ ] Create stub `app/user/orders/page.tsx`
- [ ] Create `app/user/main-nav.tsx`: client nav (Profile/Orders links)
- [ ] Add links to `<UserButton>` dropdown

### Step 8.2 — Get my orders action (09-03)
- [ ] Add `PAGE_SIZE` constant to `lib/constants/index.ts`
- [ ] Add `getMyOrders({limit, page})` to `order.actions.ts` (session-scoped,
      paginated)

### Step 8.3 — User orders page (09-04)
- [ ] Build out `app/user/orders/page.tsx`: table of orders (id/date/total/paid/
      delivered/actions) using `getMyOrders`

### Step 8.4 — Orders pagination (09-05)
- [ ] `npm install query-string`
- [ ] Create reusable `components/shared/pagination.tsx` (Previous/Next, `useRouter`/
      `useSearchParams`)
- [ ] Add `formUrlQuery()` to `lib/utils.ts`
- [ ] Wire pagination into the orders page

### Step 8.5 — Update user profile action (09-06)
- [ ] Add `updateProfileSchema` to `lib/validator.ts`
- [ ] Add `updateProfile(user)` to `user.actions.ts`

### Step 8.6 — User profile form (09-07)
- [ ] Create `app/user/profile/page.tsx`: wrapped in `SessionProvider` from
      `next-auth/react`
- [ ] Create `app/user/profile/profile-form.tsx`: react-hook-form, email disabled,
      name editable

### Step 8.7 — Form submission (09-08)
- [ ] Wire `onSubmit` in the profile form to call `updateProfile`
- [ ] Update client session via `update()` after a successful save
- [ ] Confirm `auth.ts`'s `jwt` callback syncs `token.name` on `trigger === 'update'`
      (added in Step 3.14)

**Checkpoint:** users can view paginated order history and edit their profile.

---

## Phase 9 — Admin Overview & Orders (docs §10)

### Step 9.1 — Admin layout & menu (10-02)
- [ ] Create `app/admin/layout.tsx`
- [ ] Create stub `app/admin/overview/page.tsx`
- [ ] Add an admin link to `user-button.tsx` (shown when `role === 'admin'`)
- [ ] Create `types/next-auth.d.ts`: extend session `user.role`
- [ ] Create `app/admin/main-nav.tsx`: Overview/Products/Orders/Users links

### Step 9.2 — Get order summary (10-03)
- [ ] Add `getOrderSummary()` to `order.actions.ts`: order/product/user counts,
      `totalSales` aggregate, monthly `salesData` via `prisma.$queryRaw`, 6 most
      recent `latestOrders`

### Step 9.3 — Admin overview data display (10-04)
- [ ] Add `formatNumber` to `lib/utils.ts`
- [ ] Build out `app/admin/overview/page.tsx`: stat `Card`s (revenue/sales/customers/
      products) + recent sales table
- [ ] Add an inline admin-role guard (throws if not admin) as an interim measure
      before Step 9.4's proper guard

### Step 9.4 — Protecting admin routes (10-05, + standalone `admin-route-guard.md`)
- [ ] Create `lib/auth-guard.ts`: `requireAdmin()` — calls `auth()`, redirects to
      `/unauthorized` if `session.user.role !== 'admin'`, else returns session
- [ ] Create `app/unauthorized/page.tsx`
- [ ] Add `await requireAdmin();` at the top of every admin page as it's created
      (not the shared layout — client-side nav between admin pages won't re-run a
      layout-level check): `app/admin/overview/page.tsx`, `app/admin/orders/page.tsx`,
      and (later) `app/admin/products/page.tsx`, `app/admin/products/[id]/page.tsx`,
      `app/admin/products/create/page.tsx`, `app/admin/users/page.tsx`,
      `app/admin/users/[id]/page.tsx` — make each page `async` if it isn't already

### Step 9.5 — Monthly sales chart (10-06)
- [ ] `npm install recharts`
- [ ] Create `app/admin/overview/charts.tsx`: `BarChart`/`ResponsiveContainer`/
      `XAxis`/`YAxis`/`Bar`
- [ ] Embed into the overview page

### Step 9.6 — Admin orders page & action (10-07)
- [ ] Add `getAllOrders({limit, page})` to `order.actions.ts`
- [ ] Create `app/admin/orders/page.tsx`: paginated admin orders table
- [ ] Apply `requireAdmin()` (Step 9.4)

### Step 9.7 — Delete order (10-08)
- [ ] Add `deleteOrder(id)` to `order.actions.ts`
- [ ] `npx shadcn@latest add dialog alert-dialog`
- [ ] Create reusable `components/shared/delete-dialog.tsx` (generic `id`/`action`
      props, `AlertDialog`); use it on the orders page

### Step 9.8 — Update orders action (COD) (10-09)
- [ ] Add `updateOrderToPaidByCOD(orderId)` and `deliverOrder(orderId)` to
      `order.actions.ts`

### Step 9.9 — Update orders buttons (COD) (10-10)
- [ ] `app/(root)/order/[id]/page.tsx` passes an `isAdmin` prop (from session role)
- [ ] `order-details-table.tsx` gets admin-only `MarkAsPaidButton`/
      `MarkAsDeliveredButton` (COD-specific) calling the Step 9.8 actions

**Checkpoint:** admin dashboard shows real metrics; admin can manage order status.

---

## Phase 10 — Admin Products & Images (docs §11)

*Requires an Uploadthing account — confirm with user before Step 10.6.*

### Step 10.1 — Get products for admin (11-02)
- [ ] Create stub `app/admin/products/page.tsx` (`searchParams`: page/query/category);
      apply `requireAdmin()`
- [ ] Add `getAllProducts({query, limit, page, category})` to `product.actions.ts`
      (paginated; filter params accepted but not yet used in the query)

### Step 10.2 — Display products (11-03)
- [ ] Build out the products page: `Table` listing id/name/price/category/stock/
      rating + Edit link + "Create Product" button → `/admin/products/create`
- [ ] Reuse `<Pagination>`

### Step 10.3 — Delete products (11-04)
- [ ] Add `deleteProduct(id)` to `product.actions.ts`
- [ ] Reuse `<DeleteDialog>` on the products page

### Step 10.4 — Create/update product actions (11-05)
- [ ] Add `updateProductSchema` (extends `insertProductSchema` + `id`) to
      `lib/validator.ts`
- [ ] Add `productDefaultValues` constant to `lib/constants/index.ts`
- [ ] Add `createProduct(data)` and `updateProduct(data)` to `product.actions.ts`

### Step 10.5 — Create product page & form (11-06)
- [ ] Create `app/admin/products/create/page.tsx`; apply `requireAdmin()`
- [ ] Create `components/shared/admin/product-form.tsx`: client, react-hook-form
      scaffold with `type: 'Create' | 'Update'` prop, conditional `zodResolver`

### Step 10.6 — Form fields & slugify (11-07)
- [ ] `npm install slugify`
- [ ] Add Name/Slug fields ("Generate" button using `slugify`), Category/Brand,
      Price/Stock, Description to `product-form.tsx`
- [ ] `npx shadcn@latest add textarea`

### Step 10.7 — Create product handler (11-08)
- [ ] Wire `onSubmit` in `product-form.tsx` to call `createProduct`/`updateProduct`
      based on `type`
- [ ] Temporarily comment out `images`/`isFeatured`/`banner` in `insertProductSchema`
      so the form can submit before image upload exists

### Step 10.8 — Uploadthing configuration (11-09)
- [ ] Create an Uploadthing account/app; get keys — **confirm with user first**
- [ ] Add `UPLOADTHING_TOKEN`, `UPLOADTHING_SECRET`, `UPLOADTHING_APPID` to `.env`
- [ ] `npm install uploadthing @uploadthing/react`
- [ ] Create `app/api/uploadthing/core.ts`: `ourFileRouter`, auth middleware
- [ ] Create `app/api/uploadthing/route.ts`: `GET`/`POST` handlers
- [ ] Create `lib/uploadthing.ts`: `UploadButton`/`UploadDropzone`
- [ ] Add `utfs.io` to `next.config`'s `images.remotePatterns`

### Step 10.9 — Add image uploads (11-10)
- [ ] Uncomment the `images` field in `insertProductSchema`
- [ ] Add image preview grid + `UploadButton` (`endpoint='imageUploader'`) to
      `product-form.tsx`
- [ ] Add a CSS override in `assets/styles/globals.css` for upload-button text color
      (`.upload-field`)

### Step 10.10 — Product cleanup (11-11)
- [ ] Re-seed products with real Uploadthing image URLs (content-only, no new code
      files)

### Step 10.11 — isFeatured and banner (11-12)
- [ ] Uncomment `isFeatured`/`banner` in `insertProductSchema`
- [ ] Add a Featured checkbox + conditional banner `UploadButton`/preview to
      `product-form.tsx`

### Step 10.12 — Update product form (11-13)
- [ ] Add `getProductById(productId)` to `product.actions.ts`
- [ ] Create `app/admin/products/[id]/page.tsx`: Update mode, `notFound()` if missing,
      renders `<ProductForm type='Update'>`; apply `requireAdmin()`

**Checkpoint:** admin can fully create/edit/delete products with image uploads.

---

## Phase 11 — Admin Users & Search (docs §12)

### Step 11.1 — Get and display users (12-02)
- [ ] Add `getAllUsers({limit, page})` to `user.actions.ts`
- [ ] Create `app/admin/users/page.tsx`: paginated table (id/name/email/role/actions,
      Edit link); apply `requireAdmin()`

### Step 11.2 — Delete users (12-03)
- [ ] Add `deleteUser(id)` to `user.actions.ts`
- [ ] Reuse `<DeleteDialog>` on the users page

### Step 11.3 — Edit user page (12-04)
- [ ] Add `updateUserSchema` (extends `updateProfileSchema` + `id`/`name`/`role`) to
      `lib/validator.ts`
- [ ] Add `USER_ROLES` constant to `lib/constants/index.ts` (env var
      `USER_ROLES=admin, user`)
- [ ] `npx shadcn@latest add select`
- [ ] Create `app/admin/users/[id]/page.tsx`: fetches via `getUserById`, `notFound()`
      if missing; apply `requireAdmin()`

### Step 11.4 — Edit user form (12-05)
- [ ] Create `app/admin/users/[id]/update-user-form.tsx`: react-hook-form with
      `updateUserSchema`; Email (disabled), Name, Role (`Select` from `USER_ROLES`)

### Step 11.5 — Update user action (12-06)
- [ ] Add `updateUser(user)` to `user.actions.ts`
- [ ] Wire `onSubmit` in `update-user-form.tsx`

### Step 11.6 — Admin search form (12-07)
- [ ] Create `components/shared/admin/admin-search.tsx`: client, form GETs to a
      path-dependent URL (products/orders/users) based on `usePathname`
- [ ] Replace the plain `Input` in `app/admin/layout.tsx` with it
- [ ] Add "Remove Filter" UI to the products page

### Step 11.7 — Orders search (12-08)
- [ ] Extend `getAllOrders` with a `query` param + Prisma `queryFilter`
      (case-insensitive `contains` on user name)
- [ ] `app/admin/orders/page.tsx` reads the `query` searchParam, shows "Filtered by" +
      Remove Filter UI

### Step 11.8 — Users search (12-09)
- [ ] Apply the same pattern to `getAllUsers` and `app/admin/users/page.tsx`

**Checkpoint:** admin can search/filter/manage users and see the search pattern
reused across products/orders/users.

---

## Phase 12 — Search, Filtering, Drawer & Carousel (docs §13)

### Step 12.1 — Category drawer (13-02)
- [ ] Add `getAllCategories()` to `product.actions.ts` (Prisma `groupBy` on
      `category`)
- [ ] `npx shadcn@latest add drawer`
- [ ] Create `components/shared/header/categories-drawer.tsx`: left-side `Drawer`
      listing categories → links to `/search?category=X`
- [ ] Wire into `components/shared/header/index.tsx`

### Step 12.2 — Featured products carousel (13-03)
- [ ] `npx shadcn@latest add carousel`
- [ ] `npm install embla-carousel-autoplay`
- [ ] Add `getFeaturedProducts()` to `product.actions.ts` (`findMany` where
      `isFeatured: true`, take 4)
- [ ] Create `components/shared/product/product-carousel.tsx`: Embla autoplay
      carousel
- [ ] Render conditionally in `app/(root)/page.tsx`, above `<ProductList>`

### Step 12.3 — Search component (13-04)
- [ ] Create `components/shared/header/search.tsx`: form GET to `/search`, category
      `Select` + text `Input`, using `getAllCategories`
- [ ] Embed in header and mobile menu
- [ ] Create placeholder `app/(root)/search/page.tsx`

### Step 12.4 — Search page (13-05)
- [ ] Build out `SearchPage`: reads `searchParams` (q, category, price, rating, sort,
      page)
- [ ] Extend `getAllProducts()` signature with category/price/rating/sort
- [ ] Render `<ProductCard>` grid + `<Pagination>`
- [ ] Create `components/view-all-products-button.tsx` used on the homepage

### Step 12.5 — Search filters (13-06)
- [ ] Implement filter logic in `getAllProducts()`: `queryFilter` (name `contains`,
      case-insensitive), `categoryFilter`, `priceFilter` (`gte`/`lte` from a price
      range string), `ratingFilter` (`gte`); merge into the `findMany` `where`

### Step 12.6 — Get filter URL function (13-07)
- [ ] Add `getFilterUrl({c, s, p, r, pg})` helper to the search page: builds
      `/search?...` query strings from current filter state

### Step 12.7 — Category/price filter links (13-08)
- [ ] Add category link list and a `prices` array + price filter links to the
      filter-links column, using `getFilterUrl`

### Step 12.8 — Rating/query filter links (13-09)
- [ ] Add `ratings = [4, 3, 2, 1]` links
- [ ] Add active-filter summary text (query/category/price/rating) + "Clear"
      link/button

### Step 12.9 — Add sorting (13-10)
- [ ] Add `orderBy` logic to `getAllProducts()`: lowest/highest price, rating desc,
      else `createdAt` desc
- [ ] Add `sortOrders` array + sort links (`getFilterUrl({s})`)

### Step 12.10 — Dynamic metadata (13-11)
- [ ] Add `generateMetadata()` to the search page: builds a dynamic `<title>` from
      q/category/price/rating search params

**Checkpoint:** full search/filter/sort experience on `/search`, plus homepage
carousel and category drawer.

---

## Phase 13 — Ratings and Reviews (docs §14)

### Step 13.1 — Review Prisma model & Zod type (14-02)
- [ ] Add `Review` model to `prisma/schema.prisma`: `userId`, `productId`, `rating`,
      `title`, `description`, `isVerifiedPurchase`, `createdAt`; relations to
      `User`/`Product` with `onDelete: Cascade`
- [ ] Add `Review Review[]` to `User` and `Product` models
- [ ] `npx prisma migrate dev --name add-review` + `npx prisma generate`
- [ ] Add `insertReviewSchema` to `lib/validator.ts`
- [ ] Add `Review` type to `types/index.ts`
- [ ] Add `reviewFormDefaultValues` to `lib/constants/index.ts`

### Step 13.2 — Review list component (14-03)
- [ ] Create `app/(root)/product/[slug]/review-list.tsx` (`'use client'`): takes
      `userId`/`productId`/`productSlug`, local `reviews` state, sign-in-to-review
      link
- [ ] Wire into the product details page: get `session`/`userId` via `auth()`, render
      `<ReviewList>` in a new "Customer Reviews" section

### Step 13.3 — Display review form dialog (14-04)
- [ ] Create `app/(root)/product/[slug]/review-form.tsx`: ShadCN `Dialog` +
      react-hook-form / `zodResolver(insertReviewSchema)` (title, description,
      rating `Select` 1–5)
- [ ] Embed into `review-list.tsx`

### Step 13.4 — Create/update review action (14-05)
- [ ] Create `lib/actions/review.actions.ts`: `createUpdateReview()` — validates via
      `insertReviewSchema`, upserts (create or update) inside `prisma.$transaction`,
      recomputes product `rating` (avg) and `numReviews`, `revalidatePath` the
      product page

### Step 13.5 — Connect review form to action (14-06)
- [ ] Wire `review-form.tsx` `onSubmit` to `createUpdateReview`, toast feedback
- [ ] `handleOpenForm` sets `productId`/`userId` on the form
- [ ] Pass an `onReviewSubmitted` (`reload`) callback from `review-list.tsx`

### Step 13.6 — Get reviews action (14-07)
- [ ] Add `getReviews({productId})` (list with user name, desc order) and
      `getReviewByProductId({productId})` (current user's review) to
      `review.actions.ts`

### Step 13.7 — Display reviews (14-08)
- [ ] `review-list.tsx` fetches reviews via `useEffect` + `getReviews`; renders a
      `Card` list per review
- [ ] Create `components/shared/product/rating.tsx`: SVG star component
      (full/half/empty); use in review list, product details page, and
      `product-card.tsx`

### Step 13.8 — Update and reload reviews (14-09)
- [ ] `review-form.tsx`'s `handleOpenForm` pre-fills via `getReviewByProductId`
      (edit-existing-review)
- [ ] `review-list.tsx`'s `reload()` re-fetches via `getReviews` + toast on error

**Checkpoint:** signed-in users can leave/edit reviews; product rating updates live.

---

## Phase 14 — Stripe Payments (docs §15)

*Requires a Stripe account (test mode) — confirm with user before starting. The
webhook step (14.4) requires a deployed URL, not localhost.*

### Step 14.1 — Stripe setup (15-02)
- [ ] Create a Stripe account (test mode) — **confirm with user first**
- [ ] Add `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to `.env`
- [ ] `npm install stripe @stripe/stripe-js @stripe/react-stripe-js`

### Step 14.2 — Order form payment intent (15-03)
- [ ] In `app/(root)/order/[id]/page.tsx`: create a Stripe `paymentIntents.create()`
      (amount in cents, `metadata.orderId`) when `paymentMethod === 'Stripe' &&
      !isPaid`; get `client_secret`
- [ ] Pass `stripeClientSecret` prop into `order-details-table.tsx`
- [ ] Create placeholder `app/(root)/order/[id]/stripe-payment.tsx`

### Step 14.3 — Stripe payment component (15-04)
- [ ] Build out `stripe-payment.tsx`: `loadStripe` (from `@stripe/stripe-js/pure`) +
      `useTheme` (next-themes) for light/dark Stripe appearance
- [ ] Nested `StripeForm`: `useStripe`/`useElements`, `PaymentElement`,
      `LinkAuthenticationElement`
- [ ] `handleSubmit` calls `stripe.confirmPayment` with `return_url` →
      `/order/[id]/stripe-payment-success`
- [ ] Outer component wraps in `<Elements>`
- [ ] Test with card `4242 4242 4242 4242`

### Step 14.4 — Payment success page (15-05)
- [ ] Create `app/(root)/order/[id]/stripe-payment-success/page.tsx`: retrieve order
      + `stripe.paymentIntents.retrieve(paymentIntentId)`, validate
      `metadata.orderId` matches, check `status === 'succeeded'`, show thank-you page
      or redirect back to the order

### Step 14.5 — Webhook for payment (15-06)
- [ ] Create `app/api/webhooks/stripe/route.ts`: POST handler,
      `stripe.webhooks.constructEvent(rawBody, signatureHeader,
      STRIPE_WEBHOOK_SECRET)`; on `charge.succeeded` call `updateOrderToPaid()` with
      `orderId` from metadata
- [ ] **Confirm with user, then** register the webhook in the Stripe Dashboard
      pointing at the deployed `/api/webhooks/stripe` URL (does not work on
      localhost)
- [ ] Add `STRIPE_WEBHOOK_SECRET` to Vercel env vars

**Checkpoint:** Stripe test-mode checkout marks an order paid via webhook on production.

---

## Phase 15 — Email Order Receipt (docs §16)

*Requires a Resend account — confirm with user before starting.*

### Step 15.1 — Resend account & API key (16-02)
- [ ] Create a Resend account — **confirm with user first**
- [ ] Add `RESEND_API_KEY` and `SENDER_EMAIL` (e.g. `onboarding@resend.dev`) to
      `.env` and Vercel
- [ ] `npm install resend react-email @react-email/components`

### Step 15.2 — Resend main function (16-03)
- [ ] Create root-level `email/index.tsx`: `sendPurchaseReceipt({order})` using
      `new Resend(RESEND_API_KEY)` and `resend.emails.send()`
- [ ] Create `email/purchase-receipt.tsx` skeleton (imports `@react-email/components`,
      `Order` type, `db/sample-data`, `dotenv` config since this runs outside `app/`)

### Step 15.3 — Receipt email template (16-04)
- [ ] Build `PurchaseReceiptEmail` in `email/purchase-receipt.tsx`: `Html`/
      `Tailwind`/`Container`/`Section`/`Row`/`Column` layout — order ID, purchase
      date, price paid, line items (image/name/qty/price), items/tax/shipping/total
      breakdown via `formatCurrency`

### Step 15.4 — Preview email in browser (16-05)
- [ ] Add `PurchaseReceiptEmail.PreviewProps` using `sampleData`
- [ ] Add `paymentResult: PaymentResult` to the `Order` type
- [ ] Update `OrderDetailsTable` prop type to `Omit<Order, 'paymentResult'>`
- [ ] Add an `"email"` npm script (`cp .env ./node_modules/react-email && email dev
      --dir email --port 3001`)
- [ ] Run `npm run email` → preview at `localhost:3001`

### Step 15.5 — Send email (16-06)
- [ ] In `updateOrderToPaid()` (Phase 7/9's order actions), fetch the updated order
      (with `orderItems`, `user{name,email}`) at the end and call
      `sendPurchaseReceipt({order: {...}})`, casting `shippingAddress`/`paymentResult`

**Checkpoint:** a paid order triggers a receipt email (previewable locally, sent via Resend).

---

## Phase 16 — Homepage Components & Wrap-up (docs §17)

### Step 16.1 — Icon boxes component (17-02)
- [ ] Create `components/icon-boxes.tsx`: static `Card` grid (Free Shipping, Money
      Back Guarantee, Flexible Payment, 24/7 Support) using lucide icons
- [ ] Add to `app/(root)/page.tsx`

### Step 16.2 — Deal countdown component (17-03)
- [ ] Create `components/deal-countdown.tsx` (`'use client'`): `TARGET_DATE`
      constant, `calculateTimeRemaining()`, `useEffect` + `setInterval` ticking every
      second, `StatBox` subcomponent, "deal ended" fallback UI using
      `resources/images/promo.jpg` → `/images/promo.jpg`
- [ ] Add `<DealCountdown />` to `app/(root)/page.tsx`

### Step 16.3 — Final homepage review (17-04)
- [ ] Review section order/spacing: IconBoxes / Carousel / ProductList /
      DealCountdown / ViewAllProductsButton
- [ ] No code required — course wrap-up notes only (future ideas: Google login,
      magic-link auth — out of scope unless requested)

**Checkpoint:** homepage matches the finished course design.

---

## Phase 17 — Notes & Bug Fixes (docs §18)

### Step 17.1 — Vercel Hobby-tier Edge Function fix (18-01)
- [ ] Create `auth.config.ts` (root): exports `authConfig` (`NextAuthConfig`) —
      `providers: []`, `callbacks.authorized()` with the `protectedPaths` regex logic
      from Step 5.9, plus `sessionCartId` cookie generation from Step 4.3
- [ ] Edit `auth.ts`: remove `NextAuthConfig`/`NextResponse` imports, import
      `authConfig` from `./auth.config`, spread `...authConfig.callbacks` instead of
      defining `authorized` inline, remove `satisfies NextAuthConfig`, set
      `session.strategy: 'jwt' as const`
- [ ] Edit `proxy.ts` **(renamed from `middleware.ts` in Next.js 16 — see Phase 0)**:
      `export const { auth: proxy } = NextAuth(authConfig);` (lightweight config only,
      not the full `auth.ts` with providers/adapter)
- [ ] **Apply this before final deploy** if targeting Vercel's Hobby tier — the
      unsplit `auth.ts` proxy/edge bundle exceeds the 1MB Edge Function limit

**Checkpoint:** middleware bundle stays under the 1MB Hobby-tier Edge Function limit.

---

## Notes

- Each phase assumes the prior phases are merged/working — don't jump ahead.
- Anything requiring a third-party account (PayPal, Uploadthing, Stripe, Resend, Vercel
  Postgres) needs the user to provision credentials first; ask before starting that phase.
- Deploys, pushes, and any destructive DB operations (migrations that drop data) should
  be confirmed with the user before running.
- See `docs/00-build-map.md` for the condensed reference index, and the individual
  `docs/NN-section-name/*.md` lesson files for full explanations behind each step above.
