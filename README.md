<div align="center">
  <h1>🚀 ATS Platform</h1>
  <p><strong>AI-Powered Applicant Tracking & Mock Interview System</strong></p>
  <p><i>A capstone project built with Monorepo architecture, Asynchronous Message Queues, and Generative AI</i></p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
    <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" alt="Redis" />
    <img src="https://img.shields.io/badge/Nx-143055?style=for-the-badge&logo=nx&logoColor=white" alt="Nx Monorepo" />
    <img src="https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini" />
  </p>
</div>

---

## 📑 Table of Contents

- [📌 Introduction](#-introduction)
- [🏛️ System Architecture](#️-system-architecture)
- [✨ Core Features](#-core-features)
- [🧠 AI Mock Interview Flow](#-ai-mock-interview-flow)
- [⚡ Queues & Async Processing (BullMQ)](#-queues--async-processing-bullmq)
- [🛡️ Security & Authorization](#️-security--authorization)
- [🛠️ Tech Stack & Versions](#️-tech-stack--versions)
- [🚀 Getting Started](#-getting-started)
- [🌐 Production Deployment](#-production-deployment)
- [🤝 Contributing & License](#-contributing--license)

---

## 📌 Introduction

**ATS Platform** is a comprehensive applicant tracking system designed to address the bottleneck of manual resume screening and to improve the quality of preliminary candidate assessments.

Instead of relying on traditional synchronous CRUD operations that can block the system under heavy load, this project adopts an **event-driven architecture** combined with **asynchronous message queues (BullMQ)** and **Generative AI (Google Gemini API)** to automate the entire recruitment pipeline:
1. **CV Parsing** — Automatically extracts structured data from PDF resumes uploaded by candidates.
2. **CV Screening** — Matches candidate skills, experience, and education against job descriptions using dynamically configurable scoring weights.
3. **AI Mock Interview** — Real-time WebSocket-based conversational interviews to assess candidate competency before human rounds, significantly reducing manual screening workload for HR teams.

The project is built and managed as an **Nx Monorepo**, ensuring high modularity, shared resource management, and scalability.

---

## 🏛️ System Architecture

The system follows a layered architecture combined with asynchronous processing to decouple AI-heavy workloads from the main HTTP request thread. Below is an overview of the data flow:

```mermaid
graph TD
    %% Styling
    classDef client fill:#e1f5fe,stroke:#039be5,stroke-width:2px;
    classDef gateway fill:#ede7f6,stroke:#5e35b1,stroke-width:2px;
    classDef api fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px;
    classDef queue fill:#fff3e0,stroke:#ef6c00,stroke-width:2px;
    classDef db fill:#ffebee,stroke:#c62828,stroke-width:2px;
    classDef external fill:#fce4ec,stroke:#c2185b,stroke-width:2px;

    %% Nodes
    subgraph Client ["Client Layer (Next.js 16)"]
        Browser["Web Browser (Zustand State)"]:::client
    end

    subgraph Gateway ["Real-time & Auth Layer"]
        Nginx["Nginx Reverse Proxy (SSL)"]:::gateway
        SocketIO["Socket.IO Gateway (JWT Auth)"]:::gateway
    end

    subgraph Backend ["Backend Layer (NestJS 11 + Nx)"]
        API["NestJS Core API Services"]:::api
        DB_Prisma["Prisma ORM"]:::api
    end

    subgraph Broker ["Message Broker & Queue (Redis)"]
        Queue_Verify["Queue: send-verification-email (30/m)"]:::queue
        Queue_Parse["Queue: cv-processing (15/m)"]:::queue
        Queue_Screen["Queue: cv-screening (15/m)"]:::queue
        Queue_Interview["Queue: interview-evaluation"]:::queue
    end

    subgraph Workers ["Async Background Workers"]
        Worker_Verify["Email Worker"]:::api
        Worker_Parse["CV Parser Worker"]:::api
        Worker_Screen["CV Screener Worker"]:::api
        Worker_Interview["Interview Evaluation Worker"]:::api
    end

    subgraph Database ["Data Storage"]
        Postgres[(PostgreSQL 15)]:::db
        Redis[(Redis Cache & SessionStore)]:::db
    end

    subgraph AI ["External AI Services"]
        Gemini["Google Gemini API (gemini-3.5-flash / gemini-3.1-pro-preview)"]:::external
    end

    %% Connections
    Browser -->|HTTPS Requests| Nginx
    Nginx -->|Reverse Proxy| API
    Browser <-->|WebSocket Connection| SocketIO
    SocketIO <-->|Real-time Events| API
    
    API -->|Read/Write| DB_Prisma
    DB_Prisma --> Postgres
    
    API -->|Dispatch Jobs| Broker
    Broker --> Redis
    
    Worker_Verify -->|Processes| Queue_Verify
    Worker_Parse -->|Processes| Queue_Parse
    Worker_Screen -->|Processes| Queue_Screen
    Worker_Interview -->|Processes| Queue_Interview
    
    Worker_Parse -->|Parse Request| Gemini
    Worker_Screen -->|Screening Request| Gemini
    Worker_Interview -->|Evaluation Request| Gemini
    
    Workers -->|Update Results| DB_Prisma
    Workers -->|Emit Progress| SocketIO
```

### Layer Breakdown:
1. **Client Layer (Next.js 16)**: Web application with SSR (Server-Side Rendering) via App Router, organized into isolated Route Groups (`admin`, `recruiter`, `candidate`, `public`) with middleware-based route protection that decodes JWT tokens to determine login status and user role. Real-time application state is centrally managed through **Zustand**.
2. **Real-time & Gateway Layer**: 
   - **Nginx Reverse Proxy**: Handles SSL termination and request routing to internal services.
   - **Socket.IO Gateway**: Establishes secure bidirectional communication channels using JWT handshake authentication with isolated room-based delivery.
3. **Backend Layer (NestJS 11 + Nx)**: Highly modular design with 15 independent feature modules, using **Prisma ORM** for synchronous database operations.
4. **Queue & Worker Layer (BullMQ)**: Fully decouples AI-heavy tasks from the main HTTP thread by dispatching them to a distributed message queue backed by **Redis**. Background workers consume jobs sequentially and update the database upon completion.
5. **AI Layer (Google Gemini Integration)**: Encapsulates specialized prompt templates, communicates via the `@google/genai` SDK, and supports request abortion on overload (AbortController timeout of 120s).

---

## ✨ Core Features

- 🤖 **Automated CV Parsing Engine**: Processes PDF resumes and transforms unstructured data into standardized JSON containing skills, detailed experience, education, and projects.
- 📈 **Intelligent CV Screening Pipeline**: Matches candidate profiles against job requirements. Recruiters can customize scoring weights (e.g., boosting Experience weight for senior positions). The AI computes a weighted overall score and classifies candidates with clear recommendations (`Hire`, `Interview`, `Reject`).
- 💬 **Real-time AI Mock Interview Chatbot**: Candidates participate in a live interview with an AI agent through a chat interface. The AI dynamically generates questions, asks follow-ups based on actual answers, and scores each response independently upon completion.
- 📋 **Visual Kanban Board**: Supports drag-and-drop to transition application stages (Kanban Stage Transition FSM), automatically triggering in-app notifications via Socket.IO to candidates when their application status changes.
- 🔔 **Real-time Notification System**: Deeply integrated Socket.IO notifications that instantly alert recruiters when new applications are submitted or when the AI finishes scoring an interview.
- ⚙️ **Configurable AI Profiles**: Allows administrators to set a minimum screening score threshold and customize evaluation weights (Skills, Experience, Education) for each recruitment campaign.

---

## 🧠 AI Mock Interview Flow

The Mock Interview feature is designed around modern UX principles: **Zero-distraction** (no per-question scores are shown during the session to protect candidate psychology) and **Zero-latency** between main questions.

### Phase 1: Session Initialization & Batch Generation
1. The candidate starts an interview by providing: Topic, Difficulty, and optionally attaching their CV/JD.
2. The system calls the Gemini API using advanced **prompt engineering** to batch-generate **10 core questions** along with their corresponding `expected_points` in a **single API request** to minimize latency.
3. All 10 questions are immediately persisted to the `InterviewQnA` table with sequential `orderIndex` values from 1 to 10.
4. Via Socket.IO, the system emits an event to display question #1 on the candidate's chatbot interface.

### Phase 2: The Q&A Loop & Fast Routing
While the candidate is answering question `N`:
1. The candidate types their answer in the chat and submits. The UI displays a *"AI is analyzing..." (typing indicator)*.
2. The backend calls Gemini API using a lightweight model (`gemini-3.5-flash`) to determine whether the answer needs deeper probing (follow-up branching):
   - **Case A: Follow-up Required (follow_up = true)**:
     - The AI returns a follow-up question tailored to the candidate's response.
     - Socket.IO immediately pushes this follow-up question to the candidate's interface.
     - The candidate answers a second time. After submission, the system skips ahead and instantly displays main question `N + 1` (already pre-loaded in the DB from Phase 1).
     - Simultaneously, the backend dispatches all answer data for question `N` (both primary and follow-up) to the **BullMQ Queue (`interview-evaluation`)** for background scoring, preventing UI blocking.
   - **Case B: No Follow-up Needed (follow_up = false)**:
     - The AI returns a `false` flag. The system immediately displays main question `N + 1`.
     - The scoring task for question `N` is dispatched to BullMQ for asynchronous processing.

### Phase 3: Result Aggregation & Action Plan
1. When the candidate completes question #10, the chatbot transitions to a *"Aggregating results..."* state.
2. The worker verifies that BullMQ has finished scoring all 10 questions in the database.
3. The system aggregates all 10 questions, answers, and scores into a large JSON payload and sends it to a more powerful AI model (`gemini-3.1-pro-preview`) to produce a **Final Assessment**.
4. The AI computes an actual weighted `overallScore`, provides detailed analysis of `strengths` and `weaknesses`, and proposes a concrete `actionPlan` for the candidate's improvement.
5. A `session:completed` event is emitted via Socket.IO, automatically redirecting the candidate to an interactive results page.

---

## ⚡ Queues & Async Processing (BullMQ)

To protect the system from thread-blocking failures caused by AI service rate limits (HTTP 429) and to optimize server resources, all time-consuming tasks are managed through **BullMQ** backed by **Redis**.

The system establishes 4 specialized business queues with global rate limiting and exponential backoff retry configurations:

| Queue Name | Business Function | Load & Rate Limit Config | Retry Policy |
| :--- | :--- | :--- | :--- |
| **`send-verification-email`** | Sends account activation emails and OTP verification codes for registration and password changes. | Global limit of **30 emails/min** to avoid SMTP spam flagging. | Up to **3 retries** (per-job override) with exponential backoff (base delay 2s). |
| **`cv-processing`** | Extracts and parses structured data from uploaded candidate CV PDF files. | Limited to **15 jobs/min** to share the Gemini Flash model's API quota. | Default 1 attempt (global default). Completed jobs auto-cleaned from Redis memory (`removeOnComplete`). |
| **`cv-screening`** | Automatically screens CV data fields against detailed JD requirements. | Limited to **15 jobs/min**. Computes weighted scores and updates application status. | Default 1 attempt. Exponential backoff with a **10-second** base delay (global config). |
| **`interview-evaluation`** | Independently scores each main and follow-up interview question in the background. | Processes up to **3 concurrent jobs** (`concurrency: 3`) for fast response times. | Results are synced directly with the Socket session to update chatbot state in real time. |

---

## 🛡️ Security & Authorization

The system applies common web application security practices to protect candidate and recruiter data:

### 1. JWT Access/Refresh Token Rotation
- **Separated Token Storage**: The Refresh Token is stored in an **HTTP-Only Cookie** with protective attributes (`SameSite=Strict`, `HttpOnly`, `Secure` in production), while the Access Token is returned in the response body for the client to store in memory. This approach mitigates the risk of session hijacking via JavaScript injection attacks (**XSS**).
- **Token Rotation**: When the Access Token expires, the system uses the Refresh Token to issue a new token pair and immediately revokes the old token in the database (marked `revoked` in the `RefreshToken` table). This limits the exposure window if a token is compromised.

### 2. Role-Based Access Control (RBAC) & Data Isolation (OwnershipGuard)
- **Role-Based Access Control**: Uses custom decorators (`@Roles()`) to strictly partition permissions between user groups: `Admin`, `Recruiter`, and `Candidate`.
- **Dynamic Ownership Guard**: Enforces resource-level security via the `@Resources()` decorator. All access to sensitive data (such as candidate profiles, interview score details, and personal information) is cross-checked by the `OwnershipGuard` to verify that the requester is the actual owner or the managing recruiter, helping mitigate **IDOR (Insecure Direct Object Reference)** vulnerabilities.

---

## 🛠️ Tech Stack & Versions

The project uses modern technologies with versions pinned to `package.json`:

### Frontend
- **Framework**: React 19 & Next.js 16.2.4 (App Router)
- **State Management**: Zustand 5.0.13
- **Styling**: Tailwind CSS 3.4.3 & Autoprefixer 10.4.13
- **Animations**: Framer Motion (Motion) 12.38.0
- **UI Components & Icons**: Lucide React 1.7.0 & Sonner 2.0.7
- **Data Visualization**: Recharts 3.8.1

### Backend & Core
- **Framework**: NestJS 11.0.0
- **Monorepo Tooling**: Nx 22.7.2
- **Database ORM**: Prisma 7.8.0
- **Real-time Gateway**: Socket.IO 4.8.3 (`@nestjs/platform-socket.io` 11.1.19)
- **Message Broker & Queue**: BullMQ 5.71.1 (`@nestjs/bullmq` 11.0.4)
- **Database Engine**: PostgreSQL 15 & Redis 5.10.0 (`ioredis`)
- **AI Integrations**: Google Gemini API SDK (`@google/genai` 1.46.0)
- **API Documentation**: NestJS Swagger 11.2.6 (`swagger-ui-express`)
- **Security & Utilities**: Passport.js 0.7.0, Bcrypt 6.0.0, Nodemailer 8.0.2

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version 20.x or higher
- **Docker & Docker Compose**: Installed and running
- **Google Gemini API Key**: A valid API key from Google AI Studio

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

3. **Configure Environment Variables:**
   Create a `.env` file in the project root based on the provided `.env.example`. Fill in the following:
   ```env
   SERVER_PORT=5000
   CLIENT_PORT=3000

   # PostgreSQL Database Configuration
   POSTGRES_USER=your_postgres_user
   POSTGRES_PASSWORD=your_postgres_password
   POSTGRES_DB=your_database_name
   DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

   # JWT Secret
   JWT_SECRET=your_jwt_secret_key

   # Email Configuration (bật/tắt gửi mail: nếu false thì chỉ log, không gửi thật)
   SMTP_ENABLED=true
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false 
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   SMTP_FROM="ATS Platform <your_email@gmail.com>"

   # URLs Configuration
   API_BASE_URL=https://your_domain.com/api
   CLIENT_URL=https://your_domain.com

   # Google AI / API Key
   GOOGLE_API_KEY=your_google_api_key

   # Frontend Configuration
   NEXT_PUBLIC_API_BASE_URL=https://your_domain.com/api
   NEXT_PUBLIC_SOCKET_URL=https://your_domain.com

   # Environment
   NODE_ENV=production

   # Redis Configuration
   REDIS_HOST=redis
   REDIS_PORT=6379
   ```

4. **Start Infrastructure (PostgreSQL & Redis):**
   ```bash
   docker-compose up -d
   ```

5. **Run Database Migrations:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

### Running Locally

Use the Nx CLI to start both the Backend API and Frontend Web applications:

```bash
# Start the NestJS Backend API
npx nx serve api

# Start the Next.js Frontend Web
npx nx serve web
```

- **Swagger API Documentation**: Available at `http://localhost:5000/api`
- **Web Application**: Available at `http://localhost:3000`

---

## 🌐 Production Deployment

The project ships with a fully containerized setup for deployment to any cloud provider (AWS, GCP, DigitalOcean, Azure).

### 1. Docker Compose Deployment
The `docker-compose.yml` at the project root is configured to launch **5 independent containers**:
- `postgres-db`: PostgreSQL database with persistent volume storage.
- `redis-broker`: BullMQ queue manager and session cache.
- `ats-backend-api`: NestJS application running in production-optimized Node.js.
- `ats-frontend-web`: Pre-built Next.js application for faster page loads.
- `nginx-proxy`: Reverse proxy handling SSL termination and request routing.

Launch the full stack in detached mode:
```bash
docker-compose -f docker-compose.yml up --build -d
```

### 2. HTTPS with Nginx & Let's Encrypt
The system uses Nginx to configure free SSL certificates from Let's Encrypt. A sample Nginx configuration is included at [nginx/nginx.conf](./nginx/nginx.conf):

```nginx
server {
    listen 80;
    server_name talentinterviewer.app www.talentinterviewer.app;

    # Redirect all HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name talentinterviewer.app www.talentinterviewer.app;

    # SSL certificate paths (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/talentinterviewer.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/talentinterviewer.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Route requests to Next.js Frontend
    location / {
        proxy_pass http://ats-frontend-web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Route requests to NestJS Backend API
    location /api {
        proxy_pass http://ats-backend-api:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Route real-time Socket.IO connections
    location /socket.io/ {
        proxy_pass http://ats-backend-api:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

To auto-renew SSL certificates, add the following cron job to the server:
```bash
0 12 * * * /usr/bin/certbot renew --quiet && docker kill -s HUP nginx-proxy
```

---

## 🤝 Contributing & License

Contributions, bug fixes, and prompt optimizations are welcome! Standard workflow:
1. Create a new branch (`git checkout -b feature/amazing-feature`).
2. Make your changes and add unit tests where applicable.
3. Ensure linting and tests pass: `npx nx run-many --target=lint` and `npx nx run-many --target=test`.
4. Submit a Pull Request with a clear description of your improvements.

Distributed under the **MIT License**.

<div align="center">
  <sub>Built with ❤️ by <b>Tien Ngo</b></sub>
</div>
