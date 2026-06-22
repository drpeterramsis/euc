# EUC – Experts of URO CLUB
Version: 1.0.1010

## What is EUC?
EUC (Experts of URO CLUB) is a full-stack conference trip management WebApp
built for medical delegations attending scientific conferences.
Current event: Prague Conference 2026.

## Tech Stack
- Framework: Full-stack Express + Vite + TypeScript
- Styling: Tailwind CSS
- Data Persistence: Vercel KV (Redis)
- Push Notifications: `web-push`

## Key Features
- **Admin Panel**:
    - Manage users, trips, and itineraries.
    - Check-in system management.
    - Automated push notification dispatcher (with persisted/reusable tags).
- **User Dashboard**:
    - Itinerary tracking, scientific sessions, flight/hotel logistics.
    - Check-in functionality.

## Project Structure
/api               → Serverless API endpoints (consolidated)
/data              → JSON files (base configuration/default state)
/scripts           → Utilities (increment-version, update travelers)
/src/components    → React UI components
/src/pages         → Application pages
/server.ts         → Express backend entry point

## Development & Versioning
- **Local Dev**: Run `npm run dev` (boots `tsx server.ts` on port 3000).
- **Versioning**: Run `npx tsx scripts/increment-version.js` to auto-increment the version, update `package.json`, and regenerate `src/version.ts`.
- **Packaging**: `npm run build` bundles the Express server using `esbuild`.

## Recent Updates
- **Push Notifications**: Added persistence for notification tags (reusable), status success popups, and improved dispatch performance using `Promise.all`.
- **Check-ins**: Removed redundant alert cards; consolidated push notification settings into the User Profile page only.
- **Admin UX**: Added shortcut panel for Admin Checkins and Notifications management.
- **Versioning**: Implemented automatic build version incrementing.

