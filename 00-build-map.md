# Build Map — Reference Index

This is a condensed map of the entire course build, generated from `docs/` (18 lesson
sections, ~140 files) and `resources/` (assets copied into the project as the course
progresses). Use it as a table of contents while implementing: find the section for
the feature you're building, see what files it touches and what it depends on, before
opening the full lesson text.

**Current repo state:** fresh `create-next-app` scaffold only (`src/app/{layout,page}.tsx`,
`globals.css`). None of the course sections below have been implemented yet.

> Note: early lessons put app code at the project root (`app/`, `lib/`, `db/`, `email/`,
> `components/`) rather than under `src/`. Since this repo has a `src/` folder from
> `create-next-app`, decide up front whether to move `src/app` content to root (matching
> the docs exactly) or prefix every doc path below with `src/` — the docs' import alias
> `@/*` works either way as long as `tsconfig.json`'s path mapping matches.

---

## Tech stack (docs/01-introduction)

Next.js 15 (App Router) + React 19 · TypeScript · PostgreSQL (Vercel/Neon) · Prisma ORM ·
Zod · ShadCN UI (Tailwind) · NextAuth v5 (beta, credentials + JWT) · React Hook Form ·
Jest (PayPal unit tests) · React Email + Resend · Uploadthing (image uploads) ·
Lucide React (icons) · next-themes (dark mode) · Recharts (admin charts) ·
PayPal React SDK · Stripe · Slugify · Embla Carousel · Vercel (continuous deployment).

`--legacy-peer-deps` is occasionally required for React 19 compatibility with
third-party packages (noted per-section below where it applies).

---

## resources/ → project mapping

| Source | Destination | Used in |
|---|---|---|
| `resources/favicon.ico` | `app/favicon.ico` | 02-02 |
| `resources/images/logo.svg` | `public/images/logo.svg` | 02-02 |
| `resources/images/banner-1.jpg`, `banner-2.jpg` | `public/images/` | 02-09 |
| `resources/images/promo.jpg` | `public/images/promo.jpg` | 17-03 (deal countdown) |
| `resources/images/sample-products/*` | `public/images/sample-products/` | 02-09 (paired with `db/sample-data.ts`) |
| `resources/assets/loader.gif` | `assets/loader.gif` | 02-07 (`app/loading.tsx`) |
| `resources/assets/styles/globals.css` | `assets/styles/globals.css` | 02-02 (replaces default globals, adds `.wrapper`/`.flex-*`/`.h1-bold` utility classes) |
| `resources/prisma.ts` | `db/prisma.ts` | 03-07 (final serverless Prisma client: Neon adapter + WebSocket pool + `.$extends()` stringifying `price`/`rating` Decimals) — this is the **finished** version of what 03-07 has you hand-build |

---

## Cross-cutting architecture conventions

Established early and reused for the rest of the course — check these locations first
when adding any new feature:

- **Server actions**: `lib/actions/{product,user,cart,order,review}.actions.ts`, all `'use server'`.
- **Validation**: all Zod schemas centralized in `lib/validator.ts` (sometimes referenced as `validators.ts`).
- **Types**: `types/index.ts`, mostly `z.infer<typeof someSchema>` plus extra fields.
- **Constants**: `lib/constants/index.ts` (env-derived: `APP_NAME`, `PAGE_SIZE`, `PAYMENT_METHODS`, `USER_ROLES`, etc.).
- **DB client**: `db/prisma.ts` (Neon serverless adapter, see table above).
- **Reusable UI**: `components/shared/pagination.tsx` (09-05), `components/shared/delete-dialog.tsx` (10-08), `components/shared/checkout-steps.tsx` (06-08) — all built once and reused across later admin/user sections.
- **Admin route protection**: `lib/auth-guard.ts` → `requireAdmin()` (10-05 / standalone `admin-route-guard.md`) must be called at the top of **every** admin page, not the shared admin layout (client-side nav between admin pages won't re-run a layout-level check).
- **Cart identity**: guest carts tracked via `sessionCartId` cookie set in the NextAuth `authorized` callback (05-04); merged into the user's account on login by overwriting (not merging) in the `jwt` callback (06-09).

---

## Cumulative environment variables

Roughly in the order they're introduced — keep `.env` (local, gitignored) and Vercel
project env vars in sync as you go:

- `SERVER_URL` — 02-04
- `DATABASE_URL` (from Vercel Postgres/Neon `POSTGRES_PRISMA_URL`) — 03-02
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXTAUTH_URL_INTERNAL` — 04-04
- `PAYMENT_METHODS`, `DEFAULT_PAYMENT_METHOD` — 07-02
- `PAYPAL_API_URL`, `PAYPAL_CLIENT_ID`, `PAYPAL_APP_SECRET` — 08-02
- `PAGE_SIZE` — 09-03
- `USER_ROLES` — 12-04
- `UPLOADTHING_TOKEN`, `UPLOADTHING_SECRET`, `UPLOADTHING_APPID` — 11-09
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — 15-02
- `STRIPE_WEBHOOK_SECRET` — 15-06 (production/Vercel only, from Stripe Dashboard)
- `RESEND_API_KEY`, `SENDER_EMAIL` — 16-02

---

## Section-by-section map

### 01 — Introduction (`docs/01-introduction`)
Orientation only, no code: stack overview, feature demo tour, dev environment setup
(Node, VS Code extensions: Prettier, ESLint, Prisma, Tailwind IntelliSense).

### 02 — App Creation & Basic Layout (`docs/02-app-creation-basic-layout.md/`)
Scaffolds the app shell.
- `02` `create-next-app` (TS/ESLint/Tailwind/App Router, no `src/`); swap font to Inter; move `globals.css` → `assets/styles/`; add logo/favicon from `resources/`; Tailwind utility classes (`.wrapper`, `.flex-*`, `.h1/h2/h3-bold`).
- `03` `shadcn@latest init` (Slate base color); test-install `button`.
- `04` `app/(root)/layout.tsx` route group; `lib/constants/index.ts`; `.env`.
- `05` `components/shared/header/index.tsx`, `components/footer.tsx`.
- `06` `next-themes` + ShadCN `dropdown-menu`; `components/shared/header/mode-toggle.tsx`; `ThemeProvider` in `app/layout.tsx`.
- `07` `app/loading.tsx` (uses `resources/assets/loader.gif`), `app/not-found.tsx`.
- `08` ShadCN `sheet`; `components/shared/header/menu.tsx` (responsive nav).
- `09` `db/sample-data.ts` + sample product images from `resources/`; `components/shared/product/product-list.tsx`; homepage wiring.
- `10` ShadCN `card`; `components/shared/product/product-card.tsx`.
- `11` `components/product/product-price.tsx`.

**Packages:** shadcn CLI (`button`, `dropdown-menu`, `sheet`, `card`), `next-themes`.

### 03 — Database, Prisma & Product Display (`docs/03-database-prisma-product-display/`)
Real database, first deploy.
- `02` Vercel Postgres (Neon) + `prisma`/`@prisma/client`; `prisma init`.
- `03` `Product` model in `prisma/schema.prisma`; `postinstall: prisma generate`; `migrate dev --name init`; intro `prisma studio`.
- `04` `db/seed.ts` (seeds from `sample-data.ts`), run via `npx tsx ./db/seed`.
- `05` `lib/utils.ts: convertToPlainObject()`; `lib/actions/product.actions.ts: getLatestProducts()`; `LATEST_PRODUCTS_LIMIT` constant.
- `06` `zod`; `lib/validator.ts` (`insertProductSchema`, `currency`); `types/index.ts` (`Product` type); `ProductCard`/`ProductList` typed.
- `07` `@neondatabase/serverless`, `@prisma/adapter-neon`, `ws`; `driverAdapters` preview feature; **`db/prisma.ts`** (matches `resources/prisma.ts`).
- `08` `getProductBySlug()`; ShadCN `badge`; `app/(root)/product/[slug]/page.tsx`.
- `09` `components/product/product-images.tsx` (thumbnail switcher).
- `10` first Vercel deploy, env vars copied to dashboard, continuous deployment on push.
- `11` guidance on ESLint/TS build-error handling (avoid `ignoreBuildErrors`).

**Packages:** `prisma`, `@prisma/client`, `zod`, `@neondatabase/serverless`, `@prisma/adapter-neon`, `ws`, `@types/ws`, `bufferutil`; ShadCN `badge`.

### 04 — Authentication with NextAuth (`docs/04-authentication-with-next-auth/`)
NextAuth v5, credentials/JWT.
- `02` `User`/`Account`/`Session`/`VerificationToken` models (Prisma adapter shape + `role`/`address`/`paymentMethod` extensions).
- `03` `bcrypt-ts-edge`; seed users (admin/user) in `sample-data.ts`/`seed.ts`.
- `04` `next-auth@5.0.0-beta.25 --legacy-peer-deps`, `@auth/prisma-adapter`; root `auth.ts` (`CredentialsProvider`, JWT strategy, `PrismaAdapter`).
- `05` `app/api/auth/[...nextauth].ts` route handlers.
- `06` `lib/actions/user.actions.ts`: `signInWithCredentials()`, `signOutUser()`.
- `07` `app/(auth)/layout.tsx`, `app/(auth)/sign-in/page.tsx`.
- `08` ShadCN `input`/`label`; `credentials-signin-form.tsx`.
- `09` wire form via `useActionState`/`useFormStatus`; redirect-if-logged-in.
- `10` `callbackUrl` redirect handling.
- `11` `components/shared/header/user-button.tsx` (session-aware dropdown, sign-out).
- `12` `signUpFormSchema`; `signUp()` action.
- `13` `app/(auth)/sign-up/{page,signup-form}.tsx`.
- `14` `lib/utils.ts: formatError()` (ZodError + Prisma P2002 handling).
- `15` `auth.ts` `jwt`/`session` callbacks customized (role, name fallback, update trigger).

**Packages:** `bcrypt-ts-edge`, `next-auth@5.0.0-beta.25` (`--legacy-peer-deps`), `@auth/prisma-adapter`; ShadCN `input`, `label`.

### 05 — Add to Cart (`docs/05-add-to-cart/`)
Server-persisted cart, guest + logged-in.
- `02` `Cart` model (`items Json[]`, price fields as `Decimal`); `cartItemSchema`/`insertCartSchema`.
- `03` ShadCN `toast`; `components/shared/product/add-to-cart.tsx`; stub `lib/actions/cart.actions.ts`.
- `04` root `middleware.ts`; `auth.ts` `authorized` callback sets `sessionCartId` cookie.
- `05` `addItemToCart()`, `getMyCart()`.
- `06` `lib/utils.ts: round2()`; `calcPrice()` (items/shipping/tax/total); cart creation.
- `07` quantity/multi-item handling in `addItemToCart`.
- `08` `removeItemFromCart()`.
- `09` dynamic +/- qty button vs. plain "Add to cart", driven by `cart` prop.
- `10` `useTransition` for pending states + spinner.

**Packages:** ShadCN `toast` only.

### 06 — Cart & Shipping Pages (`docs/06-cart-and-shipping-pages/`)
Checkout steps 1–2.
- `02` `app/(root)/cart/{page,cart-table}.tsx`.
- `03` ShadCN `table`; cart table with qty controls reusing cart actions.
- `04` `lib/utils.ts: formatCurrency()`; subtotal card + "Proceed to Checkout".
- `05` `shippingAddressSchema`; `app/(root)/shipping-address/page.tsx`; `getUserById()`.
- `06` `react-hook-form`, `@hookform/resolvers`, ShadCN `form`; `shipping-address-form.tsx`.
- `07` `updateUserAddress()` action; redirect to `/payment-method`.
- `08` `components/shared/checkout-steps.tsx`.
- `09` cart persistence across login (`jwt` callback reassigns guest cart to user).
- `10` `authorized` callback: `protectedPaths` regex list guarding shipping/payment/place-order/profile/user/order/admin routes.

**Packages:** ShadCN `table`, `form`; `react-hook-form`, `@hookform/resolvers`.

### 07 — Payment Method & Orders (`docs/07-payment-method-and-orders/`)
Checkout steps 2–4 + order models.
- `02` `paymentMethodSchema`; `updateUserPaymentMethod()`.
- `03`–`04` ShadCN `radio-group`; `app/(root)/payment-method/{page,payment-method-form}.tsx`.
- `05` `Order`/`OrderItem` Prisma models.
- `06` `insertOrderSchema`/`insertOrderItemSchema`; `Order`/`OrderItem` types.
- `07` `app/(root)/place-order/page.tsx` (review UI, guards against empty cart/missing address/payment).
- `08` `createOrder()` (transaction: order + items + clear cart).
- `09` `place-order-form.tsx` (`useFormStatus` button).
- `10` `getOrderById()`; `app/(root)/order/[id]/page.tsx`.
- `11` `lib/utils.ts: formatId()`, `formatDateTime()`.
- `12` `order-details-table.tsx` (payment/shipping/items/summary cards).

**Packages:** ShadCN `radio-group`.

### 08 — PayPal Payments (`docs/08-paypal-payments/`)
Sandbox PayPal Checkout + Jest tests.
- `02` PayPal Developer sandbox (business + personal accounts, App/Client ID/Secret).
- `03` `lib/paypal.ts: generateAccessToken()`.
- `04` Jest/`ts-jest` setup; `tests/paypal.test.ts`.
- `05` `paypal.createOrder()`, `paypal.capturePayment()`.
- `06` tests for create/capture (capture mocked via `jest.spyOn`).
- `07` `paymentResultSchema`; `createPayPalOrder()` action.
- `08` `approvePayPalOrder()`, internal `updateOrderToPaid()` (decrements stock, sets paid).
- `09` `@paypal/react-paypal-js`; `PayPalScriptProvider`/`PayPalButtons` in `order-details-table.tsx`.

**Packages:** `jest`, `ts-jest`, `ts-node`, `@types/jest`, `dotenv` (dev); `@paypal/react-paypal-js`.
**External:** PayPal Developer sandbox.

### 09 — Order History & User Profiles (`docs/09-order-history-and-user-profiles/`)
`/user` area.
- `02` `app/user/layout.tsx`, `main-nav.tsx`; links added to `user-button.tsx`.
- `03` `PAGE_SIZE` constant; `getMyOrders()`.
- `04` `app/user/orders/page.tsx` table.
- `05` `query-string`; `components/shared/pagination.tsx`; `formUrlQuery()` util — **reused throughout admin sections**.
- `06` `updateProfileSchema`; `updateProfile()`.
- `07` `app/user/profile/{page,profile-form}.tsx` (wrapped in `SessionProvider`).
- `08` client session sync via `update()`; `auth.ts` `jwt` callback handles `trigger==='update'`.

**Packages:** `query-string`.

### 10 — Admin Overview & Orders (`docs/10-admin-overview-and-orders/`)
`/admin` area foundation.
- `02` `app/admin/{layout,main-nav}.tsx`; `types/next-auth.d.ts` (session `user.role`).
- `03` `getOrderSummary()` (counts, `$queryRaw` monthly sales, latest orders).
- `04` `lib/utils.ts: formatNumber()`; overview stat cards + recent sales table.
- `05` **`lib/auth-guard.ts: requireAdmin()`**; `app/unauthorized/page.tsx` — apply to every admin page from here on (see `admin-route-guard.md` below).
- `06` `recharts`; `app/admin/overview/charts.tsx` (bar chart).
- `07` `getAllOrders()`; `app/admin/orders/page.tsx`.
- `08` `deleteOrder()`; ShadCN `dialog`/`alert-dialog`; **`components/shared/delete-dialog.tsx`** — reused in sections 11/12.
- `09` `updateOrderToPaidByCOD()`, `deliverOrder()`.
- `10` admin-only `MarkAsPaidButton`/`MarkAsDeliveredButton` on order details.

**Packages:** `recharts`; ShadCN `dialog`, `alert-dialog`.

### 11 — Admin Products & Images (`docs/11-admin-products-and-images/`)
Admin product CRUD + Uploadthing.
- `02`–`03` `getAllProducts()` (paginated); `app/admin/products/page.tsx` table.
- `04` `deleteProduct()` (reuses `DeleteDialog`).
- `05` `updateProductSchema`; `productDefaultValues`; `createProduct()`/`updateProduct()`.
- `06` `app/admin/products/create/page.tsx`; `components/shared/admin/product-form.tsx`.
- `07` `slugify`; name/slug/category/brand/price/stock/description fields; ShadCN `textarea`.
- `08` submit handler; `images`/`isFeatured`/`banner` temporarily stripped from schema until upload exists.
- `09` `uploadthing`, `@uploadthing/react`; `app/api/uploadthing/{core,route}.ts`; `lib/uploadthing.ts`; `next.config` remote pattern for `utfs.io`.
- `10` image upload UI wired into product form; re-enable `images` field.
- `11` reseed products with real Uploadthing URLs (no new code).
- `12` re-enable `isFeatured`/`banner`; banner upload UI.
- `13` `getProductById()`; `app/admin/products/[id]/page.tsx` (Update mode).

**Packages:** `slugify`, `uploadthing`, `@uploadthing/react`; ShadCN `textarea`.
**External:** Uploadthing account/app.

### 12 — Admin Users & Search (`docs/12-admin-users-and-search/`)
Admin user management + unified search.
- `02` `getAllUsers()`; `app/admin/users/page.tsx`.
- `03` `deleteUser()` (reuses `DeleteDialog`).
- `04` `updateUserSchema`; `USER_ROLES` constant; ShadCN `select`; `app/admin/users/[id]/page.tsx`.
- `05` `update-user-form.tsx`.
- `06` `updateUser()`.
- `07` `components/shared/admin/admin-search.tsx` (path-aware search, `usePathname`).
- `08` `getAllOrders()` extended with `query` filter; orders page search UI.
- `09` same pattern applied to `getAllUsers()`/users page.

**Packages:** ShadCN `select` only.

### 13 — Search, Filtering, Drawer & Carousel (`docs/13-search-filtering-drawer-carousel/`)
Storefront discovery features.
- `02` `getAllCategories()`; ShadCN `drawer`; `components/shared/header/categories-drawer.tsx`.
- `03` ShadCN `carousel` + `embla-carousel-autoplay`; `getFeaturedProducts()`; `components/shared/product/product-carousel.tsx` on homepage.
- `04` `components/shared/header/search.tsx`; placeholder `app/(root)/search/page.tsx`.
- `05` search page built out (query/category/price/rating/sort/page params); `getAllProducts()` signature extended.
- `06` filter logic in `getAllProducts()` (query/category/price/rating `where` clauses).
- `07` `getFilterUrl()` helper.
- `08` category + price filter links.
- `09` rating filter links + active-filter summary/clear.
- `10` sort `orderBy` logic + sort links.
- `11` `generateMetadata()` for dynamic `<title>`.

**Packages:** ShadCN `drawer`, `carousel`; `embla-carousel-autoplay`.

### 14 — Ratings and Reviews (`docs/14-ratings-and-reviews/`)
- `02` `Review` Prisma model + relations; `insertReviewSchema`; `Review` type.
- `03` `app/(root)/product/[slug]/review-list.tsx`.
- `04` `review-form.tsx` (ShadCN `Dialog` + react-hook-form).
- `05` `lib/actions/review.actions.ts: createUpdateReview()` (upsert + recompute product rating/numReviews).
- `06` wire form submit to action.
- `07` `getReviews()`, `getReviewByProductId()`.
- `08` fetch/display reviews; `components/shared/product/rating.tsx` (star SVG, reused in product card/details).
- `09` edit-existing-review prefill + reload-after-submit.

**Packages:** none new (reuses existing form/dialog stack).

### 15 — Stripe Payments (`docs/15-stripe-payments/`)
- `02` Stripe test account; `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`.
- `03` create `paymentIntents` in order page when `paymentMethod==='Stripe'`.
- `04` `stripe-payment.tsx` (Elements + `PaymentElement`, theme-aware).
- `05` `app/(root)/order/[id]/stripe-payment-success/page.tsx`.
- `06` `app/api/webhooks/stripe/route.ts` (`charge.succeeded` → `updateOrderToPaid()`); production-only webhook registration.

**Packages:** `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`.
**External:** Stripe account (test mode); webhook must point at a deployed URL, not localhost.

### 16 — Email Order Receipt (`docs/16-email-order-receipt/`)
- `02` Resend account/API key; `resend`, `react-email`, `@react-email/components`.
- `03` root-level `email/index.tsx: sendPurchaseReceipt()`; `email/purchase-receipt.tsx` skeleton.
- `04` receipt template layout (order id/date/items/totals).
- `05` preview props + `npm run email` (localhost:3001 preview server).
- `06` `updateOrderToPaid()` calls `sendPurchaseReceipt()` after marking paid.

**Packages:** `resend`, `react-email`, `@react-email/components`.
**External:** Resend account (free tier only sends to the account owner in dev).

### 17 — Homepage Components & Wrap-up (`docs/17-homepage-components-and-wrap-up/`)
- `02` `components/icon-boxes.tsx` (shipping/guarantee/payment/support).
- `03` `components/deal-countdown.tsx` (client, `setInterval` timer, uses `resources/images/promo.jpg`).
- `04` course wrap-up notes only (no code).

### 18 — Notes and Bug Fixes (`docs/18-notes-and-bug-fixes/`)
- `01` Vercel Hobby-tier Edge Function size fix: split NextAuth config into `auth.config.ts` (edge-safe `authorized` callback + protected paths) imported by both `auth.ts` and `middleware.ts`, so `middleware.ts` only pulls in the lightweight config instead of the full provider/adapter setup.

### Standalone: `docs/admin-route-guard.md`
Companion to section 10: `lib/auth-guard.ts: requireAdmin()` + `app/unauthorized/page.tsx`,
called at the top of every admin page (`overview`, `orders`, `products`, `products/create`,
`products/[id]`, `users`, `users/[id]`) rather than in the shared admin layout.

---

## Suggested build order

The sections are already dependency-ordered — each builds on models/actions/components
from the previous ones. Two things worth deciding before starting:

1. **`src/` vs root** — resolve the path-alias question at the top of this doc before section 02, since every later lesson's file paths assume one or the other.
2. **Deploy early** — section 03-10 sets up the first Vercel deploy and continuous deployment; sections 15/16 (Stripe webhook, and Resend in production) depend on a live URL, not just localhost.
