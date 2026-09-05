# StudyFlow AI 🚀

> **Smart AI-Powered Study Planner, Syllabus Manager & Adaptive Learning Engine**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://study-schedule-ai-3adm.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Neon Database](https://img.shields.io/badge/Neon-PostgreSQL-00E599?style=for-the-badge&logo=postgresql&logoColor=black)](https://neon.tech/)
[![Groq AI](https://img.shields.io/badge/Groq-AI%20Engine-F05032?style=for-the-badge)](https://groq.com/)

🔗 **Live Deployment**: [https://study-schedule-ai-3adm.vercel.app](https://study-schedule-ai-3adm.vercel.app)

---

## 🌟 Overview

**StudyFlow AI** is a state-of-the-art intelligent study planning web application designed to help students optimize their learning schedules, track course syllabus progress, prepare for upcoming exams, and eliminate academic burnout. 

Powered by **Groq LLaMA-3 AI Engine**, **Neon PostgreSQL**, and **Next.js 15**, StudyFlow AI analyzes course difficulty, exam deadlines, and daily hour limits to dynamically generate personalized, spaced-repetition study timetables.

---

## ✨ Key Features

### 🤖 1. AI Study Plan Generator
- **Adaptive Scheduling Algorithm**: Dynamically generates tailored daily study sessions based on exam urgency, subject difficulty ratings (`EASY`, `MEDIUM`, `HARD`), and priority levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Spaced Repetition & Break Management**: Automatically structures study intervals to maximize retention and prevent fatigue.
- **Single-Click Regenerate**: Instantly recalculate or adjust daily study blocks whenever your schedule shifts.

### 📚 2. Subjects & Syllabus Manager
- **Curriculum Organization**: Group courses with subject codes, custom color tags, and difficulty ratings.
- **Topic Breakdown**: Break down complex subjects into granular sub-topics with target duration estimates.
- **Syllabus Progress Tracker**: Visual progress bars reflecting completed topics and active study coverage.

### 📅 3. Interactive Schedule & Calendar
- **Timeline & Session Management**: Mark sessions as completed (`+15 XP`), reschedule upcoming blocks, or adjust session durations.
- **Multi-View Calendar**: Switch between daily schedule views and monthly agenda outlooks.

### 🎯 4. Tasks & Milestone Manager
- **Task Prioritization**: Create and filter action items by subject, due date, and priority level.
- **Status Workflows**: Seamlessly move tasks between pending and completed states.

### 🎓 5. Exam Countdown & Urgency Matrix
- **Milestone Tracker**: Track upcoming exams with dynamic "Days Remaining" counters.
- **Urgency Weighting**: Automatically increases study block frequency for subjects with impending exam dates.

### 📊 6. Gamified Analytics & XP System
- **Study Streaks**: Track consecutive active study days.
- **XP & Level Progression**: Earn XP for completing study sessions and tasks to level up your study streak profile.
- **Weekly Performance Review**: Visual analytics highlighting weekly minutes studied, completed sessions, and top subjects.

### 💬 7. Groq AI Assistant Chatbot
- **Interactive Tutor**: Ask questions about complex study topics, request revision summaries, or generate quick quizzes.
- **Context-Aware Recommendations**: Offers tailored guidance based on your current workload.

### 🎨 8. Premium Glassmorphism UI & Dual Theme Support
- **Dark/Light Mode**: Full dark-first UI built with tailored HSL color tokens, glassmorphism cards, ambient lighting glows, and smooth Framer Motion animations.
- **Mobile Responsive Design**: Responsive layout with a touch-friendly bottom navigation bar (`MobileNav`) and slide-out mobile drawer overlay.

---

## 🧠 How It Works

```mermaid
flowchart TD
    A[Student Inputs Subjects & Upcoming Exams] --> B[Set Available Daily Study Hours]
    B --> C[Click 'Generate AI Study Plan']
    C --> D[Groq AI Engine Analyzes Workload & Urgency Matrix]
    D --> E[Generates Optimized Study Session Timetable]
    E --> F[Student Completes Sessions & Earns XP]
    F --> G[Real-Time Progress & Analytics Update]
```

1. **Input Syllabus & Deadlines**: Add course subjects, difficulty levels, target topics, and upcoming exam dates.
2. **AI Schedule Calculation**: StudyFlow AI evaluates urgency scores and structures time-blocked sessions.
3. **Execution & Gamification**: Complete study sessions to gain XP, maintain study streaks, and update topic completion.
4. **Adaptive Adjustment**: Easily reschedule missed sessions or regenerate your plan as exam dates approach.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/), Glassmorphism Utilities, Vanilla CSS
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database**: [Neon Serverless PostgreSQL](https://neon.tech/)
- **ORM**: [Prisma ORM](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5 (Auth.js)](https://next-auth.js.org/) (Google OAuth + Credentials JWT)
- **AI Engine**: [Groq Cloud API](https://groq.com/) (LLaMA-3 70B Model)
- **UI Components**: Radix UI Primitives, Sonner Toasts
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/vanshikamcse25-creator/study_schedule_ai.git
cd study_schedule_ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-example-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# NextAuth Configuration
AUTH_SECRET="your_nextauth_secret_key"
AUTH_URL="http://localhost:3000"

# Google OAuth (Optional)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Groq AI Key
GROQ_API_KEY="gsk_your_groq_api_key"
```

### 4. Push Database Schema
```bash
npx prisma db push
```

### 5. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Production Deployment

The application is deployed on **Vercel**:
- **Live URL**: [https://study-schedule-ai-3adm.vercel.app](https://study-schedule-ai-3adm.vercel.app)

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<p align="center">
  Made with ❤️ by <strong>StudyFlow AI Team</strong>
</p>
