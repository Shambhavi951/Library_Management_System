# The Reading Nook

Complete full-stack React + Express + Microsoft SQL Server application for a multi-branch intelligent library management platform.

## Stack

- Frontend: React, Vite, React Router, Zustand
- Backend: Node.js, Express, JWT, bcrypt
- Database: Microsoft SQL Server in Docker
- Query layer: `mssql` with parameterized SQL
- API: REST

## Startup

1. Copy environment files:

   ```powershell
   Copy-Item .env.example .env
   Copy-Item backend/.env.example backend/.env
   Copy-Item frontend/.env.example frontend/.env
   ```

2. Start SQL Server:

   ```powershell
   docker compose up -d
   ```

3. Create `LibraryDB` and run your existing schema file. This repo intentionally does not generate the schema file. To smoke-test SQL connectivity with the included `test.sql`, run:

   ```powershell
   npm run db:test
   ```

4. Install dependencies and seed:

   ```powershell
   npm install
   npm run install:all
   npm run seed
   ```

5. Run the app:

   ```powershell
   npm run dev
   ```

Frontend: `http://localhost:5173`

Backend: `http://localhost:4000`

## Seeded Accounts

- Member: `member@readingnook.local` / `MemberPass!2026`
- Premium member: `premium@readingnook.local` / `PremiumPass!2026`
- Fernhollow admin: `fern.admin@readingnook.local` / `AdminPass!2026`
- Mistgrove admin: `mist.admin@readingnook.local` / `AdminPass!2026`
- Bramblewick admin: `bramble.admin@readingnook.local` / `AdminPass!2026`
- Owner: `owner@readingnook.local` / `OwnerPass!2026`

## Branch Identities

- Fernhollow Branch: earthy brown accents
- Mistgrove Branch: forest green accents
- Bramblewick Branch: soft blue accents

The supplied antique CSS visual language is preserved and extended in `frontend/src/styles/antique.css` and `frontend/src/styles/app.css`.
