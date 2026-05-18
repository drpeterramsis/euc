# EUC – EVA URO CLUB
Version: 1.5

## What is EUC?
EUC (EVA URO CLUB) is a professional conference trip management WebApp
built for medical delegations attending scientific conferences.
Current event: Prague Conference 2025.

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
| staff   | Profile, Flight, Hotel, Schedule                  |

## Project Structure
/data              → JSON files (users, schedule, sessions, settings)
/src/components    → Reusable UI components (Sidebar, Header, Footer)
/src/pages         → App pages (Login, Dashboard, Profile, etc.)
/src/utils         → Helper functions (auth, github read/write)

## JSON Files (act as the database)
| File             | Purpose                            |
|------------------|------------------------------------|
| users.json       | All user accounts and profile data |
| schedule.json    | Trip and conference daily schedule |
| sessions.json    | Scientific conference sessions     |
| settings.json    | Feature flags and coming soon list |

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

## Default Login Credentials (for testing)
| Username   | Password   | Role    |
|------------|------------|---------|
| admin      | admin123   | admin   |
| dr.ahmed   | password123| doctor  |

## Version History
| Version | Date       | Changes                                      |
|---------|------------|----------------------------------------------|
| v1.0    | 2025-01-01 | Initial app build                            |
| v1.1    | 2025-01-01 | Added admin user + footer versioning         |
| v1.2    | 2025-01-01 | Added README + code comments across all files|
| v1.3    | 2025-01-01 | Fixed login white screen + session bug + GitHub fallback + env variable fix |
| v1.4    | 2025-01-01 | Fixed metadata title + admin profile bug + Vercel 404 routing fix |
| v1.5    | 2025-01-01 | Major fix: logout + pages loading + caching + auth guard + performance |

## Notes
- All data is stored in /data JSON files in the GitHub repo
- The GitHub PAT token must have read/write access to the repo
- Passwords are plain text for now — upgrade to hashing in future versions
- The app is fully client-side — no server needed
