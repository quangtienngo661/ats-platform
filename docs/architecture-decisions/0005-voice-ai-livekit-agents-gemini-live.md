# 0005. Voice AI cho mock interview: LiveKit Agents + Gemini Live

## Trạng thái

Accepted

## Ngày

2026-07-15

## Bối cảnh (Context)

AI mock interview hiện tại chỉ dạng text-chat qua Socket.IO. Research (`docs/research/2026-07-15-voice-video-microservices-differentiators.md`, Part 1–2) đặt câu hỏi: thêm voice (ứng viên nói, AI nói lại) có cần một vendor AI thứ ba không, hay tận dụng được hai khoản đầu tư đã có sẵn — `GeminiService` (Google Gemini qua `@google/genai`, vendor AI duy nhất trong repo) và LiveKit (đã roadmap ở Phase 3 cho video call phỏng vấn người thật, tự host qua Docker)?

Research đã so sánh 6+ phương án thật (Gemini Live, OpenAI Realtime, ElevenLabs, Deepgram, Vapi/Retell/Bland, Web Speech API) kèm trích dẫn nguồn chính thức, không phải suy đoán. ADR này không suy luận lại từ đầu — chỉ nén kết luận đã có thành định dạng quyết định kiến trúc.

## Quyết định (Decision)

Dùng **LiveKit Agents + Gemini Live**, triển khai như **Phase 3.5** — bắt đầu **sau** Phase 3 (phụ thuộc server LiveKit tự host mà Phase 3 dựng), không làm trước hoặc song song.

Cụ thể:
- AI tham gia phòng LiveKit như một participant thật (giống người phỏng vấn), qua plugin Node.js chính thức `@livekit/agents-plugin-google` (class `RealtimeModel` bọc Gemini Live) — khớp vì backend là NestJS/Node, không cần runtime Python thứ hai.
- Một worker process riêng, độc lập với NestJS app và BullMQ, giữ kết nối tới Gemini Live để stream audio phòng ra/vào.
- Dùng model `gemini-2.5-flash-native-audio-preview` (bản trưởng thành), **không** dùng `gemini-3.1-flash-live-preview` (có giới hạn tương thích đã ghi nhận trong plugin: không cập nhật config giữa phiên, không agent handoff, không async function call).
- Tái dùng `GOOGLE_API_KEY` hiện có — không thêm credential mới. Chấp nhận Gemini Developer API Live vẫn ở trạng thái Preview/no-SLA (GA-with-SLA chỉ có ở Vertex AI, đòi hỏi GCP service account + billing project riêng — không đáng đánh đổi cho một capstone demo).
- Tái dùng logic sinh câu hỏi + follow-up branching đã có ở mock interview dạng text — voice là đổi modality trên kiến trúc cũ, không phải thiết kế lại.
- Đầu tư thời gian thiết kế có chủ đích cho silence-timeout (khi nào coi là ứng viên nói xong) — đây là điểm UX thật sự gây phàn nàn ở đối thủ, không phải latency thô.
- **Fallback nếu timeline gấp**: Web Speech API bolt-on (browser `SpeechRecognition`/`SpeechSynthesis`, chuyển giọng nói thành text vào đúng field Socket.IO hiện có) — zero vendor mới, zero infra mới, zero đổi backend. Công khai giới hạn: Firefox không hỗ trợ nhận diện giọng nói (trừ khi bật flag thủ công), không có turn-detection thật, không phải "conversational agent" thật.

## Lý do (Rationale)

- **Tận dụng hai khoản đầu tư đã cam kết**, không thêm vendor thứ ba: cùng `GOOGLE_API_KEY`/`GeminiService`, cùng server LiveKit Phase 3 đã roadmap tự host.
- **Tích hợp có tài liệu chính thức, không phải hack**: LiveKit tự nêu "interview bots" là use case, có starter mẫu chạy được (`livekit-examples/gemini-live-quickstart`), plugin Node chính thức từ Google — xác nhận bằng cách fetch trực tiếp tài liệu LiveKit.
- **Kiến trúc worker độc lập khớp sẵn với Phase 4 Step 7** (`docs/migration-roadmap.md`: "Extract LiveKitService as standalone microservice") — nếu build voice-AI worker từ đầu như một deployable process riêng (không nhét vào NestJS monolith), nó tự động fold vào Step 7 thay vì cần một lần migrate riêng sau này.
- **Bốn đối thủ voice-AI thật đã research (Apriora, Ribbon, Mercor, Karat) đều giữ đúng pattern follow-up branching** mà mock interview text hiện tại đã có — xác nhận kiến trúc câu hỏi/follow-up hiện tại là đúng hướng, voice chỉ là lớp modality thêm vào.
- **Phàn nàn phổ biến nhất ở nhóm sản phẩm này là pacing** (AI chuyển câu quá nhanh), không phải latency kỹ thuật — nên bài toán thiết kế khó thật sự là silence-timeout, không phải chọn vendor nhanh nhất.

## Lựa chọn khác đã cân nhắc (Alternatives considered)

- **OpenAI Realtime API** (`gpt-realtime-2.1`) — latency tốt (p95 giảm ≥25% so với bản trước), nhưng vendor thứ ba, không tái dùng được gì đã có, chỉ có managed API (không tự host). Loại.
- **ElevenLabs Conversational AI** — TTS streaming rất nhanh (~75ms), nhưng vendor thứ ba, cần thêm một LLM riêng cho phần hội thoại (chỉ mạnh về giọng nói), giá $0.08–0.10/phút + chi phí LLM tách biệt. Loại.
- **Deepgram Voice Agent API** — latency dưới 300ms, nhưng vẫn là vendor thứ ba không tái dùng được credential/infra hiện có. Loại.
- **Vapi / Retell AI / Bland AI** — hướng tới telephony/call-center, sai use case; giá thực tế đã blend cao hơn nhiều giá niêm yết ($0.25–0.33/phút, $2K–13K/tháng ở quy mô vừa) — không phù hợp use case một cuộc phỏng vấn mock. Loại.
- **Chuyển sang Vertex AI chỉ để lấy GA/SLA cho Gemini Live** — cần thêm GCP service account + billing project, quy mô công việc không tương xứng với lợi ích cho một capstone demo (Preview/no-SLA đã đủ dùng). Loại, không phải bây giờ.
- **Web Speech API làm phương án chính** (không chỉ fallback) — giữ lại như phương án dự phòng được đặt tên rõ ràng nếu timeline gấp, không loại hẳn: zero vendor/infra/backend risk, nhưng không phải conversational agent thật (không có LLM reasoning, không turn-detection thật, thiếu hỗ trợ Firefox) — đây là lựa chọn scope-down có chủ đích, không phải quyết định kiến trúc chính.

## Đánh đổi (Trade-offs)

**Được:**
- Không vendor AI mới, không credential mới.
- Tích hợp có tài liệu chính thức và ví dụ chạy được, không phải giải pháp tự chế rủi ro.
- Kiến trúc worker độc lập sẵn sàng cho Phase 4 Step 7, tránh một lần migrate thứ hai.
- Tái dùng toàn bộ logic sinh câu hỏi/follow-up của mock interview text — không phải thiết kế lại từ đầu.

**Mất:**
- Gemini Developer API Live vẫn Preview/không có SLA — chấp nhận được cho demo capstone, không phù hợp nếu sau này cần chạy sản xuất thật có cam kết uptime.
- LiveKit Agents worker là hạ tầng mới thật sự — một process nền thường trực, khác hẳn pattern controller NestJS hay BullMQ job đang có — cần thời gian build/deploy/giám sát riêng, không phải mở rộng nhỏ của `GeminiService`.
- Phụ thuộc cứng vào Phase 3: không thể bắt đầu voice AI trước khi server LiveKit của Phase 3 tồn tại (xem Hệ quả).

## Hệ quả (Consequences)

- **Ràng buộc trình tự (đã ghi trong `docs/migration-roadmap.md` Phase 3.5): không thể bắt đầu trước khi server LiveKit tự host của Phase 3 tồn tại.** Kiến trúc được chọn cần AI tham gia phòng LiveKit như một participant — không có gì để build vào cho tới khi server đó chạy. Build voice trước Phase 3 nghĩa là hoặc kéo việc dựng LiveKit server lên sớm dưới vỏ bọc khác, hoặc xây một pipeline voice tạm thời ngoài LiveKit rồi sau phải thay — cả hai đều không đáng.
- LiveKit Agents worker phải được build từ đầu như một deployable process riêng (package.json/entry point riêng) — không nhúng vào NestJS app — để tự động khớp vào Phase 4 Step 7 thay vì tạo thêm việc tách sau này.
- `docs/migration-roadmap.md` Phase 3.5 đã phản ánh đúng quyết định này — ADR này không cần sửa roadmap (ngoài phạm vi thay đổi cho phép).
- Nếu chọn đi theo fallback Web Speech API vì thiếu thời gian, đó là quyết định giảm phạm vi lúc thực thi, không phải lý do xét lại ADR này.
