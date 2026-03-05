# 📅 Class Schedule Management System

A full-stack school timetable management application built with **Next.js 14**, **Prisma ORM**, **PostgreSQL** (Supabase), **Tailwind CSS**, and a Neo-Apple glassy design system.

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new)

---

## 📖 Project Overview

ClassSync lets school administrators:
- **Manage teachers** with subjects assigned per teacher
- **Mark daily attendance** — `Present`, `Absent`, or `Leave`
- **View class schedules** by Day, Week, or Month
- **Auto-cancel classes** when the assigned teacher is absent or on leave (computed at query time, no DB mutation)

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 App Router |
| Language | TypeScript |
| ORM | Prisma 5 |
| Database | PostgreSQL (Supabase free tier) |
| Styling | Tailwind CSS + Custom CSS |
| UI Library | Shadcn/UI + Radix UI |
| Calendar | react-day-picker |
| Date utils | date-fns |
| Hosting | Vercel (free tier) |
| DB Hosting | Supabase / Neon (free tier) |

---

## 🧠 Assumptions

### Why "Cancelled" instead of "Substitute" or "Empty"?

When a teacher is marked **Absent** or **Leave**, their classes are displayed as **"Cancelled"** rather than:

- **Substitute**: Implementing substitute logic would require a full substitute teacher assignment system (assigning a free teacher, checking their own schedule and availability). This adds significant complexity beyond the scope of this system and would require additional data modelling (`SubstituteAssignment` entity), UI flows, and business rules. The current architecture is designed to be extended with this feature later.

- **Empty / Hide**: Hiding cancelled classes loses important information. Administrators need to see *which* classes are affected, so they can take action (e.g., notify students, assign substitutes manually). Showing the slot as "Cancelled" communicates clearly that a class *exists but won't run today*.

**Decision**: "Cancelled" is the informationally complete, low-complexity, and honest representation of the state. It is computed **dynamically at query time** — the `ClassSchedule` record in the database is NOT mutated. This preserves the permanent schedule while surfacing the daily operational reality through the API response's `dynamicStatus` field.

---

## 🗃 ER Diagram

```mermaid
erDiagram
    Teacher {
        String id PK
        String name
        String email UK
        DateTime createdAt
    }
    ClassSection {
        String id PK
        String name
        DateTime createdAt
    }
    Subject {
        String id PK
        String name
        String teacherId FK
        DateTime createdAt
    }
    TeacherAttendance {
        String id PK
        String teacherId FK
        DateTime date
        String status
        DateTime createdAt
    }
    ClassSchedule {
        String id PK
        String dayOfWeek
        String startTime
        String endTime
        String classId FK
        String subjectId FK
        String teacherId FK
        String status
        DateTime createdAt
    }

    Teacher ||--o{ Subject : "teaches"
    Teacher ||--o{ TeacherAttendance : "has"
    Teacher ||--o{ ClassSchedule : "assigned to"
    Subject ||--o{ ClassSchedule : "scheduled in"
    ClassSection ||--o{ ClassSchedule : "holds"
```

---

## 🚀 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/class-schedule-system.git
cd class-schedule-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase (PostgreSQL)

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **Sign in** → **New project**
2. Choose a name, strong password, and nearest region
3. Wait for the project to initialise (~1 minute)

#### Get Your Connection Strings

1. In your Supabase dashboard → **Settings** → **Database**
2. Under **Connection string**, select **URI**
3. Copy the **Pooling** connection string (port `6543`) → this is your `DATABASE_URL`
4. Copy the **Direct** connection string (port `5432`) → this is your `DIRECT_URL`

> ⚠️ **Neon alternative**: Go to [neon.tech](https://neon.tech), create a project, and use the pooled connection string as `DATABASE_URL` and the direct string as `DIRECT_URL`.

### 4. Configure Environment Variables

Edit `.env.local`:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

Replace `[PASSWORD]` and `[PROJECT-REF]` with your actual values.

### 5. Push the Schema and Seed the Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Seed with sample data (5 teachers, 3 classes, 6 subjects, 16 schedules)
npx tsx prisma/seed.ts
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Vercel Deployment

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/class-schedule-system.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. In **Environment Variables**, add:
   - `DATABASE_URL` — your Supabase pooled connection string
   - `DIRECT_URL` — your Supabase direct connection string
4. Click **Deploy**

> **Note**: Prisma generates the client at build time. Vercel runs `prisma generate` automatically via the `postinstall` script if you add it, or you can add it to the build command: `npx prisma generate && next build`.

### Vercel Build Command (optional override)

```
npx prisma generate && next build
```

---

## 📡 API Documentation

### Teachers

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/teachers` | — | List all teachers with subject & schedule counts |
| `POST` | `/api/teachers` | `{name, email}` | Create a new teacher |
| `GET` | `/api/teachers/:id` | — | Get teacher + subjects + attendance history |
| `PUT` | `/api/teachers/:id` | `{name?, email?}` | Update teacher fields |
| `DELETE` | `/api/teachers/:id` | — | Delete teacher (cascades subjects, schedules, attendance) |

### Attendance

| Method | Endpoint | Body / Params | Description |
|--------|----------|------|-------------|
| `POST` | `/api/attendance` | `{teacherId, date, status}` | Mark/update attendance (upsert). Status: `Present` \| `Absent` \| `Leave` |
| `GET` | `/api/attendance?date=YYYY-MM-DD` | `?date=` | Get all teachers + their status for a date |

### Subjects

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `GET` | `/api/subjects` | — | List all subjects with teacher info |
| `POST` | `/api/subjects` | `{name, teacherId}` | Create subject assigned to a teacher |

### Schedules

| Method | Endpoint | Body / Params | Description |
|--------|----------|------|-------------|
| `GET` | `/api/schedules` | — | List all schedule entries (no dynamic status) |
| `POST` | `/api/schedules` | `{dayOfWeek, startTime, endTime, classId, subjectId, teacherId}` | Create a schedule entry |
| `GET` | `/api/schedules/[view]?view=day&date=YYYY-MM-DD` | — | Day view with dynamic attendance-based status |
| `GET` | `/api/schedules/[view]?view=week&start=YYYY-MM-DD` | — | Week view grouped by day |
| `GET` | `/api/schedules/[view]?view=month&month=YYYY-MM` | — | Month view across all weekdays |

#### Dynamic Status Logic

All schedule view endpoints (`/api/schedules/[view]`) return a `dynamicStatus` field per entry:

- If teacher has `status = "Absent"` or `status = "Leave"` on that date → `dynamicStatus = "Cancelled"`
- If teacher has `status = "Present"` or **no record** → `dynamicStatus = "Scheduled"`

---

## 📮 Postman Collection

Import `/postman/class-schedule-api.json` into Postman.

Set the `{{baseUrl}}` environment variable to `http://localhost:3000` (local) or your Vercel URL (production).

---

## 🌱 Seed Data

Running `npx tsx prisma/seed.ts` creates:
- **5 teachers**: Dr. Amelia Chen, Mr. James Hartwell, Ms. Priya Nair, Prof. Samuel Owusu, Ms. Elena Vasquez
- **3 class sections**: Class 9A, Class 10B, Class 11C
- **6 subjects**: Mathematics, Physics, English Literature, History, Chemistry, Computer Science
- **16 schedule entries** across Monday–Friday
- **25 attendance records** for the week of March 2–6, 2026 (including some Absent/Leave to demonstrate cancellation logic)

---

## 📁 Project Structure

```
class-schedule-system/
├── app/
│   ├── layout.tsx              # Root layout with nav
│   ├── page.tsx                # Dashboard (bento grid)
│   ├── globals.css             # Design system + Tailwind
│   ├── teachers/               # Teacher list + add form
│   ├── attendance/             # Daily attendance marking
│   ├── schedules/              # Day/Week/Month views
│   └── api/                    # REST API routes (Prisma)
├── components/
│   ├── TeacherForm.tsx
│   ├── AttendanceTable.tsx
│   └── ScheduleCalendar.tsx
├── lib/
│   ├── prisma.ts               # Singleton Prisma client
│   ├── utils.ts                # Date helpers + color utils
│   └── scheduleLogic.ts        # Attendance-based status logic
├── prisma/
│   ├── schema.prisma           # DB models
│   └── seed.ts                 # Sample data
└── postman/
    └── class-schedule-api.json # Postman collection
```

---

## 🧪 Development Commands

```bash
npm run dev          # Start dev server
npm run build        # Build production bundle
npx prisma studio    # Open Prisma Studio (DB GUI)
npx prisma db push   # Push schema changes
npx tsx prisma/seed.ts  # Re-seed database
```
