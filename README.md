<div align="center">
  <h1>🚀 ATS Platform</h1>
  <p><strong>Hệ thống Quản trị Tuyển dụng (ATS) & Phỏng vấn Giả lập Tích hợp Trí tuệ Nhân tạo</strong></p>

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

## 📑 Mục lục

- [📌 Giới thiệu dự án](#-giới-thiệu-dự-án)
- [🏛️ Kiến trúc Hệ thống (System Architecture)](#️-kiến-trúc-hệ-thống-system-architecture)
- [✨ Các Tính năng Cốt lõi](#-các-tính-năng-cốt-lõi)
- [🧠 Quy trình Phỏng vấn Giả lập (AI Mock Interview)](#-quy-trình-phỏng-vấn-giả-lập-ai-mock-interview)
- [⚡ Hàng đợi & Xử lý Bất đồng bộ (BullMQ)](#-hàng-đợi--xử-lý-bất-đồng-bộ-bullmq)
- [🛡️ Bảo mật & Phân quyền Nâng cao](#️-bảo-mật--phân-quyền-nâng-cao)
- [🛠️ Công nghệ Sử dụng & Phiên bản](#️-công-nghệ-sử-dụng--phiên-bản)
- [🚀 Hướng dẫn Cài đặt & Khởi chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
- [🌐 Hướng dẫn Triển khai Production](#-hướng-dẫn-triển-khai-production)
- [🤝 Đóng góp & Bản quyền](#-đóng-góp--bản-quyền)

---

## 📌 Giới thiệu dự án

**ATS Platform** là hệ thống quản trị tuyển dụng toàn diện được thiết kế để giải quyết bài toán quá tải trong sàng lọc hồ sơ ứng viên và nâng cao chất lượng phỏng vấn sơ bộ cho các doanh nghiệp. 

Thay vì sử dụng các cơ chế CRUD đồng bộ truyền thống dễ gây nghẽn hệ thống khi chịu tải lớn, dự án áp dụng mô hình **Event-driven (Hướng sự kiện)** kết hợp với **Hàng đợi thông điệp bất đồng bộ (BullMQ)** và **Generative AI (Google Gemini API)** để tự động hóa toàn bộ quy trình:
1. **Trích xuất thông tin hồ sơ (CV Parsing)** tự động từ các file PDF ứng viên tải lên.
2. **Sàng lọc tự động (CV Screening)** đối chiếu chính xác kỹ năng, kinh nghiệm và học vấn với mô tả công việc (JD) theo trọng số cấu hình động.
3. **Phỏng vấn giả lập thời gian thực (AI Mock Interview)** qua kênh WebSocket để đánh giá năng lực ứng viên trước vòng gặp mặt trực tiếp, nhằm giảm đáng kể khối lượng công việc sàng lọc thủ công cho phòng nhân sự.

Dự án được xây dựng và quản trị chặt chẽ dưới dạng **Nx Monorepo**, đảm bảo tính mô-đun hóa cao, dễ dàng chia sẻ tài nguyên và mở rộng quy mô.

---

## 🏛️ Kiến trúc Hệ thống (System Architecture)

Hệ thống được thiết kế theo kiến trúc phân lớp (Layered Architecture) kết hợp xử lý bất đồng bộ nhằm phân rã độ trễ của các tác vụ AI nặng. Dưới đây là mô hình luồng hoạt động tổng quan:

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
        Browser["Trình duyệt Web (Zustand State)"]:::client
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

### Chi tiết các phân lớp:
1. **Client Layer (Next.js 16)**: Ứng dụng web hỗ trợ SSR (Server-Side Rendering) bằng App Router, phân chia các Route Group độc lập (`admin`, `recruiter`, `candidate`, `public`) cùng Middleware phân quyền tuyến đường (Route Protection) dựa trên trạng thái đăng nhập và vai trò người dùng được giải mã từ JWT. Trạng thái ứng dụng thời gian thực được quản lý tập trung thông qua **Zustand**.
2. **Real-time & Gateway Layer**: 
   - **Nginx Reverse Proxy**: Chịu trách nhiệm chấm dứt kết nối SSL (SSL Termination) bảo mật và phân tuyến yêu cầu (request routing) đến các dịch vụ nội bộ.
   - **Socket.IO Gateway**: Thiết lập kênh giao tiếp hai chiều bảo mật bằng cơ chế bắt tay JWT (Socket Handshake Auth) bám sát theo các phòng (Rooms) cô lập.
3. **Backend Layer (NestJS 11 + Nx)**: Thiết kế mô-đun hóa cao gồm 15 nghiệp vụ độc lập, sử dụng **Prisma ORM** để tương tác dữ liệu đồng bộ với hiệu năng cao.
4. **Queue & Worker Layer (BullMQ)**: Giải phóng hoàn toàn các request luồng HTTP chính bằng cách đẩy các tác vụ AI nặng vào hàng đợi thông điệp phân tán dựa trên **Redis**. Các Background Workers sẽ tiêu thụ tác vụ tuần tự và tự động cập nhật trạng thái cơ sở dữ liệu.
5. **AI Layer (Google Gemini Integration)**: Đóng gói chặt chẽ các Prompt chuyên biệt, giao tiếp qua bộ SDK `@google/genai` thế hệ mới, hỗ trợ cơ chế ngắt kết nối khi quá tải (AbortController timeout 120s).

---

## ✨ Các Tính năng Cốt lõi

- 🤖 **Trình trích xuất CV Tự động (CV Parsing Engine)**: Nhận dạng các file CV định dạng PDF, chuyển hóa dữ liệu phi cấu trúc thành cấu trúc JSON chuẩn gồm các trường: kỹ năng (skills), kinh nghiệm chi tiết (experience), học vấn (education), và dự án (projects).
- 📈 **Hệ thống Sàng lọc CV Thông minh (CV Screening Pipeline)**: So khớp hồ sơ ứng viên với yêu cầu công việc. Recruiter có thể tùy chỉnh trọng số (ví dụ: tăng trọng số Kinh nghiệm cho ứng viên Senior). AI tính điểm quy đổi tổng quát và phân loại trạng thái khuyến nghị rõ ràng (`Hire`, `Interview`, `Reject`).
- 💬 **Phỏng vấn Giả lập Thời gian thực (AI Mock Interview Chatbot)**: Ứng viên tham gia phỏng vấn trực tiếp với AI thông qua giao diện chatbot mượt mà. AI tự động sinh câu hỏi, hỏi tiếp (Follow-up) dựa trên câu trả lời thực tế, và chấm điểm độc lập khi kết thúc.
- 📋 **Bảng Quản lý Kanban Trực quan**: Hỗ trợ kéo thả linh hoạt để chuyển đổi trạng thái ứng tuyển của ứng viên (Kanban Stage Transition FSM), tự động kích hoạt thông báo trong ứng dụng (in-app notification) qua Socket.IO cho ứng viên khi trạng thái hồ sơ thay đổi.
- 🔔 **Hệ thống Thông báo Thời gian thực (Real-time Notification)**: Tích hợp sâu Socket.IO thông báo ngay lập tức cho Recruiter khi có ứng viên nộp hồ sơ mới hoặc khi AI đã chấm điểm phỏng vấn xong.
- ⚙️ **Cấu hình Trí tuệ Nhân tạo (Configurable AI Profiles)**: Cho phép quản trị viên thiết lập ngưỡng điểm sàng lọc tối thiểu và tùy chỉnh trọng số đánh giá (Skills, Experience, Education) cho từng chiến dịch tuyển dụng.

---

## 🧠 Quy trình Phỏng vấn Giả lập (AI Mock Interview)

Tính năng Phỏng vấn Giả lập được thiết kế bám sát các nguyên tắc UX hiện đại: **Không gây xao nhãng (Zero-distraction)** nhằm bảo vệ tâm lý ứng viên (không hiển thị điểm số từng câu giữa chừng) và **Độ trễ bằng không (Zero-latency)** giữa các câu hỏi chính.

### Giai đoạn 1: Khởi động Phiên (Session Initialization & Batch Generation)
1. Ứng viên kích hoạt phỏng vấn bằng cách gửi thông tin: Chủ đề (Topic), Độ khó (Difficulty), và tùy chọn đính kèm CV/JD.
2. Hệ thống gọi Gemini API bằng kỹ thuật **Prompt Engineering** nâng cao để sinh đồng loạt **10 câu hỏi cốt lõi** cùng các điểm cần trả lời mong đợi (`expected_points`) tương ứng trong **duy nhất 1 request** nhằm giảm thiểu tối đa độ trễ.
3. 10 câu hỏi này được lưu tức thì vào bảng `InterviewQnA` với thứ tự (`orderIndex`) tương ứng từ 1 đến 10.
4. Thông qua Socket.IO, hệ thống phát tín hiệu hiển thị câu hỏi số 1 lên màn hình chatbot của ứng viên.

### Giai đoạn 2: Vòng lặp Hỏi - Đáp (The Q&A Loop & Fast Routing)
Khi ứng viên đang trả lời câu hỏi thứ `N`:
1. Ứng viên nhập nội dung trả lời vào khung chat và nhấn gửi. Giao diện hiển thị trạng thái *"AI đang phân tích..." (Typing indicator)*.
2. Backend gọi Gemini API đánh giá nhanh bằng mô hình nhẹ (`gemini-3.5-flash`) để xác định xem câu trả lời có cần đào sâu hay không (rẽ nhánh Follow-up):
   - **Trường hợp A: Cần hỏi sâu thêm (Follow-up = True)**:
     - AI trả về câu hỏi phụ bám sát câu trả lời vừa gửi.
     - Socket.IO lập tức đẩy câu hỏi phụ này lên giao diện ứng viên.
     - Ứng viên trả lời lần 2. Sau khi gửi, hệ thống bỏ qua và hiển thị ngay câu hỏi chính số `N + 1` (đã có sẵn trong DB từ Giai đoạn 1).
     - Đồng thời, backend ném toàn bộ dữ liệu câu trả lời của câu `N` (bao gồm cả chính và phụ) vào **BullMQ Queue (`interview-evaluation`)** để chấm điểm ngầm dưới nền, tránh làm ứng viên bị nghẽn giao diện.
   - **Trường hợp B: Không cần hỏi sâu (Follow-up = False)**:
     - AI trả về cờ `false`. Hệ thống lập tức hiển thị câu hỏi chính số `N + 1` cho ứng viên.
     - Đẩy tác vụ chấm điểm câu `N` vào hàng đợi BullMQ để xử lý bất đồng bộ.

### Giai đoạn 3: Tổng hợp kết quả (Result Aggregation & Action Plan)
1. Khi ứng viên hoàn thành câu trả lời số 10, giao diện chatbot chuyển sang trạng thái *"Đang tổng hợp kết quả..."*.
2. Worker kiểm tra và đảm bảo BullMQ đã chấm điểm xong cho toàn bộ 10 câu hỏi trong database.
3. Hệ thống gom toàn bộ dữ liệu gồm 10 câu hỏi, 10 câu trả lời, điểm số thành một cấu trúc JSON lớn và gửi lên mô hình AI mạnh (`gemini-3.1-pro-preview`) để tạo ra **Đánh giá tổng quát (Final Assessment)**.
4. AI tính toán điểm trung bình thực tế (`overallScore`), phân tích chi tiết Điểm mạnh (`strengths`), Điểm yếu (`weaknesses`), và đề xuất Lộ trình hành động chi tiết (`actionPlan`) để ứng viên nâng cao kiến thức.
5. Sự kiện `session:completed` được emit qua Socket.IO, tự động chuyển hướng ứng viên sang trang hiển thị kết quả phỏng vấn trực quan và sinh động.

---

## ⚡ Hàng đợi & Xử lý Bất đồng bộ (BullMQ)

Để bảo vệ hệ thống khỏi rủi ro sập luồng do giới hạn số lượng yêu cầu của các dịch vụ AI (Rate Limit - Lỗi HTTP 429) và tối ưu hóa tài nguyên máy chủ, toàn bộ các tác vụ xử lý tốn thời gian đều được quản lý qua **BullMQ** kết hợp **Redis**.

Hệ thống thiết lập 4 hàng đợi nghiệp vụ chuyên biệt với cơ chế kiểm soát tốc độ (Global Rate Limiting) và cấu hình tự động thử lại với độ trễ tăng dần (Exponential Backoff Retry):

| Tên Hàng Đợi (Queue Name) | Chức Năng Nghiệp Vụ | Cấu Hình Tải & Rate Limit | Cơ Chế Thử Lại (Retry Policy) |
| :--- | :--- | :--- | :--- |
| **`send-verification-email`** | Gửi email kích hoạt tài khoản, mã OTP xác thực đăng ký và đổi mật khẩu. | Giới hạn tối đa **30 emails / phút** toàn cục để tránh bị đánh dấu Spam bởi SMTP. | Thử lại tối đa **3 lần** (per-job override) với Exponential Backoff (delay cơ sở 2s). |
| **`cv-processing`** | Trích xuất và phân tích cú pháp dữ liệu từ tệp tin CV PDF tải lên của ứng viên. | Giới hạn **15 tác vụ / phút** để chia sẻ hạn ngạch API của mô hình Gemini Flash. | Mặc định 1 lần thử (global default). Tự động dọn dẹp job hoàn tất khỏi bộ nhớ Redis (`removeOnComplete`). |
| **`cv-screening`** | Sàng lọc tự động đối chiếu các trường dữ liệu CV với yêu cầu chi tiết của JD. | Giới hạn **15 tác vụ / phút**. Tính toán điểm số theo trọng số và cập nhật trạng thái ứng tuyển. | Mặc định 1 lần thử. Exponential Backoff với độ trễ cơ sở **10 giây** (cấu hình global). |
| **`interview-evaluation`** | Chấm điểm độc lập từng câu hỏi phỏng vấn chính và phụ của ứng viên dưới nền. | Xử lý đồng thời tối đa **3 job** (`concurrency: 3`) để đảm bảo tốc độ phản hồi nhanh. | Đồng bộ kết quả trực tiếp với phiên Socket để cập nhật trạng thái chatbot thời gian thực. |

---

## 🛡️ Bảo mật & Phân quyền Nâng cao

Hệ thống áp dụng các biện pháp bảo mật phổ biến trong phát triển ứng dụng web hiện đại để bảo vệ dữ liệu của ứng viên và nhà tuyển dụng:

### 1. Cơ chế Xoay vòng Token JWT (Access/Refresh Token Rotation)
- **Phân tách lưu trữ Token**: Refresh Token được lưu trữ bên trong **HTTP-Only Cookie** với các thuộc tính bảo vệ (`SameSite=Strict`, `HttpOnly`, `Secure` ở môi trường production), trong khi Access Token được trả về qua response body để client lưu trữ trong bộ nhớ tạm (memory). Cơ chế này giúp giảm thiểu rủi ro tấn công đánh cắp phiên qua mã độc Javascript (**XSS**).
- **Cơ chế xoay vòng (Rotation)**: Mỗi khi Access Token hết hạn, hệ thống sử dụng Refresh Token để cấp phát một cặp Token mới và thu hồi ngay Token cũ trong cơ sở dữ liệu (đánh dấu `revoked` trong bảng `RefreshToken`). Cơ chế này giảm thiểu rủi ro khi Token bị lộ lọt bên ngoài.

### 2. Phân quyền Dựa trên Vai trò (RBAC) & Cô lập Dữ liệu (OwnershipGuard)
- **Phân quyền vai trò (Role-Based Access Control)**: Sử dụng các Decorators tùy biến (`@Roles()`) để phân loại chặt chẽ quyền hạn giữa các nhóm người dùng: `Admin` (Quản trị hệ thống), `Recruiter` (Nhà tuyển dụng) và `Candidate` (Ứng viên).
- **Kiểm soát sở hữu động (Dynamic Ownership Guard)**: Bảo mật ở cấp độ ID tài nguyên bằng Decorator `@Resources()`. Mọi truy cập vào dữ liệu nhạy cảm (như hồ sơ ứng viên, chi tiết điểm số phỏng vấn, thông tin cá nhân) đều được `OwnershipGuard` kiểm tra chéo xem người gửi yêu cầu có thực sự là chủ sở hữu hoặc nhà tuyển dụng quản lý hồ sơ đó hay không, giúp hạn chế lỗ hổng **IDOR (Insecure Direct Object Reference)**.

---

## 🛠️ Công nghệ Sử dụng & Phiên bản

Dự án sử dụng các công nghệ hiện đại và có phiên bản tương thích cao bám sát tệp cấu hình `package.json`:

### Công nghệ Frontend
- **Framework**: React 19 & Next.js 16.2.4 (App Router)
- **State Management**: Zustand 5.0.13
- **Styling**: Tailwind CSS 3.4.3 & Autoprefixer 10.4.13
- **Animations**: Framer Motion (Motion) 12.38.0
- **UI Components & Icons**: Lucide React 1.7.0 & Sonner 2.0.7
- **Data Visualization**: Recharts 3.8.1

### Công nghệ Backend & Core
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

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### Yêu cầu Hệ thống tối thiểu
- **Node.js**: Phiên bản 20.x trở lên
- **Docker & Docker Compose**: Đã cài đặt và đang chạy dịch vụ
- **Hạn ngạch khóa Google Gemini API**: Một khóa API Key hợp lệ được cấp bởi Google AI Studio

### Các Bước Cài đặt

1. **Tải mã nguồn dự án về máy:**
   ```bash
   git clone https://github.com/quangtienngo661/ats-platform.git
   cd ats-platform
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies):**
   ```bash
   npm install
   ```

3. **Cấu hình Biến Môi trường:**
   Tạo tệp tin `.env` ở thư mục gốc của dự án dựa trên tệp `.env.example` đã có sẵn. Hãy điền các thông tin kết nối và cấu hình sau:
   ```env
   SERVER_PORT=5000
   CLIENT_PORT=3000

   # Địa chỉ kết nối PostgreSQL cơ sở dữ liệu
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/ats-db?schema=public"

   # Cấu hình JWT mật mã ký Token
   JWT_SECRET="vietnamese_ats_platform_super_secret_signing_key_2026"

   # Cấu hình kết nối Redis Cache & BullMQ
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # Cấu hình Gửi Email (Xác thực đăng ký thành viên)
   SMTP_ENABLED=true
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password-from-google"
   SMTP_FROM="ATS Platform <noreply@ats-platform.com>"

   # Địa chỉ liên kết URL phục vụ CORS & Redirect
   API_BASE_URL="http://localhost:5000"
   CLIENT_URL="http://localhost:3000"

   # Tích hợp Trí tuệ Nhân tạo Google Gemini API Key
   GOOGLE_API_KEY="AIzaSyA_YOUR_ACTUAL_GEMINI_API_KEY_HERE"

   # Biến môi trường Next.js Frontend
   NEXT_PUBLIC_API_BASE_URL="http://localhost:5000"
   NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
   ```

4. **Khởi chạy Hạ tầng Cơ sở Dữ liệu & Hàng đợi (Docker):**
   Khởi động nhanh các dịch vụ PostgreSQL và Redis chạy ngầm bằng cách sử dụng Docker Compose:
   ```bash
   docker-compose up -d
   ```

5. **Đồng bộ hóa & Khởi tạo Cấu trúc Cơ sở Dữ liệu (Prisma Migrations):**
   Khởi chạy tiến trình tạo cấu trúc bảng, áp dụng các bản ghi và sinh các lớp TypeScript tự động:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

### Khởi chạy Môi trường Phát triển (Local Dev)

Sử dụng sức mạnh của Nx CLI để khởi chạy đồng thời cả hai phân hệ ứng dụng Backend và Frontend chỉ với các câu lệnh đơn giản:

```bash
# Khởi chạy phân hệ NestJS Backend API
npx nx serve api

# Khởi chạy phân hệ Next.js Frontend Web
npx nx serve web
```

- **Tài liệu Swagger API đầy đủ**: Truy cập trực tiếp tại địa chỉ `http://localhost:5000/api` để xem và chạy thử các Endpoint.
- **Trang chủ ứng dụng Web**: Truy cập địa chỉ `http://localhost:3000` trên trình duyệt để sử dụng hệ thống.

---

## 🌐 Hướng dẫn Triển khai Production

Dự án hỗ trợ sẵn cấu hình Docker hóa toàn bộ hệ thống để triển khai lên các dịch vụ đám mây (AWS, GCP, DigitalOcean, Azure) một cách an toàn và nhanh chóng.

### 1. Triển khai bằng Docker Compose (Dành cho Production)
Tệp tin `docker-compose.yml` ở thư mục gốc đã được tối ưu hóa để khởi chạy đồng bộ **5 container độc lập**:
- `postgres-db`: Cơ sở dữ liệu PostgreSQL lưu trữ an toàn với ổ đĩa dữ liệu (Volumes).
- `redis-broker`: Trình quản lý hàng đợi BullMQ và phiên lưu trữ đệm.
- `ats-backend-api`: Ứng dụng NestJS chạy trên môi trường tối ưu Node.js production.
- `ats-frontend-web`: Ứng dụng Next.js đã được biên dịch trước giúp tăng tốc độ tải trang.
- `nginx-proxy`: Đóng vai trò máy chủ tiếp nhận, phân tuyến và cấu hình HTTPS.

Chạy lệnh sau để khởi chạy toàn bộ hệ thống ở chế độ nền:
```bash
docker-compose -f docker-compose.yml up --build -d
```

### 2. Cấu hình HTTPS bảo mật bằng Nginx & Let's Encrypt
Hệ thống sử dụng Nginx để cấu hình chứng chỉ bảo mật SSL miễn phí từ Let's Encrypt. Dưới đây là cấu hình máy chủ Nginx mẫu được tích hợp sẵn tại đường dẫn [nginx/nginx.conf](./nginx/nginx.conf):

```nginx
server {
    listen 80;
    server_name talentinterviewer.app www.talentinterviewer.app;

    # Tự động chuyển hướng toàn bộ kết nối HTTP sang HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name talentinterviewer.app www.talentinterviewer.app;

    # Cấu hình đường dẫn chứng chỉ SSL Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/talentinterviewer.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/talentinterviewer.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Phân tuyến yêu cầu đến Next.js Frontend
    location / {
        proxy_pass http://ats-frontend-web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Phân tuyến yêu cầu đến NestJS Backend API
    location /api {
        proxy_pass http://ats-backend-api:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Phân tuyến kết nối thời gian thực Socket.IO
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

Để tự động gia hạn chứng chỉ SSL hàng tháng, hãy thêm tác vụ cron job sau vào máy chủ Linux:
```bash
0 12 * * * /usr/bin/certbot renew --quiet && docker kill -s HUP nginx-proxy
```

---

## 🤝 Đóng góp & Bản quyền

Mọi đóng góp nâng cao tính năng hệ thống, sửa lỗi và tối ưu hóa Prompt đều được chào đón! Quy trình đóng góp chuẩn:
1. Tạo một nhánh mới (`git checkout -b feature/tính-năng-mới`).
2. Thực hiện các chỉnh sửa, bổ sung mã nguồn và viết bổ sung Unit Test nếu có.
3. Đảm bảo chạy kiểm tra mã nguồn không gặp lỗi: `npx nx run-many --target=lint` và `npx nx run-many --target=test`.
4. Gửi Pull Request (PR) chi tiết mô tả rõ ràng những cải tiến.

Dự án được phân phối dưới giấy phép bản quyền phần mềm tự do **MIT License**.

<div align="center">
  <sub>Được phát triển và hoàn thiện với bởi <b>Tien Ngo</b></sub>
</div>
