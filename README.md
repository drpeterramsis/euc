# EUC – EVA URO CLUB
Version: 1.0.922

## What is EUC?
EUC (EVA URO CLUB) is a professional conference trip management WebApp
built for medical delegations attending scientific conferences.
Current event: Prague Conference 2026.

## Tech Stack
- Framework: Vite + React + TypeScript
- Styling: Tailwind CSS
- Icons: lucide-react
- Data Storage: JSON files hosted on GitHub
- Read/Write: GitHub REST API via Personal Access Token (PAT)
- Auth: localStorage session (role-based)
- Deployment: Vercel
- No Firebase. No backend. No external database.

## User Roles
| Role    | Access Level                                      |
|---------|---------------------------------------------------|
| admin   | Full access + User Management + Feature Control   |
| doctor  | Profile, Flight, Hotel, Schedule, Sessions        |
| staff   | Profile, Flight, Hotel, Schedule, Sessions, Media, Directory |

## Project Structure
/data              → JSON files (users, schedule, sessions, settings, etc.)
/src/components    → Reusable UI components (Sidebar, Header, Footer, Layout)
/src/pages         → App pages (Login, Dashboard, Profile, etc.)
/src/utils         → Helper functions (auth, github read/write)
/src/context       → Global application state (AppContext)

## JSON Files (act as the database)
| File             | Purpose                            |
|------------------|------------------------------------|
| users.json       | All user accounts and profile data |
| schedule.json    | Trip and conference daily schedule |
| sessions.json    | Scientific conference sessions     |
| settings.json    | Feature flags and coming soon list |
| media.json       | Posts and gallery                  |
| tripInfo.json    | Global flight and hotel values     |
| appConfig.json   | Global app settings (navigation)   |

## Environment Variables (set in Vercel)
VITE_GITHUB_TOKEN          → Your GitHub Personal Access Token
VITE_GITHUB_REPO           → format: username/repo-name
VITE_GITHUB_BRANCH         → e.g., main

## How to Run Locally
1. Clone the repository
2. Run: npm install
3. Create a .env file and add your environment variables
4. Run: npm run dev
5. Open: http://localhost:5173

## How to Deploy on Vercel
1. Push the project to GitHub
2. Connect the repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy — Vercel auto-deploys on every push

## Version History
| Version | Date       | Changes                                      |
|---------|------------|----------------------------------------------|
| v1.0    | 2025-01-01 | Initial app build                            |
| v1.1    | 2025-01-01 | Added admin user + footer versioning         |
| v1.2    | 2025-01-01 | Added README + code comments across all files|
| v1.3    | 2025-01-01 | Fixed login white screen + session bug + GitHub fallback + env variable fix |
| v1.4    | 2025-01-01 | Fixed metadata title + admin profile bug + Vercel 404 routing fix |
| v1.5    | 2025-01-01 | Major fix: logout + pages loading + caching + auth guard + performance |
| v1.6    | 2025-01-01 | Global data loading + mobile responsive + full page functionality |
| v1.7    | 2025-01-01 | True SPA routing + one-time data load + professional user control card + coming soon pages + toast system |
| v1.8    | 2025-01-01 | CRITICAL: True SPA fix — zero browser reloads + instant navigation + one-time data load |
| v1.9    | 2025-01-01 | Restored + expanded admin panel: full user control, schedule/sessions manager, feature flags, impersonate view |
| v1.10   | 2025-01-01 | Fixed header overlap + fixed admin schedule and sessions editor + feature access control saving fix |
| v1.11   | 2025-01-01 | Edit user data pre-filling fixed + Feature Access toggles fixed + Field Visibility saving fixed |
| v1.12   | 2026-05-19 | Gallery Link Fixes, Full Header Title, Profile photoUrl integration, Logo scaling, and New Versioning scheme |
| v1.0.116 | 2026-05-19 | Massive update: Documents removed, Flights redesign (trips), Sessions/Schedule/Media enhancements, Countdown redesign, and new Logo integration |
| v1.0.866 | 2026-05-19 | Removed staff.json; Staff Directory now derived from users role="staff"; Media Post Audience targeting (Everyone/Roles/Specific Users) implemented. |
| v1.0.867 | 2026-05-19 | Repositioned and restyled Sidebar "Need Help?" button to be smaller (text-xs) and placed after last nav item. |
| v1.0.868 | 2026-05-19 | Force Light Mode Multi-Layer Override applied against Chrome. |
| v1.0.869 | 2026-05-19 | Implemented Coming Soon masking on Dashboard + strict Light Mode config locking. |
| v1.0.870 | 2026-05-19 | Fixed Dashboard coming soon per-user filter, fixed hamburger and sidebar close buttons to white hover. |
| v1.0.871 | 2026-05-19 | Implemented Scheduled Publishing & Coming Soon media checkboxes with appropriate badges |
| v1.0.872 | 2026-05-19 | Updated users.json with 35 specific doctors, fixed Hamburger and Close buttons pure white transparent style. |
| v1.0.873 | 2026-05-19 | Wrap avatar in link to Profile, custom swipe back React hook for iOS/Android, updating JSON with Prague flight & hotel config. |
| v1.0.874 | 2026-05-19 | Migrated hardcoded flight & hotel components into tripInfo context, unified layout rendering across Dashboard and Profile, expanded Admin to edit Global Trip Info. |
| v1.0.875 | 2026-05-19 | Implemented Admin-Editable Navigation Item Labels via appConfig.json and redesigned Dashboard with user-specific welcome header. |
| v1.0.876 | 2026-05-19 | Replaced all hardcoded page titles, feature headings, and back buttons with dynamic labels from appConfig. Defined centralized labels utility with fallbacks. |
| v1.0.877 | 2026-05-19 | Overhauled Admin Panel: removed User Data Control tab, implemented responsive full-width styled select dropdown tab selector on mobile, added User grid view with role filter AND role grouping, integrated real images with automatic fallback to initials. |
| v1.0.878 | 2026-05-19 | Implemented Admin Panel UI refinement: grid view cropped equal aspect 320px/h-48 sizes, localStorage view mode and role filter persistence, unified SuperUserAvatar integration. |
| v1.0.879 | 2026-05-19 | Upgraded Hotel Details Card: replaced map name link URL wrapper with elegant plain text caption and a dedicated outline "View on Map" dashboard button. |
| v1.0.880 | 2026-05-19 | Hardcoded the correct superuser admin photo URL in users.json and updated throughout. |
| v1.0.881 | 2026-05-19 | Removed Social Program and Awards Ceremony everywhere; implemented Admin Panel Drag-to-Reorder Sidebar Navigation with Up/Down fallback controls. |
| v1.0.882 | 2026-05-20 | Implemented isolated Sidebar scrolling (Zones structure to keep Logout reachable at all times) and role-restricted 📞 Call / 💬 WhatsApp buttons with dynamic card heights in the staff directory. |
| v1.0.883 | 2026-05-20 | Replaced full users.json database with correct delegation list, converted viewer Dropbox URLs to direct download links, Egyptian phone normalization utilities, and applied unified auto-formatted direct Calling & WhatsApp buttons across the Staff Directory, Admin table, and My Profile page. |
| v1.0.884 | 2026-05-20 | Replaced and corrected all remaining Dropbox photoUrl links in data/users.json to use the direct download dl.dropboxusercontent.com domain with the dl=0 viewer query suffix removed. |
| v1.0.885 | 2026-05-20 | EUC App — Modify U038 to Staff, Add U039 Admin, Move Sidebar User Card to Top, Staff Visible Pages. |
| v1.0.886 | 2026-05-20 | Implemented Role-Based Page Visibility Matrix, created page access utilities, removed email display from directory cards, and added Admin warning informational note. |
| v1.0.887 | 2026-05-20 | Added seconds display to the existing countdown component for precise four-block real-time tracking (Days, Hours, Minutes, Seconds). |
| v1.0.888 | 2026-05-20 | Normalized role checks in pageAccess.ts to handle casing and whitespace robustly for admin, staff, and doctors. |
| v1.0.889 | 2026-05-20 | Implemented Link Preview Thumbnail Auto-Fetch + Embedded Video Player in News Feed (YouTube, Vimeo, Facebook) of Media posts & viewer modal with clean fallback modes. |
| v1.0.890 | 2026-05-20 | URGENT FIX: Integrated unconditional Nuclear Admin Overrides in page-level access and post visibility guards, normalized roles in Sidebar navigation checks to solve trailing spaces and casing. |
| v1.0.915 | 2026-05-20 | Combined Administration Overhaul: Added Admin Home Quick Panel containing live-stat cards for Users, Posts, Categories, Schedule, features, and config, with instant routing & selection support. |
| v1.0.916 | 2026-05-20 | Updated trip schedule default JSON with real flight & lodging records and complete UI rewrite with custom DetailRow layout, bold uppercase track-labels, bold dark values, yellow links, and unconditional Admin & Staff routing. |
| v1.0.917 | 2026-05-20 | Implemented Countdown control settings, custom timeline entries manager, isolated Flight & Hotel logistics editor, and Day-by-Day Daily trip itinerary planner in Admin page (persisting seamlessly to countdownConfig.json, schedule.json, and tripSchedule.json). |
| v1.0.918 | 2026-05-20 | Fixed reserved key prop warnings in FlightSummaryCard and HotelSummaryCard components to adhere to React and TypeScript expectations seamlessly. |
| v1.0.919 | 2026-05-21 | Added fast canvas image compression, 2-column album card action buttons layout, seamless lightbox zoom capabilities, double tap zoom toggles, swipe back support, and multi-file progress tracking. |
| v1.0.920 | 2026-05-21 | Fixed central message distribution for non-admin users, resolved local caching blockages, and implemented automatic background update state propagation for both new messages and gallery albums. |
| v1.0.921 | 2026-05-21 | Added Admin broadcast message builders and responsive action grids for gallery management. |
| v1.0.922 | 2026-05-21 | CRITICAL BUG FIX: Resolved disappearing albums with 3+ images by implementing sequential raw file photo uploader and optimized SHA/retry handling. |

## Notes
- All data is stored in /data JSON files in the GitHub repo
- The GitHub PAT token must have read/write access to the repo
- Passwords are plain text for now — upgrade to hashing in future versions
- The app is fully client-side — no server needed
