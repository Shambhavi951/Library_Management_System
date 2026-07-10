# The Reading Nook

**Live Deployed App**: [https://library-management-system-qyp2.onrender.com](https://library-management-system-qyp2.onrender.com)

A complete full-stack **multi-branch intelligent library management platform** built with React, Express, and Microsoft SQL Server.

---

## Table of Contents

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

## Production Cloud Hosting Setup

To deploy the application live on the web, follow these steps:

### 1. Database Setup (Neon PostgreSQL)
1. Sign up for a free PostgreSQL database at [Neon.tech](https://neon.tech/).
2. Create a new project named `LibraryDB`.
3. Locate your **Connection String** (which looks like `postgresql://neondb_owner:password@ep-host.us-east-1.aws.neon.tech/neondb?sslmode=require`).
4. Go to **SQL Editor** in the Neon console, copy the contents of `postgres_schema.sql` (found in the repository root), paste them into the editor, and click **Run** to build the tables.
5. In your local backend `.env` file, temporarily set `DATABASE_URL` to your Neon Connection String and run the seeding script to populate the cloud DB:
   ```bash
   npm run seed
   ```

### 2. Web Application Setup (Render Web Service)
1. Sign up for a free account at [Render.com](https://render.com/).
2. Create a **New Web Service** and connect your GitHub repository.
3. Configure the service with the following settings:
   - **Name**: `library-management-system`
   - **Runtime**: `Node`
   - **Root Directory**: `dbmsproj`
   - **Build Command**: `cd frontend && npm install && npm run build && cd ../backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Instance Type**: `Free` ($0/month)
4. Add the following **Environment Variables**:
   - `DATABASE_URL` = *(Your Neon PostgreSQL connection string)*
   - `JWT_ACCESS_SECRET` = `supersecretaccesskey12345`
   - `JWT_REFRESH_SECRET` = `supersecretrefreshkey12345`
   - `CLIENT_ORIGIN` = `https://your-render-app-name.onrender.com`
5. Click **Deploy Web Service** and your library management system will be live!

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

| Name | Email | Plan | Home Branch | Password |
|------|-------|------|-------------|----------|
| Aarav Sharma | `member@readingnook.local` | STANDARD | Fernhollow | `PremiumPass!2026` |
| Ananya Patel | `premium@readingnook.local` | PREMIUM | Mistgrove | `MemberPass!2026` |

### Extended Member List (all use password `MemberPass!2026`)

| Email | Name | Plan | Branch |
|---|---|---|---|
| arjun.verma@readingnook.local | Arjun Verma | STANDARD | Fernhollow |
| divya.rao@readingnook.local | Divya Rao | PREMIUM | Mistgrove |
| rohan.gupta@readingnook.local | Rohan Gupta | STANDARD | Bramblewick |
| priya.singh@readingnook.local | Priya Singh | PREMIUM | Fernhollow |
| kabir.malhotra@readingnook.local | Kabir Malhotra | STANDARD | Mistgrove |
| ishaan.joshi@readingnook.local | Ishaan Joshi | STANDARD | Bramblewick |
| vikram.reddy@readingnook.local | Vikram Reddy | PREMIUM | Fernhollow |
| meera.nair@readingnook.local | Meera Nair | STANDARD | Mistgrove |
| aditya.sen@readingnook.local | Aditya Sen | PREMIUM | Bramblewick |
| diya.bose@readingnook.local | Diya Bose | STANDARD | Fernhollow |
| sanjay.kumar@readingnook.local | Sanjay Kumar | STANDARD | Fernhollow |
| neha.deshmukh@readingnook.local | Neha Deshmukh | PREMIUM | Mistgrove |
| amit.pandey@readingnook.local | Amit Pandey | STANDARD | Bramblewick |
| riya.choudhury@readingnook.local | Riya Choudhury | PREMIUM | Fernhollow |
| dev.kulkarni@readingnook.local | Dev Kulkarni | STANDARD | Mistgrove |
| pooja.iyer@readingnook.local | Pooja Iyer | PREMIUM | Bramblewick |
| rahul.deshmukh@readingnook.local | Rahul Deshmukh | STANDARD | Fernhollow |
| sneha.gowda@readingnook.local | Sneha Gowda | PREMIUM | Mistgrove |
| vinay.saxena@readingnook.local | Vinay Saxena | STANDARD | Bramblewick |
| akash.prasad@readingnook.local | Akash Prasad | PREMIUM | Fernhollow |
| kiran.bhat@readingnook.local | Kiran Bhat | STANDARD | Fernhollow |
| anil.kulkarni@readingnook.local | Anil Kulkarni | PREMIUM | Mistgrove |
| sunita.shinde@readingnook.local | Sunita Shinde | STANDARD | Bramblewick |
| rahul.apte@readingnook.local | Rahul Apte | PREMIUM | Fernhollow |
| priyanka.bhatia@readingnook.local | Priyanka Bhatia | STANDARD | Mistgrove |
| sachin.gokhale@readingnook.local | Sachin Gokhale | STANDARD | Bramblewick |
| manish.gokhale@readingnook.local | Manish Gokhale | PREMIUM | Fernhollow |
| vijay.mahajan@readingnook.local | Vijay Mahajan | STANDARD | Mistgrove |
| deepa.mehta@readingnook.local | Deepa Mehta | PREMIUM | Bramblewick |
| rajesh.dave@readingnook.local | Rajesh Dave | STANDARD | Fernhollow |
| alisha.trivedi@readingnook.local | Alisha Trivedi | STANDARD | Fernhollow |
| raman.pandya@readingnook.local | Raman Pandya | PREMIUM | Mistgrove |
| sharad.vyas@readingnook.local | Sharad Vyas | STANDARD | Bramblewick |
| alok.shukla@readingnook.local | Alok Shukla | PREMIUM | Fernhollow |
| sameer.parikh@readingnook.local | Sameer Parikh | STANDARD | Mistgrove |
| kavita.sanghavi@readingnook.local | Kavita Sanghavi | STANDARD | Bramblewick |
| abhay.dave@readingnook.local | Abhay Dave | PREMIUM | Fernhollow |
| harish.bhat@readingnook.local | Harish Bhat | STANDARD | Mistgrove |
| aarti.chokshi@readingnook.local | Aarti Chokshi | PREMIUM | Bramblewick |
| abhishek.dave@readingnook.local | Abhishek Dave | STANDARD | Fernhollow |
| kirti.shinde@readingnook.local | Kirti Shinde | STANDARD | Fernhollow |
| siddharth.apte@readingnook.local | Siddharth Apte | PREMIUM | Mistgrove |
| komal.dave@readingnook.local | Komal Dave | STANDARD | Bramblewick |
| ajay.mahajan@readingnook.local | Ajay Mahajan | PREMIUM | Fernhollow |
| meenal.sanghavi@readingnook.local | Meenal Sanghavi | STANDARD | Mistgrove |
| swati.trivedi@readingnook.local | Swati Trivedi | STANDARD | Bramblewick |
| ritu.pandya@readingnook.local | Ritu Pandya | PREMIUM | Fernhollow |
| karthik.vyas@readingnook.local | Karthik Vyas | STANDARD | Mistgrove |
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

- **19 returned borrows** (with history) — some with overdue fines
- **19 active borrows** — 4 are currently overdue
- **5 book holds** ready for pickup (ON_HOLD)
- **3 queued reservations** (waiting for Clean Code and Dune)
- **4 branch transfers** (REQUESTED / IN_TRANSIT / SHELVED)
- **2 quality checks** logged
- **Several acquisition requests** from members

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

- **JWT auth** with access + refresh token rotation
- **Multi-branch catalog** with per-branch inventory tracking
- **Reservation queue** with automatic hold promotion on return
- **Book holds** with expiry tracking
- **Cross-branch transfers** with status pipeline (REQUESTED → IN_TRANSIT → ARRIVED → SHELVED)
- **Acquisition requests** — member-driven procurement pipeline
- **In-app notifications** for members and admins at every stage
- **Fine system** — auto-calculated on return (₹25/day, configurable by owner)
- **Quality checks** — copy condition tracking with maintenance flags
- **Reviews & Reading Lists** for members
- **Analytics dashboard** for admins and owner
- **PREMIUM membership** — higher borrow limits, cross-branch switching, priority queues

---

## Test Scenarios

### Scenario 1: Acquisition Request → Procurement → Member Alert

1. Login as `member@readingnook.local` → Submit an acquisition request (e.g., a book not in the catalog)
2. Login as `fern.admin@readingnook.local` → Check **Notifications** → See `NEW_ACQUISITION_REQUEST`
3. Go to **Acquisitions** → Progress status: `REQUESTED → UNDER_REVIEW → ORDERED → ARRIVED → CATALOGED → AVAILABLE`
4. Login back as the member → Check **Notifications** → See: *"[Book title] is now available at the library!"*

### Scenario 2: Fine System

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
| Cross-branch borrowing | No | Yes |
| Switch preferred branch | No | Yes |
| Reading lists | 1 | 10 |
