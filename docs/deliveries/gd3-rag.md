# GĐ3 — Nâng cấp AI bằng RAG — plan tóm tắt (30/10/2026)

Plan chi tiết: [`docs/tasks/gd3-rag/plan.md`](../tasks/gd3-rag/plan.md). Spec: [phần 1–4](../tasks/gd3-rag/spec.md),
phần 0 ở `docs/tasks/gd3-p0-ai-provider/spec.md` (đưa vào nhánh M0 ở task đầu tiên).

## M0 — Phần 0: lớp nhà cung cấp AI + embedding
1. Đưa spec phần 0 vào nhánh, đồng bộ với `dev`.
2. Thêm kiểu chung và client Gemini.
3. Thêm client OpenAI (đọc tài liệu chính thức cho tên tham số suy luận và trường token).
4. Thêm `LlmService` gom 7 hàm AI, chọn client theo `AI_PROVIDER`, ghi nhật ký, huỷ sau 120 giây.
5. Cấu hình môi trường: `AI_PROVIDER`, key theo nhà cung cấp, compose.
6. Đổi 9 nơi gọi sang `LlmService`, gỡ `GeminiService`.
7. Thêm `EmbeddingService` và loại `embedding` trong nhật ký AI.
8. Web: nhật ký AI lọc và hiển thị `embedding`.
9. Probe API thật và kiểm tay luồng AI với OpenAI (cần cho phép).

## M1 — Phần 1: hạ tầng vector
1. Đổi image Postgres có pgvector, bật extension, thêm cột vector (kiểm tag image trước).
2. Thêm `VectorSearchService` gom raw SQL ghi/đọc vector.
3. Queue embedding cho kỹ năng và CV đã bóc tách.
4. Route admin backfill vector còn thiếu.

## M3b — Phần 3b: người duyệt (song song M0/M1)
1. Thêm trường duyệt, `ragMode` trên kết quả chấm và hàm tính điểm hiệu lực dùng chung.
2. API duyệt điểm: sửa 3 điểm con, lý do bắt buộc khi sửa, không đổi trạng thái hồ sơ; chấm lại xoá bản duyệt.
3. Ứng viên và file CSV dùng điểm hiệu lực.
4. Web: dialog duyệt điểm, dấu "Đã duyệt" ở Kanban, so sánh, chi tiết ứng viên.
5. E2E: recruiter duyệt điểm.

## M2 — Phần 2: khớp kỹ năng
1. Hàm khớp kỹ năng theo độ tương đồng embedding.
2. Đưa kỹ năng của tin vào chấm CV qua bộ khớp (sửa B-01, hai commit: test đỏ rồi fix).
3. Probe chốt ngưỡng khớp τ (cần cho phép).

## M3a — Phần 3a: mốc chấm
1. Chọn chế độ chấm và truy hồi 3 lần chấm đã duyệt gần nhất của cùng tin làm mốc trong prompt.

## M4 — Phần 4: ngân hàng câu hỏi
1. Bảng câu hỏi và API quản lý cho admin.
2. Sinh câu hỏi phỏng vấn thử từ ngân hàng, sinh bù khi thiếu, ghi nguồn từng câu.
3. Web: quản lý câu hỏi theo topic.
4. Soạn và seed khoảng 135 câu hỏi (người dùng duyệt nội dung).

## M5 — Đo và nghiệm thu
1. Bộ dữ liệu và script đo độ lệch điểm ở 3 chế độ.
2. Chạy đo, chốt τ và k, kiểm tay, cập nhật roadmap và tài liệu (cần cho phép, tốn tiền).

---

# GĐ3 — as-built (30/10/2026, chưa merge)

Sáu PR xếp chồng, **chưa merge**: M0 [#74](https://github.com/quangtienngo661/ats-platform/pull/74) (base `dev`) → M1 #75 → M3b #73 (base `dev`) → M2 #76 → M3a #77 → M4 #78 → M5 (PR này). Thứ tự merge: #74 → #75 → #73 → #76 → #77 → #78 → M5, rồi đổi base về `dev` và chạy lại CI.

## Đã làm và đã kiểm (có output trong `docs/tasks/gd3-rag/results/`)

- **M0** lớp `LlmService` + hai client + `EmbeddingService`; **M1** pgvector (image Alpine tự build, tag `18.4-0.8.1`), `VectorSearchService`, queue embedding, backfill; **M3b** người duyệt điểm + điểm hiệu lực; **M2** khớp kỹ năng theo embedding + sửa B-01; **M3a** neo chấm đã duyệt; **M4** ngân hàng câu hỏi (schema, API, sinh phiên, UI).
- Mỗi milestone: unit test xanh với `--skip-nx-cache`, `tsc`/lint/build, boot thật stack test cô lập. Truy vấn vector (cosine, lọc, loại dòng ẩn) kiểm bằng probe SQL trên Postgres thật.
- **M5:** script đo (`results/consistency/`): `stats.mjs` + `run-consistency.mjs`, 22 test `node --test` xanh, `--dry-run` in kế hoạch 150 lượt. Số học đã bị phá thử (đổi mẫu số độ lệch chuẩn → 3 test đỏ).

## Chưa làm / chưa kiểm — mỗi mục cần quyết định hoặc cho phép của chủ dự án

| Mục | Vì sao còn mở |
|---|---|
| Mọi lời gọi OpenAI thật (probe 0.8, kiểm tay C12/C17) | Chủ dự án hoãn; chưa biết tên tham số thật và số chiều mặc định đúng như SDK ghi |
| Chọn ngưỡng τ (Task 2.3) | Cần embed thật; τ=0.8 là mặc định, chưa có số liệu |
| Seed ngân hàng câu hỏi (Task 4.4) | Cần chọn topic, duyệt nội dung, và key thật để nạp embedding; ngân hàng rỗng nên phiên phỏng vấn chạy như cũ |
| Bộ dữ liệu và lần đo thật (Task 5.1 bước 3, 5.2) | Cần duyệt 10 cặp CV–job; chi phí 150 lượt chấm + ~100 lượt embedding phải ước tính trước |
| `docker-compose.yml` prod còn image Postgres cũ | Đổi sang image pgvector là quyết định riêng; DB prod hiện chưa có extension `vector` |
| Ứng viên vẫn thấy `aiRecommendation` / `aiReasoning` | Có từ trước GĐ3, ngoài phạm vi; cần quyết định |
| Tiêu đề CSV `Điểm tổng (gợi ý AI)` | Giờ có thể chứa điểm của người duyệt; chưa quyết đổi tên |
| README vẫn viết theo Gemini | Chưa cập nhật |

## Cần làm khi merge

- Thư mục untracked `docs/tasks/gd3-rag/` và `docs/deliveries/gd3-rag.md` ở checkout chính là bản cũ trùng với bản trong M0; xoá chúng trước khi merge M0 vào `dev`, nếu không Git từ chối ghi đè.
