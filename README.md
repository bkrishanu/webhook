# HookNest — Webhook Inspector

HookNest gives every visitor a **permanent webhook URL** and shows each HTTP request sent to it, live, in a clean green dashboard. It's a self-hosted alternative to webhook.site, built with **Next.js (React + Node.js API routes)**, **Tailwind CSS** and **Upstash Redis**, and it runs on **Vercel**.

## Features

- **Permanent URL per user:** `https://<your-app>/h/<id>`. Every user gets their own ID, so user 1 and user 2 only see their own requests. The URL never changes.
- Accepts **any method** (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS) and **any sub-path** (`/h/<id>/orders/42`).
- Shows the method, path, query parameters, headers, body, IP, user agent, size and time of every request.
- Pretty-printed, collapsible **JSON viewer**, a form-field table and base64 display for binary bodies.
- **Custom response:** set the status code, content type, body and extra headers your URL replies with.
- **Search and method filter**, **copy as cURL**, **delete** one request or **clear all**.
- **Live updates** every 3 seconds (paused while the tab is hidden), and **dark mode**.
- No login. The user's ID is kept in the browser, and the dashboard link (`/inbox/<id>`) can be bookmarked to open it on any device.

Retention: requests are kept for **7 days**, with up to **500 per URL**. Request bodies are stored up to 100 KB.

> **Privacy note:** anyone who knows a webhook ID can view its requests. This is the same model webhook.site uses. Don't send production secrets to it.

## Deploying to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and **import** the GitHub repo `bkrishanu/webhook`. Keep the default settings (Framework: Next.js) and click **Deploy**.
2. Open the project → **Storage** tab → **Create Database** → choose **Upstash for Redis** from the Marketplace (the free plan is fine) → **Connect** it to this project for all environments.
   This adds the `KV_REST_API_URL` and `KV_REST_API_TOKEN` environment variables automatically.
3. Go to **Deployments** → open the menu (⋯) on the latest deployment → **Redeploy**, so the new variables are picked up.
4. Open your app URL. You'll be taken to your own inbox with a permanent webhook URL.

If you'd rather create the Upstash database at [console.upstash.com](https://console.upstash.com), add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as environment variables in Vercel instead.

If storage isn't connected, the app shows a "Storage is not configured" warning.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Without Redis credentials, local development stores requests **in memory**, and they disappear when the server restarts. To use Redis locally, copy `.env.example` to `.env.local` and fill it in.

Try it:

```bash
curl -X POST http://localhost:3000/h/<your-id> \
  -H 'Content-Type: application/json' \
  -d '{"event":"order.created","id":1234}'
```

## API reference

| Endpoint | Purpose |
|---|---|
| `ANY /h/:id/*` | The webhook. It records the request and replies with the configured response |
| `GET /api/hooks/:id/requests[?since=<ms>]` | List recorded requests, newest first |
| `DELETE /api/hooks/:id/requests` | Delete all requests |
| `DELETE /api/hooks/:id/requests/:reqId` | Delete one request |
| `GET / PUT /api/hooks/:id/config` | Read or update the custom response |

## Project structure

```
app/
  page.tsx                     # redirects to the visitor's inbox
  inbox/[id]/page.tsx          # dashboard
  h/[id]/[[...path]]/route.ts  # webhook capture endpoint
  api/hooks/[id]/...           # dashboard API
components/                    # UI (Inbox, RequestList, RequestDetail, JsonView, ResponseSettings…)
lib/store.ts                   # Upstash Redis storage (in-memory fallback for local dev)
```
