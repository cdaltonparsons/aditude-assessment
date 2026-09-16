# Publisher Management System

A multi-tenant platform for managing publishers across organizations. This repository is the starting point for a technical interview assessment.


---

## Prerequisites

- Node.js 18 or later
- npm 9 or later

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app will start but most functionality is stubbed out — that's intentional. See `TASKS.md`.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3000 |
| `npm run build` | Build for production |

Database setup uses Prisma + SQLite — run `npm run setup` to generate the client, then `npm run db:push` and `npm run db:seed` once your schema and seed script exist.

---

## Project Structure

```
├── src/
│   └── app/
│       ├── page.tsx           # Dashboard page (blank — your starting point)
│       ├── layout.tsx         # Minimal layout
│       └── globals.css
├── example.env
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── TASKS.md                   # Interview tasks
```
---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Prisma + SQLite (pre-wired — see `package.json` scripts and `example.env`)
