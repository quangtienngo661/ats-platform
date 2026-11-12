# GĐ4 — Phỏng vấn trực tuyến, AI co-pilot, thống kê — plan tóm tắt (13/11/2026)

Plan chi tiết: [`docs/tasks/gd4/plan.md`](../tasks/gd4/plan.md). Spec: [`docs/tasks/gd4/spec.md`](../tasks/gd4/spec.md).

## M1 — Phòng phỏng vấn trực tuyến
1. Tính khung giờ được vào phòng và kiểm điều kiện vào.
2. Lịch online không nhập link thì tự dùng phòng nội bộ.
3. API cấp token LiveKit cho đúng người trong buổi phỏng vấn.
4. Thêm LiveKit server vào compose dev và test.
5. Trang phòng họp và nút "Vào phòng phỏng vấn" cho ứng viên và recruiter.
6. E2E hai người vào cùng phòng.

## M2 — AI co-pilot
1. Bảng luật gợi ý bước tiếp theo cho từng đơn.
2. Bảng ghi quyết định áp dụng/bỏ qua và loại log AI `copilot`.
3. API xem, áp dụng, bỏ qua gợi ý và nhờ AI giải thích.
4. Gợi ý trên thẻ Kanban và dialog áp dụng.
5. E2E áp dụng gợi ý "Mời phỏng vấn".

## M3 — Thống kê và chi phí AI
1. Tính funnel, thời gian ở mỗi giai đoạn và chi phí AI.
2. Gắn log AI với tổ chức và thêm bảng giá model.
3. API thống kê tuyển dụng, tổng hợp chi phí AI, bảng giá.
4. Nâng cấp dashboard và bảng giá model cho admin.
5. E2E dashboard hiện đúng số funnel.
