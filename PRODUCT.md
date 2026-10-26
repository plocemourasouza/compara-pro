# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 + React 19 + Tailwind v4 + shadcn/ui + Prisma + PostgreSQL + Bun. Local dev: `bun run dev` on port 3150.

## Users

- **CLIENT (comprador):** procurement staff uploading a real purchase list, comparing supplier prices, and creating a pre-order.
- **REPRESENTATIVE (representante):** supplier-side reps managing clients, catalogs, suppliers, and pre-orders.
- **ADMIN:** platform operators managing companies, users, products, and reports.

Primary landing visitor: an unauthenticated buyer or supplier deciding whether to sign up or log in.

## Product Purpose

Compara Pró is a B2B price comparison platform. Buyers upload purchase lists, match products across supplier catalogs, compare prices, and create pre-orders, so procurement costs less and closes faster.

Success is a buyer acting on matches and prices from their own list. The jobs are:

1. Compare supplier prices on a real shopping list quickly.
2. Trust that matches and savings are actionable.
3. Start a trial or sign in to an existing organization.

## Positioning

Upload a product list (Excel/CSV), then automated matching and cross-supplier price comparison, then a pre-order from the best offers. The product is the comparison workflow, not a marketplace storefront.

## Operating Context

- **Comprador:** uploads a list, compares matched offers, and creates a pre-order. History of past comparisons stays available.
- **Representante:** maintains clients, catalogs, suppliers, uploads, and pre-orders.
- **Admin:** manages companies, users, products, reports, and pre-orders.
- **Landing pública:** the unauthenticated visitor signs in or registers. Auth routes are `/auth/login` and `/auth/register`.

## Capabilities and Constraints

- Confirmed flow: Excel/CSV upload, automated product matching, cross-supplier comparison, pre-order.
- Roles stay distinct: `CLIENT`, `REPRESENTATIVE`, `ADMIN`.
- Demo accounts exist for local use only.
- Paid pricing and trial length are undecided. Do not claim a free-trial duration, including “14 dias grátis”, unless the product enforces it.
- Legal entity for footer copyright is undecided. Use the current year and soft wording.

## Brand Commitments

- Product name: **Compara Pró**.
- Voice: direct Brazilian Portuguese. Operational, not hype. Prefer concrete procurement language over “IA revolucionária” or “next-gen” marketing.
- Binding visual constraints already in the product UI: light canvas (`#f7f8fc`), ink (`#192b49`), blue accent (`#245bcf`, hover `#1747ab`), soft blue (`#eaf0ff`), borders (`#dce2ec`), dark ground (`#172a49`). Winning price and success stay green. Errors stay red. Warnings are indigo, not orange. Geist and Geist Mono.

## Evidence on Hand

No customer counts, savings guarantees, or named logos are sourced. Future work must not invent them. Proof on marketing surfaces is the product itself (a comparison surface), not social-proof theater. Local demo accounts are not customer evidence.

## Product Principles

1. The product is the comparison workflow. A storefront metaphor does not describe the job.
2. Trust comes from matches and prices on the buyer’s own list.
3. Speak like procurement operations: direct Portuguese, no hype.
4. Unsourced proof stays out. No invented customers, logos, or savings claims.
5. Each role keeps its own job: the buyer compares, the representative runs the supplier side, the admin runs the platform.

## Accessibility & Inclusion

WCAG AA contrast for body text. Primary actions are keyboard-focusable. Honor `prefers-reduced-motion`.
