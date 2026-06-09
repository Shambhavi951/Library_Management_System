# 📚 The Reading Nook

A complete full-stack **multi-branch intelligent library management platform** built with React, Express, and Microsoft SQL Server.

---

## 🗂️ Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Running](#setup--running)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Seeded Accounts](#seeded-accounts)
- [Seeded Data Overview](#seeded-data-overview)
- [API Reference](#api-reference)
- [Roles & Permissions](#roles--permissions)
- [Key Features](#key-features)
- [Test Scenarios](#test-scenarios)
- [Branch Identities](#branch-identities)
- [Fine System](#fine-system)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router, Zustand |
| **Backend** | Node.js, Express.js, JWT, bcrypt |
| **Database** | Microsoft SQL Server 2022 (Docker) |
| **Query Layer** | `mssql` with parameterized SQL |
| **Auth** | JWT access + refresh token pattern |
| **API Style** | REST |

---

## Project Structure

```
dbmsproj/
├── backend/
│   └── src/
│       ├── auth/           # Password hashing, JWT helpers
│       ├── controllers/    # Route handlers (auth, member, admin, owner, catalog)
│       ├── database/       # DB connection + seed script
│       ├── middleware/      # JWT authentication, role guards, validation
│       ├── routes/         # Express routers
│       └── services/       # Business logic layer
├── frontend/
│   └── src/
│       └── styles/
│           ├── antique.css  # Core antique visual language
│           └── app.css      # App-level overrides
├── scripts/
│   └── run-sql.ps1          # Helper to run .sql files against Docker container
├── schema.sql               # Full database schema
├── reset.sql                # Drops all tables (for fresh re-schema)
├── test.sql                 # Smoke test for DB connectivity
└── docker-compose.yml       # SQL Server container definition
```

---

## Prerequisites

Make sure the following are installed before you begin:

- **Docker Desktop** (must be running) — [docker.com](https://www.docker.com/products/docker-desktop/)
- **Node.js v18+** — [nodejs.org](https://nodejs.org/)
- **npm** (bundled with Node.js)
- **PowerShell** (Windows built-in)

---

## Setup & Running

Open **PowerShell** and run these steps in order from the project root:

### 1. Navigate to project root

```powershell
cd "C:\path\to\dbms_proj_final\dbmsproj"
```

### 2. Copy environment files

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

### 3. Start SQL Server in Docker

```powershell
docker compose up -d
```

> Wait ~30 seconds for the container to be fully healthy before continuing.

### 4. Verify database connectivity

```powershell
npm run db:test
```

> You should see `LibraryDB` printed. If it fails, wait 15 more seconds and retry.

### 5. Apply the database schema

```powershell
powershell -ExecutionPolicy Bypass -File scripts\run-sql.ps1 -File schema.sql
```

> **If you see "object already exists" errors**, the DB has a stale schema. Reset it first:
> ```powershell
> docker exec library-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Password@123456" -C -Q "DROP DATABASE LibraryDB; CREATE DATABASE LibraryDB;"
> powershell -ExecutionPolicy Bypass -File scripts\run-sql.ps1 -File schema.sql
> ```

### 6. Install all dependencies

```powershell
npm run install:all
```

### 7. Seed the database

```powershell
npm run seed
```

### 8. Start the application

```powershell
npm run dev
```

---

## Running URLs

| Service | URL |
|---|---|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:4000 |

---

## Stopping the App

```powershell
# Stop frontend + backend (Ctrl+C in the terminal running npm run dev)

# Stop the database container
docker compose down
```

---

## Environment Variables

The `.env` / `.env.example` at the root and in `backend/` use:

| Variable | Default | Description |
|---|---|---|
| `MSSQL_SA_PASSWORD` | `Password@123456` | SQL Server SA password |
| `MSSQL_PORT` | `1433` | SQL Server port |
| `DB_NAME` | `LibraryDB` | Database name |
| `DB_USER` | `sa` | DB username |
| `DB_PASSWORD` | `Password@123456` | DB password |
| `DB_SERVER` | `localhost` | DB host |
| `DB_PORT` | `1433` | DB port |
| `JWT_ACCESS_SECRET` | *(change this)* | Secret for access tokens |
| `JWT_REFRESH_SECRET` | *(change this)* | Secret for refresh tokens |
| `JWT_ACCESS_EXPIRES` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES` | `7d` | Refresh token TTL |
| `CLIENT_ORIGIN` | `http://localhost:5173` | CORS origin |
| `PORT` | `4000` | Backend server port |

---

## Database

### Schema Highlights

| Table | Purpose |
|---|---|
| `branches` | Library branch locations |
| `members` | Member profiles (home + preferred branch) |
| `user_accounts` | Login credentials + role |
| `membership_plans` | STANDARD / PREMIUM plan config |
| `publications` + `books` | Book catalog |
| `inventory_copies` | Physical book copies per branch |
| `borrowing_records` | Active + returned borrow records |
| `borrowing_history` | Completed borrow log |
| `reservation_queue` | Book reservation/waitlist |
| `book_holds` | ON_HOLD status for a specific copy |
| `branch_transfers` | Cross-branch copy movement |
| `acquisition_requests` | Member-requested new titles |
| `notifications` | In-app alerts for members + admins |
| `quality_checks` | Condition inspection log |
| `publication_reviews` | Member star ratings + text reviews |
| `reading_lists` | Member curated lists |
| `owner_settings` | Global fine rate, hold hours, plan costs |

### Useful Scripts

```powershell
# Run schema (create tables)
powershell -ExecutionPolicy Bypass -File scripts\run-sql.ps1 -File schema.sql

# Reset DB (drop all tables)
powershell -ExecutionPolicy Bypass -File scripts\run-sql.ps1 -File reset.sql

# Smoke test connectivity
npm run db:test

# Re-seed data
npm run seed
```

---

## Seeded Accounts

### Special Roles

| Role | Email | Password |
|---|---|---|
| **Owner** | `owner@readingnook.local` | `OwnerPass!2026` |
| **Fernhollow Admin** | `fern.admin@readingnook.local` | `AdminPass!2026` |
| **Mistgrove Admin** | `mist.admin@readingnook.local` | `AdminPass!2026` |
| **Bramblewick Admin** | `bramble.admin@readingnook.local` | `AdminPass!2026` |

### Default Test Members

| Name | Email | Plan | Home Branch |
|---|---|---|---|
| Mira Pages | `member@readingnook.local` | STANDARD | Fernhollow |
| Theo Quill | `premium@readingnook.local` | PREMIUM | Mistgrove |

> Password for both: see above table

### Extended Member List (all use password `MemberPass!2026`)

| Email | Name | Plan | Branch |
|---|---|---|---|
| `alice.reading@readingnook.local` | Alice Smith | STANDARD | Fernhollow |
| `bob.reads@readingnook.local` | Bob Johnson | PREMIUM | Mistgrove |
| `charlie.bookworm@readingnook.local` | Charlie Brown | STANDARD | Bramblewick |
| `diana.prince@readingnook.local` | Diana Prince | PREMIUM | Fernhollow |
| `ethan.hunt@readingnook.local` | Ethan Hunt | STANDARD | Mistgrove |
| `fiona.gallagher@readingnook.local` | Fiona Gallagher | STANDARD | Bramblewick |
| `george.rr@readingnook.local` | George Martin | PREMIUM | Fernhollow |
| `hannah.baker@readingnook.local` | Hannah Baker | STANDARD | Mistgrove |
| `ian.malcolm@readingnook.local` | Ian Malcolm | PREMIUM | Bramblewick |
| `julia.roberts@readingnook.local` | Julia Roberts | STANDARD | Fernhollow |
| `karen.smith@readingnook.local` | Karen Smith | STANDARD | Fernhollow |
| `leo.dicaprio@readingnook.local` | Leo DiCaprio | PREMIUM | Mistgrove |
| `monica.geller@readingnook.local` | Monica Geller | STANDARD | Bramblewick |
| `neil.armstrong@readingnook.local` | Neil Armstrong | PREMIUM | Fernhollow |
| `olivia.rodrigo@readingnook.local` | Olivia Rodrigo | STANDARD | Mistgrove |
| `peter.parker@readingnook.local` | Peter Parker | PREMIUM | Bramblewick |
| `quentin.tarantino@readingnook.local` | Quentin Tarantino | STANDARD | Fernhollow |
| `rachel.green@readingnook.local` | Rachel Green | PREMIUM | Mistgrove |
| `sam.winchester@readingnook.local` | Sam Winchester | STANDARD | Bramblewick |
| `tony.stark@readingnook.local` | Tony Stark | PREMIUM | Fernhollow |

---

## Seeded Data Overview

### Books (51 titles across 8 subjects)

| Subject | Sample Titles |
|---|---|
| Fiction | 1984, To Kill a Mockingbird, The Great Gatsby, Pride and Prejudice, The Alchemist |
| Sci-Fi & Fantasy | Dune, The Hobbit, Lord of the Rings, Frankenstein, Brave New World, Fahrenheit 451 |
| Mystery & Thriller | Gone Girl, The Silent Patient, Da Vinci Code, Murder on the Orient Express |
| Technology | Clean Code, Design Patterns, Intro to Algorithms, The Pragmatic Programmer |
| Self-Help & Business | Atomic Habits, Zero to One, The Lean Startup, Deep Work, Thinking Fast and Slow |
| Biography & Memoir | Educated, Steve Jobs, Man's Search for Meaning, Diary of a Young Girl |
| History | Sapiens, The Book Thief, The Art of War |
| Science & Nature | Cosmos, A Brief History of Time, Brief Answers to the Big Questions |

Each book gets **1–3 physical copies per branch** based on popularity score (~150–300 total copies).

### Pre-seeded Activity

- ✅ **19 returned borrows** (with history) — some with overdue fines
- 📖 **19 active borrows** — 4 are currently overdue
- 📌 **5 book holds** ready for pickup (ON_HOLD)
- ⏳ **3 queued reservations** (waiting for Clean Code and Dune)
- 🚚 **4 branch transfers** (REQUESTED / IN_TRANSIT / SHELVED)
- 🔍 **2 quality checks** logged
- 📋 **Several acquisition requests** from members

---

## API Reference

Base URL: `http://localhost:4000`

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/login` | Public | Login, returns access + refresh token |
| `POST` | `/refresh` | Public | Refresh access token |
| `GET` | `/me` | Authenticated | Get current user profile |
| `POST` | `/logout` | Authenticated | Logout |
| `POST` | `/register` | Admin/Owner | Register a new user |

### Catalog — `/api/catalog` (Public)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/branches` | List all branches |
| `GET` | `/books` | Search books (query params: title, author, subject, branch) |
| `GET` | `/books/:id` | Book details |
| `GET` | `/books/:id/intelligence` | Smart availability + reservation info |

### Member — `/api/member` (Role: MEMBER)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/borrow` | Borrow an available book |
| `POST` | `/borrow/hold` | Convert a hold into a borrow |
| `GET` | `/history` | Borrow history |
| `GET` | `/fines` | Outstanding fines |
| `POST` | `/reservations` | Reserve a book |
| `GET` | `/reservations` | My active reservations |
| `DELETE` | `/reservations/:id` | Cancel a reservation |
| `POST` | `/acquisitions` | Request a new book title |
| `GET` | `/acquisitions` | My acquisition requests |
| `GET` | `/notifications` | My notifications |
| `PATCH` | `/notifications/:id/read` | Mark notification as read |
| `POST` | `/transfers` | Request a cross-branch copy transfer |
| `GET` | `/transfers` | View transfers |
| `POST` | `/switch-branch` | Switch preferred branch (PREMIUM only) |
| `POST` | `/upgrade` | Upgrade membership plan |
| `POST` | `/reviews` | Submit a book review |
| `GET` | `/reviews` | My reviews |
| `POST` | `/reading-lists` | Create a reading list |
| `GET` | `/reading-lists` | My reading lists |
| `POST` | `/reading-lists/:id/items` | Add book to reading list |

### Admin — `/api/admin` (Role: ADMIN or OWNER)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/inventory` | Branch inventory |
| `GET` | `/publications` | All publications |
| `POST` | `/publications` | Add new publication |
| `POST` | `/copies` | Add physical copy |
| `PATCH` | `/copies/:id` | Update copy status/condition |
| `POST` | `/returns` | Process a book return |
| `POST` | `/quality-checks` | Log quality inspection |
| `GET` | `/transfers` | Branch transfer list |
| `PATCH` | `/transfers/:id` | Update transfer status |
| `GET` | `/acquisitions` | View acquisition requests |
| `PATCH` | `/acquisitions/:id` | Update acquisition status |
| `GET` | `/analytics` | Branch analytics dashboard |
| `GET` | `/notifications` | Admin notifications |
| `POST` | `/approve-hold` | Approve hold for checkout |
| `GET` | `/members` | List members |
| `POST` | `/members` | Create member |
| `PUT` | `/members/:id` | Update member |

### Owner — `/api/owner` (Role: OWNER)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/settings` | Get global settings |
| `POST` | `/settings` | Update fine rate, hold hours, plan costs |
| `GET` | `/analytics` | Global analytics |
| `GET` | `/admins` | List all admins |
| `POST` | `/admins` | Create admin |
| `PUT` | `/admins/:id` | Edit admin |
| `POST` | `/branches` | Create new branch |
| `GET` | `/members` | View all members |
| `POST` | `/members` | Create member |
| `PUT` | `/members/:id` | Update member |
| `GET` | `/notifications` | Owner-level notifications |

---

## Roles & Permissions

| Role | Can Do |
|---|---|
| **MEMBER** | Browse catalog, borrow, reserve, request acquisitions, manage reading lists, view fines/notifications |
| **ADMIN** | All member ops + process returns, manage inventory, handle transfers, update acquisitions, view analytics for their branch |
| **OWNER** | All admin ops + manage admins, create branches, update global settings (fine rate, hold hours), view cross-branch analytics |

---

## Key Features

- 🔐 **JWT auth** with access + refresh token rotation
- 📚 **Multi-branch catalog** with per-branch inventory tracking
- ⏳ **Reservation queue** with automatic hold promotion on return
- 📌 **Book holds** with expiry tracking
- 🚚 **Cross-branch transfers** with status pipeline (REQUESTED → IN_TRANSIT → ARRIVED → SHELVED)
- 📋 **Acquisition requests** — member-driven procurement pipeline
- 🔔 **In-app notifications** for members and admins at every stage
- 💰 **Fine system** — auto-calculated on return (₹25/day, configurable by owner)
- 🔍 **Quality checks** — copy condition tracking with maintenance flags
- ⭐ **Reviews & Reading Lists** for members
- 📊 **Analytics dashboard** for admins and owner
- 👑 **PREMIUM membership** — higher borrow limits, cross-branch switching, priority queues

---

## Test Scenarios

### 📋 Scenario 1: Acquisition Request → Procurement → Member Alert

1. Login as `member@readingnook.local` → Submit an acquisition request (e.g., a book not in the catalog)
2. Login as `fern.admin@readingnook.local` → Check **Notifications** → See `NEW_ACQUISITION_REQUEST`
3. Go to **Acquisitions** → Progress status: `REQUESTED → UNDER_REVIEW → ORDERED → ARRIVED → CATALOGED → AVAILABLE`
4. Login back as the member → Check **Notifications** → See: *"[Book title] is now available at the library!"*

### 💰 Scenario 2: Fine System

Pre-seeded overdue members to test with (all password: `MemberPass!2026`):

| Member Email | Book | Days Overdue | Expected Fine |
|---|---|---|---|
| `bob.reads@readingnook.local` | Dune | ~11 days | ~₹275 |
| `charlie.bookworm@readingnook.local` | Atomic Habits | ~4 days | ~₹100 |
| `leo.dicaprio@readingnook.local` | Thinking in Java | ~14 days | ~₹350 |
| `peter.parker@readingnook.local` | Girl with the Dragon Tattoo | ~13 days | ~₹325 |

1. Login as the member → **Fines** section → View outstanding fine
2. Login as their branch admin → **Returns** → Process return using copy ID
3. System auto-calculates: `fine = overdue_days × ₹25`
4. Login back as member → Fine is now recorded on the returned borrow

---

## Fine System

| Setting | Value |
|---|---|
| Fine per day | ₹25 (configurable by owner) |
| Borrow period | 14 days |
| Calculation | `ceil((return_date - due_date) in days) × fine_per_day` |
| Who processes returns | Branch admin or owner |
| Where fines appear | Member's `/api/member/fines` endpoint |

---

## Branch Identities

| Branch | Accent Color | Address |
|---|---|---|
| **Fernhollow Branch** | Earthy brown | 17 Walnut Lane |
| **Mistgrove Branch** | Forest green | 82 Moss Street |
| **Bramblewick Branch** | Soft blue | 4 Bluebell Court |

Visual language defined in `frontend/src/styles/antique.css` and `frontend/src/styles/app.css`.

---

## Membership Plans

| Feature | STANDARD (₹299/mo) | PREMIUM (₹799/mo) |
|---|---|---|
| Max active borrows | 3 | 8 |
| Reservation limit | 5 | 15 |
| Hold duration | 24 hours | 72 hours |
| Queue priority | Normal | High |
| Cross-branch borrowing | ❌ | ✅ |
| Switch preferred branch | ❌ | ✅ |
| Reading lists | 1 | 10 |
