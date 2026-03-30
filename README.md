# Automation-First Real Estate Listings

Next.js App Router project for managing and publishing real estate listings with an admin workflow, Supabase-backed data, and automation-friendly UI hooks.

## Features
- Public listing grid with search and filter support
- Property detail pages with view counting
- Admin authentication with NextAuth credentials
- Admin listing management: create, edit, delete, feature toggle
- Image uploads via Supabase Storage bucket flow
- Category-driven form logic for house and land listings
- English/Turkish UI support and theme switching
- Automation-friendly ids and `data-automation` hooks throughout the UI

## Tech Stack
- Next.js App Router
- React 18
- TypeScript
- Tailwind CSS
- Supabase for listings and categories
- Supabase Storage for listing images
- NextAuth for admin login

## Main Routes
- `/` public homepage and listing grid
- `/property/[id]` property detail page
- `/admin` admin entry route
- `/admin/login` admin login page
- `/admin/listings` admin dashboard
- `/admin/add` add new listing
- `/admin/edit/[id]` edit listing

## API Routes
- `GET /api/listings` list listings
- `GET /api/listings/[id]` listing details
- `POST /api/listings/[id]/view` increment view count
- `POST /api/admin/listings` create listing
- `PATCH /api/admin/listings/[id]` update listing
- `DELETE /api/admin/listings/[id]` delete listing
- `POST /api/admin/login` admin sign-in
- `POST /api/admin/logout` admin sign-out

## Environment Variables
Copy `.env.example` to `.env` and fill in these values:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CONTACT_PHONE`
- `NEXT_PUBLIC_CONTACT_EMAIL`
- `NEXT_PUBLIC_CONTACT_ADDRESS`
- `NEXT_PUBLIC_INSTAGRAM_URL`
- `NEXT_PUBLIC_FACEBOOK_URL`

## Local Setup
1. Install dependencies with `npm install`
2. Create `.env` from `.env.example`
3. Set your Supabase and admin credentials
4. Run the app with `npm run dev`

## Admin Login
- Username and password come from `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- The default login page is `/admin/login`
- Successful login redirects to `/admin/listings`

## Data Model Notes
- Listings and categories are stored in Supabase tables
- Categories must include root records for the main category dropdown to work
- Listing images are uploaded to the `listings` Supabase Storage bucket and saved as public URLs

## Automation Notes
- Forms, buttons, and key UI elements include stable `id` and `data-automation` values
- This makes the project suitable for RPA, agent workflows, and end-to-end automation

## Development
- `npm run dev` start the app
- `npm run build` build for production
- `npm run start` run the production build
- `npm run lint` run the TypeScript check
