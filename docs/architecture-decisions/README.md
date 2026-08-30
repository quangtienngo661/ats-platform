# Architecture Decision Records

Ghi lại các quyết định kiến trúc quan trọng trong quá trình migrate ATS Platform từ modular monolith sang RAG + microservices (xem `docs/migration-roadmap.md` cho checklist/timeline — file đó không lặp lại phần giải thích "tại sao", chỉ trỏ về đây).

## Khi nào viết một ADR mới

Viết khi quyết định:

- Ảnh hưởng tới nhiều module/service, hoặc khó đảo ngược sau này, hoặc
- Có từ 2 lựa chọn hợp lý trở lên và cần giải thích tại sao chọn cái này chứ không phải cái kia, hoặc
- Giải quyết một vấn đề kỹ thuật/nghiệp vụ cụ thể đã phát hiện trong quá trình audit/migrate.

Không cần viết ADR cho những thay đổi nhỏ, hiển nhiên, hoặc chỉ có một cách làm hợp lý.

## Cách đặt tên file

`NNNN-slug-ngan-gon.md`, đánh số tăng dần (`0001`, `0002`, ...). Khi một quyết định cũ bị thay thế, **không sửa lại file cũ** — tạo ADR mới, ghi `Supersedes 000X` / `Superseded by 000Y` ở phần Trạng thái của cả hai file để giữ lịch sử quyết định.

## Danh sách ADR

| #                                                                     | Tên                                                                    | Trạng thái | Ngày       |
| ---------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------- | ---------- |
| [0001](0001-docker-base-image-glibc.md)                                | Đổi base image apps/api/Dockerfile từ Alpine sang Debian slim            | Accepted   | 2026-07-11 |
| [0002](0002-no-auto-reject-on-ai-score.md)                              | Không tự động loại ứng viên dựa trên điểm AI                            | Accepted   | 2026-07-14 |
| [0003](0003-microservices-transport-and-migration-strategy.md)         | Chiến lược transport và migration cho microservices (Phase 4)           | Accepted   | 2026-07-16 |
| [0004](0004-service-ownership-shared-reference-tables.md)              | Service sở hữu cho bảng dữ liệu dùng chung (Department/Skill/JobCategory/AiConfig) | Accepted   | 2026-07-16 |
| [0005](0005-voice-ai-livekit-agents-gemini-live.md)                     | Voice AI cho mock interview: LiveKit Agents + Gemini Live               | Accepted   | 2026-07-15 |

## Template

Copy `0000-template.md` khi tạo ADR mới.
