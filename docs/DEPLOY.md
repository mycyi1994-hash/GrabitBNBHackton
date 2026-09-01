# Deploying Grabit

Judging requires the submission to be publicly reachable and working for someone
who is not signed in to anything. `docs/REQUIREMENTS_MATRIX.md` carries that as
**MT-01**, and it is the one requirement that makes every other requirement
moot if it fails.

Grabit builds to a Cloudflare Worker. `npm run build` emits a complete
`dist/server/wrangler.json`, so deployment needs no hand-written config.

## 1. Build

```bash
npm install
npm run build
```

The build must finish clean before anything is deployed. It emits
`dist/client` (static assets) and `dist/server` (the Worker).

## 2. Deploy

```bash
npx wrangler login
npx wrangler deploy -c dist/server/wrangler.json
```

Wrangler prints the public `*.workers.dev` URL. That URL is what goes on the
submission form.

## 3. Set the server-only secrets

Three keys must never be build-time variables, never appear in the client
bundle, and never be committed. Set them as Worker secrets, which are encrypted
at rest and injected at runtime:

```bash
npx wrangler secret put GRABIT_ALTANA_ADMIN_PRIVATE_KEY   -c dist/server/wrangler.json
npx wrangler secret put GRABIT_ALTANA_SESSION_PRIVATE_KEY -c dist/server/wrangler.json
npx wrangler secret put GRABIT_TESTNET_PROVIDER_PRIVATE_KEY -c dist/server/wrangler.json
```

Each prompts for the value on stdin. Nothing is echoed and nothing is written to
a file. Use Testnet-only keys — the same ones from `.env.local`, never a
Mainnet-funded key.

Optional, for a higher 8004scan rate limit:

```bash
npx wrangler secret put SCAN_8004_API_KEY -c dist/server/wrangler.json
```

Without it, discovery still works: the server route calls 8004scan
anonymously.

## 4. Public variables

These are read in the browser, so they are plain variables rather than secrets,
and they are inlined at build time — set them before `npm run build`, not after
deploy:

```
NEXT_PUBLIC_BSC_CHAIN_ID=97
NEXT_PUBLIC_NETWORK_LABEL=BSC Testnet
NEXT_PUBLIC_SITE_URL=https://<your-worker>.workers.dev
```

Nothing secret belongs behind a `NEXT_PUBLIC_` prefix. Anything with that prefix
ships to every visitor's browser.

## 5. Verify anonymous access

This is the actual MT-01 check, and it is not satisfied by the deploy command
succeeding. Do all of it:

1. Open the URL in a **private window**, signed out of everything.
2. Confirm the store lists all four categories with a rung on every card.
3. Open an agent's detail screen and confirm it fits without scrolling.
4. Run the free preview. It must work with no wallet and no signature.
5. Open `/authority` and confirm the session panel reports a real state —
   `ACTIVE`, or `UNAVAILABLE` with its reason. A blank panel is a failure.
6. Ask someone on a different network to open the same URL.

Record the result in `docs/REQUIREMENTS_MATRIX.md`. MT-01 stays FAIL until an
anonymous load has actually been observed, not assumed.

## What is safe to make public

The repository carries no secrets. Verified across the full git object history:
no `.env` file has ever been committed, `.gitignore` excludes `.env*` except
`.env.example`, and `.env.example` contains only empty keys and public
addresses. The only 64-character hex strings in the tree are the EIP-1967
implementation storage slot, which is a published constant.

Contract addresses, the registry token IDs, the agent wallet address and the
KeyStore address are all public on-chain data and are meant to be readable —
they are what lets a third party verify the session scope without trusting this
application.
