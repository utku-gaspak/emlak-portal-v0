# Automation-First Real Estate Listings (Next.js)

A modular Next.js App Router project designed for reliable RPA/AI-agent control.

## Stack
- Next.js (App Router)
- Tailwind CSS
- Local JSON datastore (`data/listings.json`)

## Admin Access
- Route: `/admin/add-listing`
- Password: `ADMIN_PASSWORD` from environment, default fallback is `change-me-123`
- Login API sets an HTTP-only auth cookie.

## Automation Contract
- Every form, input, textarea, and button has explicit `id` and `data-automation`.
- Property cards on home use `data-automation="property-card"`.
- Successful listing submit renders `#success-indicator`.
- Validation errors render field indicators:
  - `#error-title`
  - `#error-price`
  - `#error-location`
  - `#error-area-sqm`
  - `#error-room-count`
  - `#error-description`
  - `#error-photos`

## Key Routes
- `/` -> listing grid
- `/admin/add-listing` -> admin login + add form
- `POST /api/admin/login` -> login
- `POST /api/admin/logout` -> logout
- `POST /api/admin/add-listing` -> create listing
- `GET /api/listings` -> list data

## Local Run
1. Install dependencies (`npm install`)
2. Optional: copy `.env.example` to `.env` and set `ADMIN_PASSWORD`
3. Start dev server (`npm run dev`)
