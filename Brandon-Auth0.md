# Brandon — Auth0 setup (what I need you to do)

We're adding Auth0 (private app: login required to view; per-user voting; event attribution).
You chose to give me a **Management API token** so I can create & configure the actual login app
programmatically. Here's the one thing you need to do — should take ~5 minutes.

## 1. Create a Machine-to-Machine app for the Management API

1. Go to the [Auth0 Dashboard](https://manage.auth0.com/) → **Applications → Applications → Create Application**.
2. Name it something like `planet-atlas-mgmt`, pick **Machine to Machine Applications**, click **Create**.
3. On the "Authorize" screen, select the **Auth0 Management API** (`https://<your-tenant>/api/v2/`).
4. Grant these **scopes** (search + toggle each), then **Authorize**:
   - `create:clients`, `read:clients`, `update:clients`
   - `create:client_grants`, `read:client_grants`
   - `read:connections`, `update:connections` _(so I can enable the login database/social)_
5. Open the app's **Settings** tab and copy: **Domain**, **Client ID**, **Client Secret**.

## 2. Put the three values in the gitignored `.env` (NOT `.env.example`)

Add these lines to `/home/dotwack/global/.env` (same file that holds `VERCEL_TOKEN` — it's
gitignored, never committed):

```
AUTH0_MGMT_DOMAIN=your-tenant.us.auth0.com
AUTH0_MGMT_CLIENT_ID=xxxxxxxxxxxxxxxxxxxx
AUTH0_MGMT_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Domain format:** just the host, e.g. `dev-ab12cd.us.auth0.com` — no `https://`, no trailing slash.

## 3. A couple of choices (reply in chat, or I'll assume the defaults)

- **Login methods:** default = **username/password database** only. Want **Google** (or others) social login too? Tell me.
- **Region/tenant:** I'll use whatever tenant the M2M app above lives in. If you want a specific
  region (US/EU/AU) for data residency, create the tenant there first.

## What I'll do with this (so you don't have to)

Using the Management API token, I'll:

- Create the **Regular Web Application** (`planet-atlas`) and capture its `AUTH0_CLIENT_ID` / `AUTH0_CLIENT_SECRET`.
- Configure its **Allowed Callback URLs / Logout URLs / Web Origins** for `http://localhost:3000`,
  the LAN dev IP, and `https://global-jade-tau.vercel.app`.
- Generate `AUTH0_SECRET` (`openssl rand -hex 32`) and set `APP_BASE_URL` per environment.
- Add all `AUTH0_*` app vars to Vercel (all environments) via the `vercel-engineer`.

## Meanwhile

The auth code (SDK, proxy gate, DB schema, UI) is being built and tested in **open mode** — it runs
fine without any Auth0 config. Your token only gates the final wire-up and the live login test, so
nothing is blocked waiting on this. Ping me once the three values are in `.env`.
