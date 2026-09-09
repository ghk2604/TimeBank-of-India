# TimeBank of India 🇮🇳

> **"Your Time. Your Knowledge. Your Growth."**  
> *India's Peer-to-Peer Skill Learning and Knowledge Exchange Network*

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_ACID-003B57?logo=sqlite)](https://sqlite.org/)

---

## 🌟 Overview

**TimeBank of India** is a nationwide peer-to-peer knowledge and skill-learning platform where Indian learners and mentors exchange skills using **Time Credits (1 Hour = 1 Credit)** instead of monetary transactions.

### Core Model:
$$\text{Learn a Skill} \longrightarrow \text{Develop Knowledge} \longrightarrow \text{Prove Competency} \longrightarrow \text{Teach Other Users} \longrightarrow \text{Earn Time Credits} \longrightarrow \text{Grow}$$

---

## 🚫 Strict Scope Enforcement

TimeBank of India is **strictly an educational and skill-sharing network**:
* ✅ **Permitted**: Programming, AI/ML, UI/UX, Mathematics, Physics, Spoken English, Hindi, Telugu, and Professional Skills.
* ❌ **Prohibited**: Gardening, cooking, household chores, physical repairs, transportation, volunteering, or community service.

---

## ⚡ Key Innovations

1. **Controlled Credit Borrowing**:
   * New users can borrow down to **-1.0 Credit** to begin learning immediately.
   * Scales up to **-3.0 Credits** for verified and trusted mentors.
2. **Credit Recovery Recommendation Engine**:
   * Users in deficit are automatically matched with learners looking for their verified skills to recover their balance through teaching.
3. **24-Hour Booking Rule**:
   * Teachers have exactly 24 hours to respond. Unanswered requests auto-expire with zero credit penalty.
4. **Learning Goal Contract**:
   * Defined deliverables and outcomes agreed before every session, evaluated upon completion.
5. **Two-Way Atomic Credit Transfer**:
   * Credits transfer *only* after two-way completion confirmation with SQLite ACID transactions and rollback on disputes.
6. **Digital Skill Passport**:
   * Official verified credential tracking learning hours, teaching contributions, and unlocked badges.
7. **Skill Proof & Readiness Engine**:
   * Interactive assessments and practical task submissions generating an explainable 0–100 Readiness Score.
8. **Knowledge Gap Detector**:
   * Diagnostic questionnaires to identify missing foundations before starting complex learning paths.
9. **Skill Swap Recommendations**:
   * Automatic detection of complementary peer exchange pairs (*User A teaches X/wants Y $\longleftrightarrow$ User B teaches Y/wants X*).
10. **Knowledge Exchange Chain**:
    * Interactive pedagogical tree tracking direct and downstream community reach.
11. **Account Access & Invitation Keys**:
    * Full login, registration with Indian states/cities, and verified access key generator granting bonus starter credits.
12. **Multilingual Support**:
    * English, **हिन्दी (Hindi)**, and **తెలుగు (Telugu)** switchable from the header.

---

## 🛠️ Technology Stack

* **Framework**: Next.js 14 App Router
* **Language**: TypeScript
* **Styling**: Tailwind CSS (Indian Tricolor theme + Dark mode)
* **Database**: SQLite with WAL mode & ACID transactions via `better-sqlite3`
* **Icons & Animation**: Lucide React, Canvas Confetti

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone <your-github-repo-url>
cd timebank-india
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Rule Verification Engine
```bash
node scripts/verify-engine.js
node scripts/test-auth-keys.js
```

---

## 🚢 Deployment Guide

### Option 1: Render (Recommended for SQLite Persistence) 🌟
Render provides continuous deployment directly connected to your GitHub repository with persistent storage disks:
1. Create a free account at [render.com](https://render.com).
2. Click **New +** → **Blueprint** or **Web Service**.
3. Connect your GitHub repository: `https://github.com/ghk2604/TimeBank-of-India`.
4. Render automatically reads [`render.yaml`](file:///Users/harikrishna/.gemini/antigravity/scratch/timebank-india/render.yaml) and configures:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Disk**: 1GB mounted at `/opt/render/project/src/data` (preserves your SQLite database across deploys).
5. Click **Apply / Deploy**. Your live URL will be ready in ~2 minutes!

### Option 2: Vercel (1-Click Next.js Deployment) ⚡
1. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Import `https://github.com/ghk2604/TimeBank-of-India`.
3. Framework Preset: **Next.js** (auto-detected).
4. Click **Deploy**. Vercel will build and assign a free `.vercel.app` production domain.

### Option 3: Railway 🚂
1. Go to [railway.app](https://railway.app) and select **New Project** → **Deploy from GitHub repo**.
2. Select `TimeBank-of-India`.
3. Add a persistent volume mounted to `/app/data`.
4. Railway will automatically build and deploy the application.

### Option 4: Docker & Docker Compose (Self-Hosted / VPS) 🐳
For AWS EC2, DigitalOcean Droplet, Linode, or any Linux VPS:
```bash
# Clone the repository
git clone https://github.com/ghk2604/TimeBank-of-India.git
cd TimeBank-of-India

# Build and start the container with persistent data volume
docker compose up -d --build

# View logs
docker compose logs -f
```
Your application will be live on `http://<your-server-ip>:3000`.

---

## 📜 License

MIT License. Dedicated to the learners and educators of Bharat 🇮🇳.
