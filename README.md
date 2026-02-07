# ArtMorph

AI-powered image style-transfer application that preserves pose, depth, and composition while applying artistic transformations.

Built with a modern full-stack architecture — Express backend, Next.js frontend, Supabase for auth & storage, and FLUX.1-Kontext for AI generation.

---

## Tech Stack

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL (Supabase-hosted)
- **Auth:** Supabase GoTrue + JWT
- **Storage:** Supabase Storage (uploaded & generated image buckets)
- **AI Model:** `black-forest-labs/FLUX.1-Kontext-dev` via `@gradio/client`

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Icons:** Lucide React
- **Fonts:** Playfair Display + Inter

---

## Features

- **22 artistic styles** across 5 curated sections (Classic, Digital, Traditional, Experimental, Cinematic)
- **3-step creation flow** — Upload → Choose Style → Generate
- **Dashboard** with stats, gallery lightbox, activity feed with filters
- **Profile management** — personal info, avatar, change password, delete account
- **Generation limits** — free tier (5 generations), dev mode bypass with passkey
- **Dark / Light theme** toggle
- **Fully responsive** — mobile, tablet, and desktop

---

## Project Structure

```
ArtMorph/
├── src/                    # Express backend
│   ├── config/             # Env, Prisma, Supabase clients
│   ├── controllers/        # Route handlers
│   ├── middleware/          # Auth, error handling
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic
│   ├── utils/              # JWT, validation, prompts
│   └── workers/            # Background job runner
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Style section & config seeder
├── client/                 # Next.js frontend
│   ├── app/                # Pages (auth, dashboard, create, profile, styles)
│   ├── components/         # Navbar, StyleBrowser, UploadCard, etc.
│   ├── lib/                # API client, auth helpers
│   └── store/              # Zustand stores
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (for DB, Auth, and Storage)
- A [Hugging Face](https://huggingface.co) API token

### 1. Clone the repo

```bash
git clone https://github.com/etk18/ArtMorph.git
cd ArtMorph
```

### 2. Install dependencies

```bash
# Backend
npm install

# Frontend
cd client && npm install && cd ..
```

### 3. Configure environment

Create a `.env` file in the project root:

```env
NODE_ENV=development
PORT=3000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_JWT_ISSUER=https://your-project.supabase.co/auth/v1
SUPABASE_JWT_AUDIENCE=authenticated
SUPABASE_STORAGE_BUCKET=uploaded_images
SUPABASE_GENERATED_BUCKET=generated_images

# Database
DATABASE_URL=postgresql://...?pgbouncer=true
DIRECT_URL=postgresql://...

# Hugging Face
HF_API_TOKEN=hf_your_token
HF_DEFAULT_MODEL=stabilityai/stable-diffusion-xl-base-1.0
HF_REQUEST_TIMEOUT_MS=60000

# Upload
UPLOAD_MAX_BYTES=10485760
PREVIEW_URL_TTL_SECONDS=600
GENERATED_URL_TTL_SECONDS=600

# Auth cookies
AUTH_COOKIE_NAME=artmorph_refresh
AUTH_COOKIE_SAMESITE=lax
AUTH_COOKIE_SECURE=false

# Dev mode
DEV_PASSKEY=your-passkey
FREE_GENERATION_LIMIT=5
```

### 4. Set up the database

```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

> **Note:** `prisma migrate dev` may hang with Supabase PgBouncer pooling. Use `db push` or run migrations via the `DIRECT_URL`.

### 5. Set up Supabase Storage

Create two public buckets in your Supabase dashboard:
- `uploaded_images`
- `generated_images`

### 6. Run the app

```bash
# Terminal 1 — Backend (port 3000)
npm run dev

# Terminal 2 — Frontend (port 3001)
cd client && npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/profile` | Get user profile |
| PATCH | `/api/profile` | Update profile |
| POST | `/api/profile/change-password` | Change password |
| DELETE | `/api/profile` | Delete account |
| POST | `/api/profile/dev-mode` | Toggle dev mode |
| GET | `/api/profile/generation-limit` | Get generation quota |
| POST | `/api/upload` | Upload image |
| GET | `/api/styles/sections` | List style sections & configs |
| POST | `/api/jobs` | Create generation job |
| GET | `/api/jobs` | List user jobs |
| GET | `/api/jobs/:id` | Get job status |
| GET | `/api/health` | Health check |

---

## Dev Mode

Free users are limited to 5 generations. To bypass:

1. Click the `</>` icon in the navbar
2. Enter the passkey defined in `DEV_PASSKEY`
3. Unlimited generations while dev mode is active

---

## Author

**Eesh Sagar Singh**

---

## License

This project is for educational and personal use.
