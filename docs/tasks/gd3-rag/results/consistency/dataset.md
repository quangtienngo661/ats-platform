# Bộ dữ liệu đo độ nhất quán — định dạng và trạng thái

**Trạng thái: CHƯA CÓ nội dung.** Plan (Task 5.1, bước 3) yêu cầu chủ dự án duyệt 10 cặp CV–job trước khi
commit. Chưa có `dataset.json`, nên `run-consistency.mjs` chỉ chạy được `--dry-run`.

## Định dạng `dataset.json`

Mảng 10 phần tử. Mỗi cặp là một đơn ứng tuyển **seed riêng cho phép đo** (không dùng đơn thật: mỗi lượt chạy
ghi đè dòng `cv_screenings` của đơn đó):

```json
[
  {
    "pairId": "p1",
    "applicationId": "<uuid>",
    "cvId": "<uuid>",
    "configId": "<uuid>",
    "screeningId": "<uuid>"
  }
]
```

- `screeningId` là dòng `cv_screenings` đã tồn tại của đơn đó (khoá duy nhất theo `applicationId`).
- Cần các `cv_parsed_data` đã có embedding (chế độ `skills` / `skills_anchors` dùng chúng).
- Chế độ `skills_anchors` chỉ có neo khi đã có các lượt chấm **đã được người duyệt** (M3a); nếu không processor
  tự hạ xuống `skills` và script dừng với thông báo, không ghi số liệu sai vào ô đó.

## Cách chạy (sau khi chủ dự án duyệt và đặt key)

```bash
DATABASE_URL=<test stack, cổng 55432> REDIS_URL=redis://localhost:56379 \
  node docs/tasks/gd3-rag/results/consistency/run-consistency.mjs \
  --model <tên model> --threshold <τ đang dùng> --anchor-count <k đang dùng>
```

Kết quả: `runs.json` (ghi sau từng lượt) và `summary.md`. Chi phí cần ước tính trước bằng `--dry-run`.
