# FUTURE ENGLISH CENTER

**Tagline:** *"Master English. Unlock Your Future."*

Fullstack English-learning web platform combining a modern educational application (interactive lessons, learning paths, AI tutor, assessments, certificates, PDF reports, community, and admin studio) with a vibrant **Educational Game Center** powered by Phaser 3 and Three.js.

## Quick Start

### 1. Database Setup
The project uses **PostgreSQL + Prisma**. By default, `backend/.env` is configured to use the bundled local PostgreSQL (PGlite) server on port `5433` so you can run the entire fullstack app without installing Postgres separately (or point `DATABASE_URL` in `backend/.env` to your own PostgreSQL instance).

```bash
# Push schema and seed curriculum, assessments, games, cosmetics, and demo accounts:
node backend/scripts/setup-local.mjs
```

### 2. Run in Development
```bash
# Recommended on Windows PowerShell (avoids npm.ps1 execution policy errors):
node start.mjs

# Or using npm.cmd directly:
npm.cmd run dev:all
```

Open `http://localhost:5173`.

### Demo Accounts (Password: `Password123!`)
- **Student:** `student@futureenglish.test` (`alex_learner`)
- **Teacher / Content Manager:** `teacher@futureenglish.test` (`ms_nadia`)
- **Administrator:** `admin@futureenglish.test` (`admin_fec`)

### 3. Tests & Production Build
```bash
npm run typecheck
npm run test -w frontend
node backend/scripts/run-tests.mjs
npm run build
```

### Optional Server-Side AI Tutor Keys
In `backend/.env`, set `AI_PROVIDER=gemini` with `GEMINI_API_KEY` (or `AI_PROVIDER=openai` with `OPENAI_API_KEY`). With `AI_PROVIDER=none`, the server runs the built-in English grammar/writing/conversation engine automatically.
