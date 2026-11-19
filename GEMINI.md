# PROJECT BLUEPRINT & MANDATORY ENGINEERING RULES
**Project Name:** Artist Commission Studio (`artist-commission-studio`)  
**Workspace Packages:** `@studio/web` (Next.js) | `@studio/api` (NestJS) | `@studio/shared` (Types, Schemas & Pricing Math)  
**Architecture:** Monorepo (`apps/web` + `apps/api` + `packages/shared`)  
**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, NextAuth (Auth.js v5), NestJS (Node.js/Express), Prisma ORM, PostgreSQL, Redis, Socket.io, SePay (VietQR), Gemini API, Cloudflare R2 / AWS S3.  
**Important Constraint:** NO Strapi or third-party headless CMS. All artist content management (artworks, bio, materials, dynamic pricing rules) is unified inside a dedicated `/studio` dashboard on Next.js (`@studio/web`) backed by NestJS APIs (`@studio/api`).

---

## 1. DESIGN SYSTEM & UI/UX DIRECTION (INSPIRED BY TUHAAN.COM, MODERNIZED)

### 1.1. Visual Philosophy: "Restrained Gallery Canvas"
The UI acts as a quiet, museum-grade frame so the artist's paintings remain the sole focal point. Avoid neon gradients, heavy drop shadows, or overly colorful widgets.

### 1.2. Color Tokens (Tailwind CSS Variables)
- **Primary Canvas (Light Mode):** `#FAF9F6` (Warm Alabaster) & `#F4F4F5` (Zinc 100 for cards/surfaces)
- **Header & Editorial Dark Surface:** `#18181B` (Deep Charcoal — inspired by reference header)
- **Primary Text:** `#18181B` (Ink Black) | **Muted Text:** `#52525B` (Zinc 600)
- **Brand Accent (Primary CTA & Highlights):** `#3E5C6E` (Muted Slate-Teal — evolved from reference hero badge/button) | Hover: `#2F4858`
- **Secondary Warm Accent (Status/Artisan Tag):** `#B45309` (Muted Terracotta)
- **Borders & Dividers:** `#E4E4E7` (Hairline 1px borders)

### 1.3. Typography & Layout Modernization
- **Display & Headings:** `Cormorant Garamond` or `Playfair Display` (High-contrast editorial Serif for artist name, painting titles, and story sections).
- **UI, Pricing & Dashboard:** `Plus Jakarta Sans` or `Inter` (Clean geometric Sans-serif; uppercase with `tracking-[0.15em]` for top navigation links).
- **Brand Mark:** Custom SVG handwritten signature logo of the artist in the top-left navbar.
- **Key Modern UX Upgrades:**
  1. **Full-Bleed Hero Showcase:** Edge-to-edge featured artwork with centered serif display typography, subtle slate-teal subtitle bar, and crisp rectangular CTA button, enhanced with subtle parallax scroll.
  2. **Adaptive Sticky Navbar:** Starts transparent/dark over the hero artwork and smoothly transitions to a frosted glass header (`backdrop-blur-md`) on scroll.
  3. **Masonry Portfolio & Canvas Loupe:** Natural aspect-ratio masonry grid with high-res zoom inspection and a **Wall Preview Mockup** (previewing framed art on sample living room walls).
  4. **Interactive Before/After Slider:** For wall mural projects showing the bare wall vs. completed mural.

---

## 2. CORE FUNCTIONAL SPECIFICATIONS & BUSINESS RULES

### 2.1. Role-Based Access Control (Single-Artist Architecture)
- **`ARTIST` (Admin/Owner):** Strictly locked to a single artist email defined via `ARTIST_ADMIN_EMAIL` in environment variables. Has full access to `/studio` (CMS, Order Kanban, Pricing Rules, Revenue Analytics, System Monitoring).
- **`CUSTOMER`:** Default role for all registered/OAuth users via NextAuth. Can browse portfolio, configure orders, upload custom reference images, chat in order rooms, approve sketches, and pay via SePay QR or Cash.

### 2.2. Public Showcase & Artist Profile (`/about`, `/portfolio`)
- **Artist Biography & Experience:** Editable storytelling timeline, exhibitions/projects, and studio location.
- **Materials, Colors & Mediums Guide:** Visual breakdown of supported mediums (Oil paint, Acrylic, Watercolor, Textured Relief, Exterior/Interior Wall Paint), durability, color palettes, and surface requirements.

### 2.3. Dynamic Pricing Engine & Custom Order Configurator (`/commission`)
Supports both **Artist Catalog Templates** and **Customer Uploaded Reference Images** across two distinct service workflows. All dimensions input by users in centimeters ($\text{cm}$) MUST be converted to square meters ($\text{m}^2$) via $\text{Area}_{m^2} = \max\left(\frac{\text{Width}_{cm} \times \text{Height}_{cm}}{10,000},\ \text{minBillableAreaM2}\right)$ (default minimum billable area: $0.2\text{ m}^2$ for framed art, $1.0\text{ m}^2$ for wall murals):

1. **Framed Artwork (`FRAMED_ART` - Delivered to Customer):**
   $$\text{Total} = (\text{Area}_{m^2} \times \text{MaterialRate}_{m^2} \times \text{ComplexityMultiplier}) + \text{FramePrice} + \text{ShippingFee}$$
   - Shipping fee scales by distance (km) and frame size tier (oversized canvases require specialized transport).
2. **Wall Mural (`WALL_MURAL` - Artist Travels On-Site):**
   $$\text{Total} = (\text{Area}_{m^2} \times \text{PaintRate}_{m^2} \times \text{ComplexityMultiplier}) + \text{TravelFee} + \text{SiteSurcharge}$$
   - Travel fee calculated from Artist Studio coordinates to Customer Address (free within first $X$ km, tiered rate per km thereafter) + optional scaffolding surcharge for walls higher than $3\text{m}$.
   - **Booking Conflict Rule:** Wall murals require on-site execution; the Studio Dashboard tracks `scheduledStartDate` and `scheduledEndDate` and warns the artist if two `WALL_MURAL` orders overlap.
- **Complexity Multipliers (Configurable by Artist):** `SIMPLE` ($\times 1.0$), `MEDIUM` ($\times 1.35$), `COMPLEX` ($\times 1.8$).
- **Custom Upload Review Flow:** If a customer uploads their own reference image, the system displays an estimated price, sets status to `PENDING_QUOTE`, and allows the artist to confirm/adjust complexity and final quote before unlocking deposit payment.

### 2.4. Payment, Mandatory Deposit & Settlement Rules (SePay VietQR + Cash)
- **Mandatory Deposit Rule:** Automatically enforced when `totalAmount >= depositThreshold` (configurable in Studio Settings, e.g., $1,500,000\text{ VNĐ}$), OR for any `WALL_MURAL` / custom reference order. Deposit percentage is configurable ($30\% - 50\%$).
- **SePay VietQR Integration:**
  - Generate dynamic VietQR URL containing exact required amount (`depositAmount` for deposit stage, or `totalAmount - paidAmount` for final balance settlement) and unique transfer code (`DH{orderCode}`).
  - Endpoint `POST /api/v1/webhooks/sepay`: Validates `Authorization: Apikey <SEPAY_API_KEY>`, enforces idempotency using `sepayTxId` inside a Prisma DB transaction, increments `paidAmount`, and emits a real-time `payment_confirmed` event via Socket.io.
  - **Underpayment Rule:** If cumulative `paidAmount < depositAmount`, keep status at `AWAITING_DEPOSIT` and notify customer of the exact remaining deposit shortfall rather than prematurely unlocking the order.
- **Cash & Final Balance Settlement:**
  - Full cash payment on delivery is allowed ONLY when `requireDeposit === false`.
  - For deposited orders, the remaining balance (`totalAmount - paidAmount`) can be paid via a second SePay QR scan OR in Cash upon delivery/completion (requires the artist to click **"Confirm Cash Balance Received"** on `/studio` before marking `COMPLETED`).

### 2.5. Order Lifecycle, Sketch Approval & Cancellation Rules
- **Sketch Revision Policy:** Includes up to `freeSketchRevisions` (default: `2` rounds) of pencil/digital sketch adjustments. Additional revision rounds incur a configurable surcharge. Formal customer approval via **"Approve Sketch"** locks `sketchApprovedAt` and transitions the order to `PAINTING`.
- **Cancellation & Non-Refundable Deposit Rule:**
  - Customers may self-cancel an order ONLY while status is `PENDING_QUOTE` or `AWAITING_DEPOSIT` (with `paidAmount === 0`).
  - Once `DEPOSIT_PAID` or `SKETCHING` is reached, self-cancellation is disabled; deposits are non-refundable once material procurement or sketching has begun (cancellations at this stage require direct artist intervention in `/studio`).

### 2.6. Omnichannel Floating Dock & Per-Order Realtime Workspace
- **Floating Contact Widget:** Minimalist expandable dock at bottom-right containing quick links to **Zalo**, **Facebook Messenger**, **Direct Hotline**, and the **AI Art Assistant**.
- **Per-Order Realtime Chat (Socket.io):** Dedicated room (`order_{orderCode}`) for each order so reference photos never get lost. Supports text, customer wall/reference photos, artist sketch/WIP uploads, and milestone system events.

### 2.7. Integrated AI Art Consultant (Gemini API + Function Calling)
- Embedded in the floating assistant drawer.
- Grounded in the artist's actual materials, pricing rules, and portfolio via Function Calling tools:
  - `calculateEstimatePrice(serviceType, widthCm, heightCm, materialSlug, complexity, distanceKm)`
  - `searchPortfolio(style, medium, roomType)`
  - `getArtistCapabilities()`

### 2.8. Unified Artist Studio & Monitoring (`/studio`)
- **Content & Pricing CMS:** CRUD for Portfolio Artworks, Materials/Colors, Artist Bio, and Dynamic Pricing/Deposit Configs.
- **Order Kanban Board & Schedule:** Drag-and-drop workflow (`PENDING_QUOTE` → `AWAITING_DEPOSIT` → `DEPOSIT_PAID` → `SKETCHING` → `PAINTING` → `DELIVERING` → `COMPLETED`) plus Wall Mural booking calendar.
- **Financial Overview:** Monthly revenue, SePay QR collected vs. Cash Remaining Balance to collect.
- **System Monitoring:** Live SePay Webhook log table (with 1-click manual reconciliation for mistyped transfer notes), Gemini API usage/rate-limit metrics, R2 storage usage, and DB/Redis health checks.

---

## 3. DATABASE SCHEMA BLUEPRINT (PRISMA / POSTGRESQL)

Core models to implement in `apps/api/prisma/schema.prisma`:
- `User` (`id`, `email`, `name`, `phone`, `avatarUrl`, `role`: `ARTIST | CUSTOMER`)
- `ArtistStudioConfig` (Singleton row: `artistName`, `bio`, `experienceYears`, `studioAddress`, `studioLat`, `studioLng`, `zaloUrl`, `messengerUrl`, `hotline`, `depositThreshold`, `depositPercent`, `minFramedAreaM2`, `minMuralAreaM2`, `freeSketchRevisions`, `freeKmRadius`, `feePerKm`, `simpleMultiplier`, `mediumMultiplier`, `complexMultiplier`)
- `Material` (`id`, `name`, `slug`, `serviceType`, `basePricePerM2`, `description`, `durabilityNote`, `sampleImageUrl`, `isActive`)
- `ArtworkTemplate` (`id`, `title`, `slug`, `description`, `images[]`, `serviceType`, `materialId`, `defaultComplexity`, `dimensionsNote`, `isFeatured`, `isAvailable`)
- `Order` (`id`, `orderCode`, `customerId`, `serviceType`, `templateId?`, `customReferenceUrls[]`, `widthCm`, `heightCm`, `materialId`, `complexity`, `frameOption?`, `address`, `distanceKm`, `shippingOrTravelFee`, `artworkPrice`, `totalAmount`, `requireDeposit`, `depositAmount`, `paidAmount`, `paymentMethod`, `status`, `revisionCount`, `sketchApprovedAt?`, `scheduledStartDate?`, `scheduledEndDate?`, `cancellationReason?`)
- `OrderMessage` (`id`, `orderId`, `senderId`, `content`, `attachmentUrls[]`, `messageType`: `TEXT | SKETCH_PROPOSAL | SYSTEM_EVENT`, `createdAt`)
- `SepayTransaction` (`id`, `sepayTxId` `@unique`, `orderId?`, `amount`, `transferContent`, `gateway`, `rawPayload` `Json`, `status`: `MATCHED | UNMATCHED_REVIEW`, `createdAt`)

---

## 4. MANDATORY ENGINEERING & GIT WORKFLOW RULES

> **CRITICAL:** Every AI agent and developer working on `artist-commission-studio` MUST strictly obey all rules below without exception.

### 4.1. Strict Git Branching & Release Lifecycle
1. **Protected Branches (`main` & `dev`):**
   - `main` is strictly for **Production-ready, verified releases**.
   - `dev` is the **Integration & Staging branch**.
   - **NEVER** commit or push code directly to `main` or `dev`.
2. **Mandatory Branch Creation for Every Single Task:**
   - Every new feature, bug fix, refactor, chore, or documentation change **MUST** be developed on its own dedicated branch created from the latest `dev`:
     - `feat/<kebab-case-scope>` — New feature (e.g., `feat/sepay-webhook-handler`)
     - `fix/<kebab-case-scope>` — Bug fix (e.g., `fix/mural-distance-calculation`)
     - `refactor/<kebab-case-scope>` — Code restructuring without changing behavior (e.g., `refactor/pricing-service-strategy`)
     - `chore/<kebab-case-scope>` — Tooling, dependencies, configs (e.g., `chore/init-monorepo-setup`)
     - `docs/<kebab-case-scope>` — Documentation updates (e.g., `docs/api-swagger-specs`)
     - `hotfix/<kebab-case-scope>` — Urgent production bug branched from `main`, merged into BOTH `main` and `dev`.
3. **Standard Task Execution Flow (Step-by-Step):**
   - **Step 1:** Sync local `dev`: `git checkout dev && git pull origin dev`
   - **Step 2:** Create isolated branch: `git checkout -b <type>/<scope>`
   - **Step 3:** Implement task cleanly. Run `pnpm lint`, `pnpm typecheck`, and unit/integration tests.
   - **Step 4:** Commit using **Conventional Commits** (`feat(orders): add deposit threshold validation`).
   - **Step 5:** Push feature branch to remote: `git push -u origin <type>/<scope>`
   - **Step 6:** Merge branch into `dev` (`git checkout dev && git merge --no-ff <type>/<scope> && git push origin dev`), then delete the merged topic branch locally and remotely (`git branch -d <type>/<scope> && git push origin --delete <type>/<scope>`).
   - **Step 7:** Verify the full system on `dev` (frontend `@studio/web` + backend `@studio/api` build cleanly, zero TypeScript/lint errors, all user flows verified).
   - **Step 8 (Release to Production):** **ONLY** after `dev` runs completely stable and error-free, merge `dev` into `main` (`git checkout main && git pull origin main && git merge --no-ff dev && git push origin main`) and tag the release (`git tag -a v1.x.x -m "Release v1.x.x" && git push origin --tags`).

### 4.2. Security & Financial Integrity Rules
- **Zero Client-Side Price Trust:** Frontend price calculators in `@studio/web` are for preview only. `OrdersService` in `@studio/api` MUST recalculate `artworkPrice`, `shippingOrTravelFee`, `totalAmount`, and `depositAmount` from database rules upon order creation.
- **Webhook Idempotency & Auth:** Reject any SePay webhook missing the valid `Authorization: Apikey <SEPAY_API_KEY>` header. Always check `sepayTxId` uniqueness inside an atomic DB transaction before crediting an order.
- **Direct-to-Cloud Media Uploads:** Never upload raw artwork images through NestJS memory buffers. Issue short-lived **Presigned URLs** (Cloudflare R2 / S3) validated by MIME type (`image/jpeg`, `image/png`, `image/webp`) and max file size ($15\text{MB}$).
- **Secret Hygiene:** Never hardcode API keys, database URLs, or `ARTIST_ADMIN_EMAIL` in source code. Maintain up-to-date `.env.example` files across `apps/web` and `apps/api`.

### 4.3. Code Quality & Antigravity Execution Protocol
- **Strict TypeScript:** `strict: true` enabled across `@studio/web`, `@studio/api`, and `@studio/shared`. Usage of `any` is prohibited unless explicitly justified.
- **DTO Validation:** Every NestJS controller endpoint MUST validate incoming payloads with `class-validator` and `class-transformer` (`ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`).
- **Incremental Delivery:** Execute implementation phase by phase. At the end of each phase, summarize changes, list the Git commands executed for branch management, and verify build health before moving to the next phase.