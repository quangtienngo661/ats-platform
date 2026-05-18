<div align="center">
  <h1>🚀 ATS Platform</h1>
  <p><strong>AI-Powered Applicant Tracking & Mock Interview System</strong></p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
    <img src="https://img.shields.io/badge/Nx-143055?style=for-the-badge&logo=nx&logoColor=white" alt="Nx Monorepo" />
  </p>
</div>

---

## 📑 Table of Contents

- [Introduction](#-introduction)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [AI Flow & Integration](#-ai-flow--integration)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📌 Introduction

**ATS Platform** is a modern, enterprise-grade Applicant Tracking System built on a monorepo architecture. Moving beyond traditional CRUD operations, this system leverages advanced Data Structures, Asynchronous Message Queues, and Generative AI (Google Gemini API) to automate the recruitment pipeline. 

The primary problem this platform solves is the massive time overhead required to manually review resumes and conduct initial screenings, providing HR personnel with automated, data-driven candidate evaluations.

---

## ✨ Key Features

- 🤖 **AI-Powered CV Screening Pipeline**: Asynchronous analysis of resumes against job posting descriptions using LLMs. Generates weighted scores (Skills, Experience, Education) and actionable recommendations (`Hire`, `Interview`, `Reject`).
- 🎯 **AI Mock Interview**: An automated conversational agent with real-time Socket.IO chat to test candidates' skills before human intervention. Supports dynamic question generation, follow-ups, and asynchronous result evaluation.
- 📊 **Kanban Board Integration**: Visual application tracking system with interactive stage management.
- 🔔 **Real-time Notifications**: Socket.IO powered notification system for immediate candidate and recruiter alerts.
- 🔐 **Advanced Security & Auth**: Complete JWT execution with Refresh Token Rotation, HTTP-Only cookies, atomic password updates, and Redis-backed Email Verification handling.
- 🛡️ **Fine-Grained Authorization**: Custom `@Resources()` Decorators and `OwnershipGuard` ensuring absolute data isolation between Recruiter, Candidate, and Admin roles.
- 🏗️ **Configurable AI Profiles**: Admins/Recruiters can adjust AI scoring thresholds and metric weights (e.g., boosting 'Experience' weight for Senior positions).

---

## 🏛️ System Architecture

The application adopts a robust layered architecture orchestrated within an **Nx Workspace**:

1. **Frontend (Next.js Application)**: Communicates securely via edge-aware middleware for token validation and state management.
2. **Backend Services (NestJS API)**: The core engine exposing RESTful endpoints. Utilizes **Prisma ORM** for standard synchronous operations.
3. **Message Broker (Redis + BullMQ)**: Decouples heavy AI processing from HTTP request threads. Forms the basis of the async worker architecture.
4. **AI Processor (Gemini Integration)**: Dedicated workers pick up screening jobs from the queue, compile `CV Parsed Data` and `Job Definitions` into optimized prompts, and interpret Gemini's evaluation.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **State/Auth**: Next.js Edge Middleware

### Backend & Core
- **Framework**: NestJS 11
- **Language**: TypeScript
- **Monorepo**: Nx
- **ORM**: Prisma

### Infrastructure & Operations
- **Database**: PostgreSQL 15
- **Cache & Queue**: Redis + BullMQ
- **Containers**: Docker & Docker Compose
- **AI Integrations**: Google Gemini API (`gemini-3-flash`, `gemini-3.1-pro`)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v20+ recommended)
- [Docker](https://www.docker.com/) & Docker Compose
- A valid Google Gemini API Key.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/quangtienngo661/ats-platform.git
   cd ats-platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory (refer to `.env.example` if available). Minimally, provide:
   ```env
   # Database & Redis
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ats-db?schema=public"
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # Authentication
   JWT_SECRET="YOUR_SUPER_SECRET_KEY"

   # AI Integration
   GOOGLE_API_KEY="YOUR_GEMINI_API_KEY"

   # Mailer Config (Optional for local dev)
   SMTP_ENABLED=false
   ```

4. **Start Infrastructure (PostgreSQL & Redis):**
   ```bash
   docker-compose up -d
   ```

5. **Apply Database Migrations:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

### Running the Application

To start both the Backend API and the Frontend Website concurrently via Nx:
```bash
# Start Backend
npx nx serve api

# Start Frontend
npx nx serve web
```
- API Swagger Docs will be available at: `http://localhost:5000/api`
- Next.js Web Application runs on: `http://localhost:3000`

---

## 🧠 AI Flow & Integration

The AI Screening operates on a highly optimized, decoupled architecture to ensure application resilience:

1. **Trigger**: An `Application` record is created. The API instantly registers a `CVScreening` task with a `pending` state.
2. **Queueing**: The task payload is dispatched to **BullMQ** (`cv-screening` queue). The main HTTP thread is freed.
3. **Execution**: The `CvScreeningProcessor` worker fetches the candidate's CV and the Job Posting's prerequisites from PostgreSQL.
4. **Prompt Engineering**: Raw JSON payloads are sanitized, whitespace-trimmed, and injected into a strict instructional prompt template (`gemini.config.ts`).
5. **Consumption**: The payload is sent to Gemini API via `@google/genai` with a strict `AbortController` timeout (30 seconds).
6. **Resolution**: Outputs (JSON format) are parsed, mathematically adjusted by the active `AiConfig` weights, translated to final Database States, and AI Usage (Tokens) are logged.
7. **Resilience**: In case of quota errors or timeouts, BullMQ utilizes **exponential backoff** to automatically retry up to 3 times before setting the status to `failed`.

### Mock Interview Flow
1. **Generation**: The system fetches the Job Description and CV to generate targeted interview questions via Gemini `gemini-3-flash`.
2. **Execution**: Candidates participate in a real-time chat interface (Socket.IO). The AI dynamically evaluates answers and determines if follow-up questions are needed.
3. **Evaluation**: Once completed, the session moves to `pending_result`. An async worker processes the full transcript using `gemini-3.1-pro` to produce a final score and actionable feedback.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request.

*(Note: Please ensure `nx run-many --target=lint` and all tests pass prior to submitting a PR).*

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <sub>Built with ❤️ by Tien Ngo and Contributors.</sub>
</div>
