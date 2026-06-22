# Checkout Reviews — Shopify App

A Shopify app that lets merchants **enter customer reviews in the admin** and
**showcase them on the checkout page** as a swipeable card carousel.

It has two parts:

| Part | Tech | Location |
| --- | --- | --- |
| **Admin app** (manage reviews) | Remix + Polaris web components + Prisma/SQLite | [app/](app/), [prisma/](prisma/) |
| **Checkout extension** (display reviews) | Preact + Polaris checkout web components | [extensions/review-cards/](extensions/review-cards/) |

## How it works

1. The merchant opens the embedded **Reviews** admin page and adds reviews
   (reviewer name, rating, text, photo URL, product image URL, source, verified).
   Reviews are stored in the app's Prisma/SQLite database, scoped per shop.
2. The checkout UI extension calls the app's public endpoint
   [`/api/reviews`](app/routes/api.reviews.jsx) over the network (it sends a
   Shopify **session token**, which the app verifies with
   `authenticate.public.checkout`). The endpoint returns the shop's published
   reviews, with CORS headers for the checkout sandbox.
3. The extension renders the reviews as a horizontal carousel of cards
   (product image, reviewer avatar + name + verified check, Google badge,
   relative time, star rating, and a "Read more" expander).

```
Admin (Remix)  ──writes──▶  Prisma/SQLite (Review)  ◀──reads──  /api/reviews
                                                                     ▲
                                                                     │ fetch(+ session token)
                                                       Checkout UI extension (Preact)
```

## Getting started

### Requirements

- [Node.js](https://nodejs.org/en/download/) 18+
- A [Shopify Partner account](https://partners.shopify.com/signup) and a
  development store.

### Install

```shell
npm install
npm run setup   # prisma generate + create/apply the SQLite database
```

### Run locally

```shell
npm run dev
```

The Shopify CLI starts the Remix backend **and** the checkout extension, and
creates a public tunnel URL for your app.

### Connect the checkout extension to your app

Because a checkout extension runs on a Shopify domain, it needs your app's
**absolute** URL to fetch reviews:

1. In the Shopify admin, open the **checkout editor** and add the
   **review-cards** block where you want it.
2. In the block's settings, set **"Reviews API URL"** to your app URL
   (the tunnel URL from `npm run dev`, or your production URL — without a
   trailing slash). The extension fetches `<url>/api/reviews`.
3. The same settings panel also exposes editable **Heading**, **Subheading**,
   and a **Show Google badge** toggle, so merchants can change the carousel copy
   without touching code (sensible defaults are used when left blank).

> `network_access = true` is already enabled in
> [extensions/review-cards/shopify.extension.toml](extensions/review-cards/shopify.extension.toml).

### Add reviews

Open the app from your store's Apps menu → **Reviews** → fill in the
"Add a review" form. Published reviews appear at checkout immediately. Each row
has **Edit** (full edit page at `/app/reviews/:id`), **Hide/Publish**, and
**Delete** actions.

## Useful scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run app + extensions with the Shopify CLI |
| `npm run setup` | `prisma generate && prisma migrate deploy` |
| `npm run build` | Production build of the Remix app |
| `npm run prisma -- studio` | Browse the local database |
| `npm run deploy` | Deploy app config + extensions |

## Notes & limitations

- Checkout UI extensions are **sandboxed and themed by the merchant's
  checkout** — components like `s-box` only support `base`/`subdued`/
  `transparent` backgrounds, so the card layout matches the screenshot's
  **structure** but cannot use an arbitrary near-black background.
- SQLite is used for local development. For production, point the Prisma
  `datasource` at a hosted database (e.g. Postgres/MySQL) and re-run migrations.

## Developer resources

- [Checkout UI extensions](https://shopify.dev/docs/api/checkout-ui-extensions)
- [Polaris web components (App Home)](https://shopify.dev/docs/api/app-home)
- [Shopify App Remix](https://shopify.dev/docs/api/shopify-app-remix)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
