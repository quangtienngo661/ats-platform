<div align="center">
  <h1>ðŸš€ ATS Platform</h1>
  <p><strong>Há»‡ thá»‘ng Quáº£n trá»‹ Tuyá»ƒn dá»¥ng (ATS) & Phá»ng váº¥n Giáº£ láº­p TÃ­ch há»£p TrÃ­ tuá»‡ NhÃ¢n táº¡o</strong></p>

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

## ðŸ“‘ Má»¥c lá»¥c

- [ðŸ“Œ Giá»›i thiá»‡u dá»± Ã¡n](#-giá»›i-thiá»‡u-dá»±-Ã¡n)
- [ðŸ›ï¸ Kiáº¿n trÃºc Há»‡ thá»‘ng (System Architecture)](#ï¸-kiáº¿n-trÃºc-há»‡-thá»‘ng-system-architecture)
- [âœ¨ CÃ¡c TÃ­nh nÄƒng Cá»‘t lÃµi](#-cÃ¡c-tÃ­nh-nÄƒng-cá»‘t-lÃµi)
- [ðŸ§  Quy trÃ¬nh Phá»ng váº¥n Giáº£ láº­p (AI Mock Interview)](#-quy-trÃ¬nh-phá»ng-váº¥n-giáº£-láº­p-ai-mock-interview)
- [âš¡ HÃ ng Ä‘á»£i & Xá»­ lÃ½ Báº¥t Ä‘á»“ng bá»™ (BullMQ)](#-hÃ ng-Ä‘á»£i--xá»­-lÃ½-báº¥t-Ä‘á»“ng-bá»™-bullmq)
- [ðŸ›¡ï¸ Báº£o máº­t & PhÃ¢n quyá»n NÃ¢ng cao](#ï¸-báº£o-máº­t--phÃ¢n-quyá»n-nÃ¢ng-cao)
- [ðŸ› ï¸ CÃ´ng nghá»‡ Sá»­ dá»¥ng & PhiÃªn báº£n](#ï¸-cÃ´ng-nghá»‡-sá»­-dá»¥ng--phiÃªn-báº£n)
- [ðŸš€ HÆ°á»›ng dáº«n CÃ i Ä‘áº·t & Khá»Ÿi cháº¡y](#-hÆ°á»›ng-dáº«n-cÃ i-Ä‘áº·t--khá»Ÿi-cháº¡y)
- [ðŸŒ HÆ°á»›ng dáº«n Triá»ƒn khai Production](#-hÆ°á»›ng-dáº«n-triá»ƒn-khai-production)
- [ðŸ¤ ÄÃ³ng gÃ³p & Báº£n quyá»n](#-Ä‘Ã³ng-gÃ³p--báº£n-quyá»n)

---

## ðŸ“Œ Giá»›i thiá»‡u dá»± Ã¡n

**ATS Platform** lÃ  há»‡ thá»‘ng quáº£n trá»‹ tuyá»ƒn dá»¥ng toÃ n diá»‡n Ä‘Æ°á»£c thiáº¿t káº¿ Ä‘á»ƒ giáº£i quyáº¿t bÃ i toÃ¡n quÃ¡ táº£i trong sÃ ng lá»c há»“ sÆ¡ á»©ng viÃªn vÃ  nÃ¢ng cao cháº¥t lÆ°á»£ng phá»ng váº¥n sÆ¡ bá»™ cho cÃ¡c doanh nghiá»‡p. 

Thay vÃ¬ sá»­ dá»¥ng cÃ¡c cÆ¡ cháº¿ CRUD Ä‘á»“ng bá»™ truyá»n thá»‘ng dá»… gÃ¢y ngháº½n há»‡ thá»‘ng khi chá»‹u táº£i lá»›n, dá»± Ã¡n Ã¡p dá»¥ng mÃ´ hÃ¬nh **Event-driven (HÆ°á»›ng sá»± kiá»‡n)** káº¿t há»£p vá»›i **HÃ ng Ä‘á»£i thÃ´ng Ä‘iá»‡p báº¥t Ä‘á»“ng bá»™ (BullMQ)** vÃ  **Generative AI (Google Gemini API)** Ä‘á»ƒ tá»± Ä‘á»™ng hÃ³a toÃ n bá»™ quy trÃ¬nh:
1. **TrÃ­ch xuáº¥t thÃ´ng tin há»“ sÆ¡ (CV Parsing)** tá»± Ä‘á»™ng tá»« cÃ¡c file PDF á»©ng viÃªn táº£i lÃªn.
2. **SÃ ng lá»c tá»± Ä‘á»™ng (CV Screening)** Ä‘á»‘i chiáº¿u chÃ­nh xÃ¡c ká»¹ nÄƒng, kinh nghiá»‡m vÃ  há»c váº¥n vá»›i mÃ´ táº£ cÃ´ng viá»‡c (JD) theo trá»ng sá»‘ cáº¥u hÃ¬nh Ä‘á»™ng.
3. **Phá»ng váº¥n giáº£ láº­p thá»i gian thá»±c (AI Mock Interview)** qua kÃªnh WebSocket Ä‘á»ƒ Ä‘Ã¡nh giÃ¡ nÄƒng lá»±c á»©ng viÃªn trÆ°á»›c vÃ²ng gáº·p máº·t trá»±c tiáº¿p, nháº±m giáº£m Ä‘Ã¡ng ká»ƒ khá»‘i lÆ°á»£ng cÃ´ng viá»‡c sÃ ng lá»c thá»§ cÃ´ng cho phÃ²ng nhÃ¢n sá»±.

Dá»± Ã¡n Ä‘Æ°á»£c xÃ¢y dá»±ng vÃ  quáº£n trá»‹ cháº·t cháº½ dÆ°á»›i dáº¡ng **Nx Monorepo**, Ä‘áº£m báº£o tÃ­nh mÃ´-Ä‘un hÃ³a cao, dá»… dÃ ng chia sáº» tÃ i nguyÃªn vÃ  má»Ÿ rá»™ng quy mÃ´.

---

## ðŸ›ï¸ Kiáº¿n trÃºc Há»‡ thá»‘ng (System Architecture)

Há»‡ thá»‘ng Ä‘Æ°á»£c thiáº¿t káº¿ theo kiáº¿n trÃºc phÃ¢n lá»›p (Layered Architecture) káº¿t há»£p xá»­ lÃ½ báº¥t Ä‘á»“ng bá»™ nháº±m phÃ¢n rÃ£ Ä‘á»™ trá»… cá»§a cÃ¡c tÃ¡c vá»¥ AI náº·ng. DÆ°á»›i Ä‘Ã¢y lÃ  mÃ´ hÃ¬nh luá»“ng hoáº¡t Ä‘á»™ng tá»•ng quan:

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
        Browser["TrÃ¬nh duyá»‡t Web (Zustand State)"]:::client
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

### Chi tiáº¿t cÃ¡c phÃ¢n lá»›p:
1. **Client Layer (Next.js 16)**: á»¨ng dá»¥ng web há»— trá»£ SSR (Server-Side Rendering) báº±ng App Router, phÃ¢n chia cÃ¡c Route Group Ä‘á»™c láº­p (`admin`, `recruiter`, `candidate`, `public`) cÃ¹ng Middleware phÃ¢n quyá»n tuyáº¿n Ä‘Æ°á»ng (Route Protection) dá»±a trÃªn tráº¡ng thÃ¡i Ä‘Äƒng nháº­p vÃ  vai trÃ² ngÆ°á»i dÃ¹ng Ä‘Æ°á»£c giáº£i mÃ£ tá»« JWT. Tráº¡ng thÃ¡i á»©ng dá»¥ng thá»i gian thá»±c Ä‘Æ°á»£c quáº£n lÃ½ táº­p trung thÃ´ng qua **Zustand**.
2. **Real-time & Gateway Layer**: 
   - **Nginx Reverse Proxy**: Chá»‹u trÃ¡ch nhiá»‡m cháº¥m dá»©t káº¿t ná»‘i SSL (SSL Termination) báº£o máº­t vÃ  phÃ¢n tuyáº¿n yÃªu cáº§u (request routing) Ä‘áº¿n cÃ¡c dá»‹ch vá»¥ ná»™i bá»™.
   - **Socket.IO Gateway**: Thiáº¿t láº­p kÃªnh giao tiáº¿p hai chiá»u báº£o máº­t báº±ng cÆ¡ cháº¿ báº¯t tay JWT (Socket Handshake Auth) bÃ¡m sÃ¡t theo cÃ¡c phÃ²ng (Rooms) cÃ´ láº­p.
3. **Backend Layer (NestJS 11 + Nx)**: Thiáº¿t káº¿ mÃ´-Ä‘un hÃ³a cao gá»“m 15 nghiá»‡p vá»¥ Ä‘á»™c láº­p, sá»­ dá»¥ng **Prisma ORM** Ä‘á»ƒ tÆ°Æ¡ng tÃ¡c dá»¯ liá»‡u Ä‘á»“ng bá»™ vá»›i hiá»‡u nÄƒng cao.
4. **Queue & Worker Layer (BullMQ)**: Giáº£i phÃ³ng hoÃ n toÃ n cÃ¡c request luá»“ng HTTP chÃ­nh báº±ng cÃ¡ch Ä‘áº©y cÃ¡c tÃ¡c vá»¥ AI náº·ng vÃ o hÃ ng Ä‘á»£i thÃ´ng Ä‘iá»‡p phÃ¢n tÃ¡n dá»±a trÃªn **Redis**. CÃ¡c Background Workers sáº½ tiÃªu thá»¥ tÃ¡c vá»¥ tuáº§n tá»± vÃ  tá»± Ä‘á»™ng cáº­p nháº­t tráº¡ng thÃ¡i cÆ¡ sá»Ÿ dá»¯ liá»‡u.
5. **AI Layer (Google Gemini Integration)**: ÄÃ³ng gÃ³i cháº·t cháº½ cÃ¡c Prompt chuyÃªn biá»‡t, giao tiáº¿p qua bá»™ SDK `@google/genai` tháº¿ há»‡ má»›i, há»— trá»£ cÆ¡ cháº¿ ngáº¯t káº¿t ná»‘i khi quÃ¡ táº£i (AbortController timeout 120s).

---

## âœ¨ CÃ¡c TÃ­nh nÄƒng Cá»‘t lÃµi

- ðŸ¤– **TrÃ¬nh trÃ­ch xuáº¥t CV Tá»± Ä‘á»™ng (CV Parsing Engine)**: Nháº­n dáº¡ng cÃ¡c file CV Ä‘á»‹nh dáº¡ng PDF, chuyá»ƒn hÃ³a dá»¯ liá»‡u phi cáº¥u trÃºc thÃ nh cáº¥u trÃºc JSON chuáº©n gá»“m cÃ¡c trÆ°á»ng: ká»¹ nÄƒng (skills), kinh nghiá»‡m chi tiáº¿t (experience), há»c váº¥n (education), vÃ  dá»± Ã¡n (projects).
- ðŸ“ˆ **Há»‡ thá»‘ng SÃ ng lá»c CV ThÃ´ng minh (CV Screening Pipeline)**: So khá»›p há»“ sÆ¡ á»©ng viÃªn vá»›i yÃªu cáº§u cÃ´ng viá»‡c. Recruiter cÃ³ thá»ƒ tÃ¹y chá»‰nh trá»ng sá»‘ (vÃ­ dá»¥: tÄƒng trá»ng sá»‘ Kinh nghiá»‡m cho á»©ng viÃªn Senior). AI tÃ­nh Ä‘iá»ƒm quy Ä‘á»•i tá»•ng quÃ¡t vÃ  phÃ¢n loáº¡i tráº¡ng thÃ¡i khuyáº¿n nghá»‹ rÃµ rÃ ng (`Hire`, `Interview`, `Reject`).
- ðŸ’¬ **Phá»ng váº¥n Giáº£ láº­p Thá»i gian thá»±c (AI Mock Interview Chatbot)**: á»¨ng viÃªn tham gia phá»ng váº¥n trá»±c tiáº¿p vá»›i AI thÃ´ng qua giao diá»‡n chatbot mÆ°á»£t mÃ . AI tá»± Ä‘á»™ng sinh cÃ¢u há»i, há»i tiáº¿p (Follow-up) dá»±a trÃªn cÃ¢u tráº£ lá»i thá»±c táº¿, vÃ  cháº¥m Ä‘iá»ƒm Ä‘á»™c láº­p khi káº¿t thÃºc.
- ðŸ“‹ **Báº£ng Quáº£n lÃ½ Kanban Trá»±c quan**: Há»— trá»£ kÃ©o tháº£ linh hoáº¡t Ä‘á»ƒ chuyá»ƒn Ä‘á»•i tráº¡ng thÃ¡i á»©ng tuyá»ƒn cá»§a á»©ng viÃªn (Kanban Stage Transition FSM), tá»± Ä‘á»™ng kÃ­ch hoáº¡t thÃ´ng bÃ¡o trong á»©ng dá»¥ng (in-app notification) qua Socket.IO cho á»©ng viÃªn khi tráº¡ng thÃ¡i há»“ sÆ¡ thay Ä‘á»•i.
- ðŸ”” **Há»‡ thá»‘ng ThÃ´ng bÃ¡o Thá»i gian thá»±c (Real-time Notification)**: TÃ­ch há»£p sÃ¢u Socket.IO thÃ´ng bÃ¡o ngay láº­p tá»©c cho Recruiter khi cÃ³ á»©ng viÃªn ná»™p há»“ sÆ¡ má»›i hoáº·c khi AI Ä‘Ã£ cháº¥m Ä‘iá»ƒm phá»ng váº¥n xong.
- âš™ï¸ **Cáº¥u hÃ¬nh TrÃ­ tuá»‡ NhÃ¢n táº¡o (Configurable AI Profiles)**: Cho phÃ©p quáº£n trá»‹ viÃªn thiáº¿t láº­p ngÆ°á»¡ng Ä‘iá»ƒm sÃ ng lá»c tá»‘i thiá»ƒu vÃ  tÃ¹y chá»‰nh trá»ng sá»‘ Ä‘Ã¡nh giÃ¡ (Skills, Experience, Education) cho tá»«ng chiáº¿n dá»‹ch tuyá»ƒn dá»¥ng.

---

## ðŸ§  Quy trÃ¬nh Phá»ng váº¥n Giáº£ láº­p (AI Mock Interview)

TÃ­nh nÄƒng Phá»ng váº¥n Giáº£ láº­p Ä‘Æ°á»£c thiáº¿t káº¿ bÃ¡m sÃ¡t cÃ¡c nguyÃªn táº¯c UX hiá»‡n Ä‘áº¡i: **KhÃ´ng gÃ¢y xao nhÃ£ng (Zero-distraction)** nháº±m báº£o vá»‡ tÃ¢m lÃ½ á»©ng viÃªn (khÃ´ng hiá»ƒn thá»‹ Ä‘iá»ƒm sá»‘ tá»«ng cÃ¢u giá»¯a chá»«ng) vÃ  **Äá»™ trá»… báº±ng khÃ´ng (Zero-latency)** giá»¯a cÃ¡c cÃ¢u há»i chÃ­nh.

### Giai Ä‘oáº¡n 1: Khá»Ÿi Ä‘á»™ng PhiÃªn (Session Initialization & Batch Generation)
1. á»¨ng viÃªn kÃ­ch hoáº¡t phá»ng váº¥n báº±ng cÃ¡ch gá»­i thÃ´ng tin: Chá»§ Ä‘á» (Topic), Äá»™ khÃ³ (Difficulty), vÃ  tÃ¹y chá»n Ä‘Ã­nh kÃ¨m CV/JD.
2. Há»‡ thá»‘ng gá»i Gemini API báº±ng ká»¹ thuáº­t **Prompt Engineering** nÃ¢ng cao Ä‘á»ƒ sinh Ä‘á»“ng loáº¡t **10 cÃ¢u há»i cá»‘t lÃµi** cÃ¹ng cÃ¡c Ä‘iá»ƒm cáº§n tráº£ lá»i mong Ä‘á»£i (`expected_points`) tÆ°Æ¡ng á»©ng trong **duy nháº¥t 1 request** nháº±m giáº£m thiá»ƒu tá»‘i Ä‘a Ä‘á»™ trá»….
3. 10 cÃ¢u há»i nÃ y Ä‘Æ°á»£c lÆ°u tá»©c thÃ¬ vÃ o báº£ng `InterviewQnA` vá»›i thá»© tá»± (`orderIndex`) tÆ°Æ¡ng á»©ng tá»« 1 Ä‘áº¿n 10.
4. ThÃ´ng qua Socket.IO, há»‡ thá»‘ng phÃ¡t tÃ­n hiá»‡u hiá»ƒn thá»‹ cÃ¢u há»i sá»‘ 1 lÃªn mÃ n hÃ¬nh chatbot cá»§a á»©ng viÃªn.

### Giai Ä‘oáº¡n 2: VÃ²ng láº·p Há»i - ÄÃ¡p (The Q&A Loop & Fast Routing)
Khi á»©ng viÃªn Ä‘ang tráº£ lá»i cÃ¢u há»i thá»© `N`:
1. á»¨ng viÃªn nháº­p ná»™i dung tráº£ lá»i vÃ o khung chat vÃ  nháº¥n gá»­i. Giao diá»‡n hiá»ƒn thá»‹ tráº¡ng thÃ¡i *"AI Ä‘ang phÃ¢n tÃ­ch..." (Typing indicator)*.
2. Backend gá»i Gemini API Ä‘Ã¡nh giÃ¡ nhanh báº±ng mÃ´ hÃ¬nh nháº¹ (`gemini-3.5-flash`) Ä‘á»ƒ xÃ¡c Ä‘á»‹nh xem cÃ¢u tráº£ lá»i cÃ³ cáº§n Ä‘Ã o sÃ¢u hay khÃ´ng (ráº½ nhÃ¡nh Follow-up):
   - **TrÆ°á»ng há»£p A: Cáº§n há»i sÃ¢u thÃªm (Follow-up = True)**:
     - AI tráº£ vá» cÃ¢u há»i phá»¥ bÃ¡m sÃ¡t cÃ¢u tráº£ lá»i vá»«a gá»­i.
     - Socket.IO láº­p tá»©c Ä‘áº©y cÃ¢u há»i phá»¥ nÃ y lÃªn giao diá»‡n á»©ng viÃªn.
     - á»¨ng viÃªn tráº£ lá»i láº§n 2. Sau khi gá»­i, há»‡ thá»‘ng bá» qua vÃ  hiá»ƒn thá»‹ ngay cÃ¢u há»i chÃ­nh sá»‘ `N + 1` (Ä‘Ã£ cÃ³ sáºµn trong DB tá»« Giai Ä‘oáº¡n 1).
     - Äá»“ng thá»i, backend nÃ©m toÃ n bá»™ dá»¯ liá»‡u cÃ¢u tráº£ lá»i cá»§a cÃ¢u `N` (bao gá»“m cáº£ chÃ­nh vÃ  phá»¥) vÃ o **BullMQ Queue (`interview-evaluation`)** Ä‘á»ƒ cháº¥m Ä‘iá»ƒm ngáº§m dÆ°á»›i ná»n, trÃ¡nh lÃ m á»©ng viÃªn bá»‹ ngháº½n giao diá»‡n.
   - **TrÆ°á»ng há»£p B: KhÃ´ng cáº§n há»i sÃ¢u (Follow-up = False)**:
     - AI tráº£ vá» cá» `false`. Há»‡ thá»‘ng láº­p tá»©c hiá»ƒn thá»‹ cÃ¢u há»i chÃ­nh sá»‘ `N + 1` cho á»©ng viÃªn.
     - Äáº©y tÃ¡c vá»¥ cháº¥m Ä‘iá»ƒm cÃ¢u `N` vÃ o hÃ ng Ä‘á»£i BullMQ Ä‘á»ƒ xá»­ lÃ½ báº¥t Ä‘á»“ng bá»™.

### Giai Ä‘oáº¡n 3: Tá»•ng há»£p káº¿t quáº£ (Result Aggregation & Action Plan)
1. Khi á»©ng viÃªn hoÃ n thÃ nh cÃ¢u tráº£ lá»i sá»‘ 10, giao diá»‡n chatbot chuyá»ƒn sang tráº¡ng thÃ¡i *"Äang tá»•ng há»£p káº¿t quáº£..."*.
2. Worker kiá»ƒm tra vÃ  Ä‘áº£m báº£o BullMQ Ä‘Ã£ cháº¥m Ä‘iá»ƒm xong cho toÃ n bá»™ 10 cÃ¢u há»i trong database.
3. Há»‡ thá»‘ng gom toÃ n bá»™ dá»¯ liá»‡u gá»“m 10 cÃ¢u há»i, 10 cÃ¢u tráº£ lá»i, Ä‘iá»ƒm sá»‘ thÃ nh má»™t cáº¥u trÃºc JSON lá»›n vÃ  gá»­i lÃªn mÃ´ hÃ¬nh AI máº¡nh (`gemini-3.1-pro-preview`) Ä‘á»ƒ táº¡o ra **ÄÃ¡nh giÃ¡ tá»•ng quÃ¡t (Final Assessment)**.
4. AI tÃ­nh toÃ¡n Ä‘iá»ƒm trung bÃ¬nh thá»±c táº¿ (`overallScore`), phÃ¢n tÃ­ch chi tiáº¿t Äiá»ƒm máº¡nh (`strengths`), Äiá»ƒm yáº¿u (`weaknesses`), vÃ  Ä‘á» xuáº¥t Lá»™ trÃ¬nh hÃ nh Ä‘á»™ng chi tiáº¿t (`actionPlan`) Ä‘á»ƒ á»©ng viÃªn nÃ¢ng cao kiáº¿n thá»©c.
5. Sá»± kiá»‡n `session:completed` Ä‘Æ°á»£c emit qua Socket.IO, tá»± Ä‘á»™ng chuyá»ƒn hÆ°á»›ng á»©ng viÃªn sang trang hiá»ƒn thá»‹ káº¿t quáº£ phá»ng váº¥n trá»±c quan vÃ  sinh Ä‘á»™ng.

---

## âš¡ HÃ ng Ä‘á»£i & Xá»­ lÃ½ Báº¥t Ä‘á»“ng bá»™ (BullMQ)

Äá»ƒ báº£o vá»‡ há»‡ thá»‘ng khá»i rá»§i ro sáº­p luá»“ng do giá»›i háº¡n sá»‘ lÆ°á»£ng yÃªu cáº§u cá»§a cÃ¡c dá»‹ch vá»¥ AI (Rate Limit - Lá»—i HTTP 429) vÃ  tá»‘i Æ°u hÃ³a tÃ i nguyÃªn mÃ¡y chá»§, toÃ n bá»™ cÃ¡c tÃ¡c vá»¥ xá»­ lÃ½ tá»‘n thá»i gian Ä‘á»u Ä‘Æ°á»£c quáº£n lÃ½ qua **BullMQ** káº¿t há»£p **Redis**.

Há»‡ thá»‘ng thiáº¿t láº­p 4 hÃ ng Ä‘á»£i nghiá»‡p vá»¥ chuyÃªn biá»‡t vá»›i cÆ¡ cháº¿ kiá»ƒm soÃ¡t tá»‘c Ä‘á»™ (Global Rate Limiting) vÃ  cáº¥u hÃ¬nh tá»± Ä‘á»™ng thá»­ láº¡i vá»›i Ä‘á»™ trá»… tÄƒng dáº§n (Exponential Backoff Retry):

| TÃªn HÃ ng Äá»£i (Queue Name) | Chá»©c NÄƒng Nghiá»‡p Vá»¥ | Cáº¥u HÃ¬nh Táº£i & Rate Limit | CÆ¡ Cháº¿ Thá»­ Láº¡i (Retry Policy) |
| :--- | :--- | :--- | :--- |
| **`send-verification-email`** | Gá»­i email kÃ­ch hoáº¡t tÃ i khoáº£n, mÃ£ OTP xÃ¡c thá»±c Ä‘Äƒng kÃ½ vÃ  Ä‘á»•i máº­t kháº©u. | Giá»›i háº¡n tá»‘i Ä‘a **30 emails / phÃºt** toÃ n cá»¥c Ä‘á»ƒ trÃ¡nh bá»‹ Ä‘Ã¡nh dáº¥u Spam bá»Ÿi SMTP. | Thá»­ láº¡i tá»‘i Ä‘a **3 láº§n** (per-job override) vá»›i Exponential Backoff (delay cÆ¡ sá»Ÿ 2s). |
| **`cv-processing`** | TrÃ­ch xuáº¥t vÃ  phÃ¢n tÃ­ch cÃº phÃ¡p dá»¯ liá»‡u tá»« tá»‡p tin CV PDF táº£i lÃªn cá»§a á»©ng viÃªn. | Giá»›i háº¡n **15 tÃ¡c vá»¥ / phÃºt** Ä‘á»ƒ chia sáº» háº¡n ngáº¡ch API cá»§a mÃ´ hÃ¬nh Gemini Flash. | Máº·c Ä‘á»‹nh 1 láº§n thá»­ (global default). Tá»± Ä‘á»™ng dá»n dáº¹p job hoÃ n táº¥t khá»i bá»™ nhá»› Redis (`removeOnComplete`). |
| **`cv-screening`** | SÃ ng lá»c tá»± Ä‘á»™ng Ä‘á»‘i chiáº¿u cÃ¡c trÆ°á»ng dá»¯ liá»‡u CV vá»›i yÃªu cáº§u chi tiáº¿t cá»§a JD. | Giá»›i háº¡n **15 tÃ¡c vá»¥ / phÃºt**. TÃ­nh toÃ¡n Ä‘iá»ƒm sá»‘ theo trá»ng sá»‘ vÃ  cáº­p nháº­t tráº¡ng thÃ¡i á»©ng tuyá»ƒn. | Máº·c Ä‘á»‹nh 1 láº§n thá»­. Exponential Backoff vá»›i Ä‘á»™ trá»… cÆ¡ sá»Ÿ **10 giÃ¢y** (cáº¥u hÃ¬nh global). |
| **`interview-evaluation`** | Cháº¥m Ä‘iá»ƒm Ä‘á»™c láº­p tá»«ng cÃ¢u há»i phá»ng váº¥n chÃ­nh vÃ  phá»¥ cá»§a á»©ng viÃªn dÆ°á»›i ná»n. | Xá»­ lÃ½ Ä‘á»“ng thá»i tá»‘i Ä‘a **3 job** (`concurrency: 3`) Ä‘á»ƒ Ä‘áº£m báº£o tá»‘c Ä‘á»™ pháº£n há»“i nhanh. | Äá»“ng bá»™ káº¿t quáº£ trá»±c tiáº¿p vá»›i phiÃªn Socket Ä‘á»ƒ cáº­p nháº­t tráº¡ng thÃ¡i chatbot thá»i gian thá»±c. |

---

## ðŸ›¡ï¸ Báº£o máº­t & PhÃ¢n quyá»n NÃ¢ng cao

Há»‡ thá»‘ng Ã¡p dá»¥ng cÃ¡c biá»‡n phÃ¡p báº£o máº­t phá»• biáº¿n trong phÃ¡t triá»ƒn á»©ng dá»¥ng web hiá»‡n Ä‘áº¡i Ä‘á»ƒ báº£o vá»‡ dá»¯ liá»‡u cá»§a á»©ng viÃªn vÃ  nhÃ  tuyá»ƒn dá»¥ng:

### 1. CÆ¡ cháº¿ Xoay vÃ²ng Token JWT (Access/Refresh Token Rotation)
- **PhÃ¢n tÃ¡ch lÆ°u trá»¯ Token**: Refresh Token Ä‘Æ°á»£c lÆ°u trá»¯ bÃªn trong **HTTP-Only Cookie** vá»›i cÃ¡c thuá»™c tÃ­nh báº£o vá»‡ (`SameSite=Strict`, `HttpOnly`, `Secure` á»Ÿ mÃ´i trÆ°á»ng production), trong khi Access Token Ä‘Æ°á»£c tráº£ vá» qua response body Ä‘á»ƒ client lÆ°u trá»¯ trong bá»™ nhá»› táº¡m (memory). CÆ¡ cháº¿ nÃ y giÃºp giáº£m thiá»ƒu rá»§i ro táº¥n cÃ´ng Ä‘Ã¡nh cáº¯p phiÃªn qua mÃ£ Ä‘á»™c Javascript (**XSS**).
- **CÆ¡ cháº¿ xoay vÃ²ng (Rotation)**: Má»—i khi Access Token háº¿t háº¡n, há»‡ thá»‘ng sá»­ dá»¥ng Refresh Token Ä‘á»ƒ cáº¥p phÃ¡t má»™t cáº·p Token má»›i vÃ  thu há»“i ngay Token cÅ© trong cÆ¡ sá»Ÿ dá»¯ liá»‡u (Ä‘Ã¡nh dáº¥u `revoked` trong báº£ng `RefreshToken`). CÆ¡ cháº¿ nÃ y giáº£m thiá»ƒu rá»§i ro khi Token bá»‹ lá»™ lá»t bÃªn ngoÃ i.

### 2. PhÃ¢n quyá»n Dá»±a trÃªn Vai trÃ² (RBAC) & CÃ´ láº­p Dá»¯ liá»‡u (OwnershipGuard)
- **PhÃ¢n quyá»n vai trÃ² (Role-Based Access Control)**: Sá»­ dá»¥ng cÃ¡c Decorators tÃ¹y biáº¿n (`@Roles()`) Ä‘á»ƒ phÃ¢n loáº¡i cháº·t cháº½ quyá»n háº¡n giá»¯a cÃ¡c nhÃ³m ngÆ°á»i dÃ¹ng: `Admin` (Quáº£n trá»‹ há»‡ thá»‘ng), `Recruiter` (NhÃ  tuyá»ƒn dá»¥ng) vÃ  `Candidate` (á»¨ng viÃªn).
- **Kiá»ƒm soÃ¡t sá»Ÿ há»¯u Ä‘á»™ng (Dynamic Ownership Guard)**: Báº£o máº­t á»Ÿ cáº¥p Ä‘á»™ ID tÃ i nguyÃªn báº±ng Decorator `@Resources()`. Má»i truy cáº­p vÃ o dá»¯ liá»‡u nháº¡y cáº£m (nhÆ° há»“ sÆ¡ á»©ng viÃªn, chi tiáº¿t Ä‘iá»ƒm sá»‘ phá»ng váº¥n, thÃ´ng tin cÃ¡ nhÃ¢n) Ä‘á»u Ä‘Æ°á»£c `OwnershipGuard` kiá»ƒm tra chÃ©o xem ngÆ°á»i gá»­i yÃªu cáº§u cÃ³ thá»±c sá»± lÃ  chá»§ sá»Ÿ há»¯u hoáº·c nhÃ  tuyá»ƒn dá»¥ng quáº£n lÃ½ há»“ sÆ¡ Ä‘Ã³ hay khÃ´ng, giÃºp háº¡n cháº¿ lá»— há»•ng **IDOR (Insecure Direct Object Reference)**.

---

## ðŸ› ï¸ CÃ´ng nghá»‡ Sá»­ dá»¥ng & PhiÃªn báº£n

Dá»± Ã¡n sá»­ dá»¥ng cÃ¡c cÃ´ng nghá»‡ hiá»‡n Ä‘áº¡i vÃ  cÃ³ phiÃªn báº£n tÆ°Æ¡ng thÃ­ch cao bÃ¡m sÃ¡t tá»‡p cáº¥u hÃ¬nh `package.json`:

### CÃ´ng nghá»‡ Frontend
- **Framework**: React 19 & Next.js 16.2.4 (App Router)
- **State Management**: Zustand 5.0.13
- **Styling**: Tailwind CSS 3.4.3 & Autoprefixer 10.4.13
- **Animations**: Framer Motion (Motion) 12.38.0
- **UI Components & Icons**: Lucide React 1.7.0 & Sonner 2.0.7
- **Data Visualization**: Recharts 3.8.1

### CÃ´ng nghá»‡ Backend & Core
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

## ðŸš€ HÆ°á»›ng dáº«n CÃ i Ä‘áº·t & Khá»Ÿi cháº¡y

### YÃªu cáº§u Há»‡ thá»‘ng tá»‘i thiá»ƒu
- **Node.js**: PhiÃªn báº£n 20.x trá»Ÿ lÃªn
- **Docker & Docker Compose**: ÄÃ£ cÃ i Ä‘áº·t vÃ  Ä‘ang cháº¡y dá»‹ch vá»¥
- **Háº¡n ngáº¡ch khÃ³a Google Gemini API**: Má»™t khÃ³a API Key há»£p lá»‡ Ä‘Æ°á»£c cáº¥p bá»Ÿi Google AI Studio

### CÃ¡c BÆ°á»›c CÃ i Ä‘áº·t

1. **Táº£i mÃ£ nguá»“n dá»± Ã¡n vá» mÃ¡y:**
   ```bash
   git clone https://github.com/quangtienngo661/ats-platform.git
   cd ats-platform
   ```

2. **CÃ i Ä‘áº·t cÃ¡c gÃ³i phá»¥ thuá»™c (Dependencies):**
   ```bash
   npm install
   ```

3. **Cáº¥u hÃ¬nh Biáº¿n MÃ´i trÆ°á»ng:**
   Táº¡o tá»‡p tin `.env` á»Ÿ thÆ° má»¥c gá»‘c cá»§a dá»± Ã¡n dá»±a trÃªn tá»‡p `.env.example` Ä‘Ã£ cÃ³ sáºµn. HÃ£y Ä‘iá»n cÃ¡c thÃ´ng tin káº¿t ná»‘i vÃ  cáº¥u hÃ¬nh sau:
   ```env
   SERVER_PORT=5000
   CLIENT_PORT=3000

   # Äá»‹a chá»‰ káº¿t ná»‘i PostgreSQL cÆ¡ sá»Ÿ dá»¯ liá»‡u
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/ats-db?schema=public"

   # Cáº¥u hÃ¬nh JWT máº­t mÃ£ kÃ½ Token
   JWT_SECRET="vietnamese_ats_platform_super_secret_signing_key_2026"

   # Cáº¥u hÃ¬nh káº¿t ná»‘i Redis Cache & BullMQ
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # Cáº¥u hÃ¬nh Gá»­i Email (XÃ¡c thá»±c Ä‘Äƒng kÃ½ thÃ nh viÃªn)
   SMTP_ENABLED=true
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password-from-google"
   SMTP_FROM="ATS Platform <noreply@ats-platform.com>"

   # Äá»‹a chá»‰ liÃªn káº¿t URL phá»¥c vá»¥ CORS & Redirect
   API_BASE_URL="http://localhost:5000"
   CLIENT_URL="http://localhost:3000"

   # TÃ­ch há»£p TrÃ­ tuá»‡ NhÃ¢n táº¡o Google Gemini API Key
   GOOGLE_API_KEY="your_google_gemini_api_key_here"

   # Biáº¿n mÃ´i trÆ°á»ng Next.js Frontend
   NEXT_PUBLIC_API_BASE_URL="http://localhost:5000"
   NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
   ```

4. **Khá»Ÿi cháº¡y Háº¡ táº§ng CÆ¡ sá»Ÿ Dá»¯ liá»‡u & HÃ ng Ä‘á»£i (Docker):**
   Khá»Ÿi Ä‘á»™ng nhanh cÃ¡c dá»‹ch vá»¥ PostgreSQL vÃ  Redis cháº¡y ngáº§m báº±ng cÃ¡ch sá»­ dá»¥ng Docker Compose:
   ```bash
   docker-compose up -d
   ```

5. **Äá»“ng bá»™ hÃ³a & Khá»Ÿi táº¡o Cáº¥u trÃºc CÆ¡ sá»Ÿ Dá»¯ liá»‡u (Prisma Migrations):**
   Khá»Ÿi cháº¡y tiáº¿n trÃ¬nh táº¡o cáº¥u trÃºc báº£ng, Ã¡p dá»¥ng cÃ¡c báº£n ghi vÃ  sinh cÃ¡c lá»›p TypeScript tá»± Ä‘á»™ng:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

### Khá»Ÿi cháº¡y MÃ´i trÆ°á»ng PhÃ¡t triá»ƒn (Local Dev)

Sá»­ dá»¥ng sá»©c máº¡nh cá»§a Nx CLI Ä‘á»ƒ khá»Ÿi cháº¡y Ä‘á»“ng thá»i cáº£ hai phÃ¢n há»‡ á»©ng dá»¥ng Backend vÃ  Frontend chá»‰ vá»›i cÃ¡c cÃ¢u lá»‡nh Ä‘Æ¡n giáº£n:

```bash
# Khá»Ÿi cháº¡y phÃ¢n há»‡ NestJS Backend API
npx nx serve api

# Khá»Ÿi cháº¡y phÃ¢n há»‡ Next.js Frontend Web
npx nx serve web
```

- **TÃ i liá»‡u Swagger API Ä‘áº§y Ä‘á»§**: Truy cáº­p trá»±c tiáº¿p táº¡i Ä‘á»‹a chá»‰ `http://localhost:5000/api` Ä‘á»ƒ xem vÃ  cháº¡y thá»­ cÃ¡c Endpoint.
- **Trang chá»§ á»©ng dá»¥ng Web**: Truy cáº­p Ä‘á»‹a chá»‰ `http://localhost:3000` trÃªn trÃ¬nh duyá»‡t Ä‘á»ƒ sá»­ dá»¥ng há»‡ thá»‘ng.

---

## ðŸŒ HÆ°á»›ng dáº«n Triá»ƒn khai Production

Dá»± Ã¡n há»— trá»£ sáºµn cáº¥u hÃ¬nh Docker hÃ³a toÃ n bá»™ há»‡ thá»‘ng Ä‘á»ƒ triá»ƒn khai lÃªn cÃ¡c dá»‹ch vá»¥ Ä‘Ã¡m mÃ¢y (AWS, GCP, DigitalOcean, Azure) má»™t cÃ¡ch an toÃ n vÃ  nhanh chÃ³ng.

### 1. Triá»ƒn khai báº±ng Docker Compose (DÃ nh cho Production)
Tá»‡p tin `docker-compose.yml` á»Ÿ thÆ° má»¥c gá»‘c Ä‘Ã£ Ä‘Æ°á»£c tá»‘i Æ°u hÃ³a Ä‘á»ƒ khá»Ÿi cháº¡y Ä‘á»“ng bá»™ **5 container Ä‘á»™c láº­p**:
- `postgres-db`: CÆ¡ sá»Ÿ dá»¯ liá»‡u PostgreSQL lÆ°u trá»¯ an toÃ n vá»›i á»• Ä‘Ä©a dá»¯ liá»‡u (Volumes).
- `redis-broker`: TrÃ¬nh quáº£n lÃ½ hÃ ng Ä‘á»£i BullMQ vÃ  phiÃªn lÆ°u trá»¯ Ä‘á»‡m.
- `ats-backend-api`: á»¨ng dá»¥ng NestJS cháº¡y trÃªn mÃ´i trÆ°á»ng tá»‘i Æ°u Node.js production.
- `ats-frontend-web`: á»¨ng dá»¥ng Next.js Ä‘Ã£ Ä‘Æ°á»£c biÃªn dá»‹ch trÆ°á»›c giÃºp tÄƒng tá»‘c Ä‘á»™ táº£i trang.
- `nginx-proxy`: ÄÃ³ng vai trÃ² mÃ¡y chá»§ tiáº¿p nháº­n, phÃ¢n tuyáº¿n vÃ  cáº¥u hÃ¬nh HTTPS.

Cháº¡y lá»‡nh sau Ä‘á»ƒ khá»Ÿi cháº¡y toÃ n bá»™ há»‡ thá»‘ng á»Ÿ cháº¿ Ä‘á»™ ná»n:
```bash
docker-compose -f docker-compose.yml up --build -d
```

### 2. Cáº¥u hÃ¬nh HTTPS báº£o máº­t báº±ng Nginx & Let's Encrypt
Há»‡ thá»‘ng sá»­ dá»¥ng Nginx Ä‘á»ƒ cáº¥u hÃ¬nh chá»©ng chá»‰ báº£o máº­t SSL miá»…n phÃ­ tá»« Let's Encrypt. DÆ°á»›i Ä‘Ã¢y lÃ  cáº¥u hÃ¬nh mÃ¡y chá»§ Nginx máº«u Ä‘Æ°á»£c tÃ­ch há»£p sáºµn táº¡i Ä‘Æ°á»ng dáº«n [nginx/nginx.conf](./nginx/nginx.conf):

```nginx
server {
    listen 80;
    server_name talentinterviewer.app www.talentinterviewer.app;

    # Tá»± Ä‘á»™ng chuyá»ƒn hÆ°á»›ng toÃ n bá»™ káº¿t ná»‘i HTTP sang HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name talentinterviewer.app www.talentinterviewer.app;

    # Cáº¥u hÃ¬nh Ä‘Æ°á»ng dáº«n chá»©ng chá»‰ SSL Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/talentinterviewer.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/talentinterviewer.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # PhÃ¢n tuyáº¿n yÃªu cáº§u Ä‘áº¿n Next.js Frontend
    location / {
        proxy_pass http://ats-frontend-web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # PhÃ¢n tuyáº¿n yÃªu cáº§u Ä‘áº¿n NestJS Backend API
    location /api {
        proxy_pass http://ats-backend-api:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # PhÃ¢n tuyáº¿n káº¿t ná»‘i thá»i gian thá»±c Socket.IO
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

Äá»ƒ tá»± Ä‘á»™ng gia háº¡n chá»©ng chá»‰ SSL hÃ ng thÃ¡ng, hÃ£y thÃªm tÃ¡c vá»¥ cron job sau vÃ o mÃ¡y chá»§ Linux:
```bash
0 12 * * * /usr/bin/certbot renew --quiet && docker kill -s HUP nginx-proxy
```

---

## ðŸ¤ ÄÃ³ng gÃ³p & Báº£n quyá»n

Má»i Ä‘Ã³ng gÃ³p nÃ¢ng cao tÃ­nh nÄƒng há»‡ thá»‘ng, sá»­a lá»—i vÃ  tá»‘i Æ°u hÃ³a Prompt Ä‘á»u Ä‘Æ°á»£c chÃ o Ä‘Ã³n! Quy trÃ¬nh Ä‘Ã³ng gÃ³p chuáº©n:
1. Táº¡o má»™t nhÃ¡nh má»›i (`git checkout -b feature/tÃ­nh-nÄƒng-má»›i`).
2. Thá»±c hiá»‡n cÃ¡c chá»‰nh sá»­a, bá»• sung mÃ£ nguá»“n vÃ  viáº¿t bá»• sung Unit Test náº¿u cÃ³.
3. Äáº£m báº£o cháº¡y kiá»ƒm tra mÃ£ nguá»“n khÃ´ng gáº·p lá»—i: `npx nx run-many --target=lint` vÃ  `npx nx run-many --target=test`.
4. Gá»­i Pull Request (PR) chi tiáº¿t mÃ´ táº£ rÃµ rÃ ng nhá»¯ng cáº£i tiáº¿n.

Dá»± Ã¡n Ä‘Æ°á»£c phÃ¢n phá»‘i dÆ°á»›i giáº¥y phÃ©p báº£n quyá»n pháº§n má»m tá»± do **MIT License**.

<div align="center">
  <sub>ÄÆ°á»£c phÃ¡t triá»ƒn vÃ  hoÃ n thiá»‡n vá»›i bá»Ÿi <b>Tien Ngo</b></sub>
</div>
