# DELLA Admin Dashboard

Standalone admin frontend for `admin.dellaapp.com`.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Supabase Auth
- React Router
- Cloudflare Workers deployment

## Environment

Copy `.env.example` to `.env` and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Use the same Supabase project as the main DELLA app.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run typecheck`
- `npm run deploy`

## Auth model

After sign-in, the app reads the shared `profiles` table and only grants access to:

- `super_admin`
- `admin`
- `manager`
- `customer_care`

Other roles are redirected to a blocked screen and cannot access the dashboard UI.

## Deployment

1. Build the app with `npm run build`
2. Deploy to Cloudflare Workers with `npm run deploy`
3. Point `admin.dellaapp.com` to the deployed Worker
