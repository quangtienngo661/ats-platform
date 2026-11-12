# GĐ4 — research

Mỗi dòng ghi **documented** (đọc ở nguồn chính thức, có URL và ngày) hoặc **verified** (chạy ở đây). Hai loại không gộp.

| # | Kết luận | Loại | Nguồn |
|---|---|---|---|
| 1 | Phiên bản npm mới nhất ngày 12/11/2026: `livekit-server-sdk` 2.19.3 (10/11), 2.19.2 (22/10); `livekit-client` 2.24.0 (12/11), 2.23.0 (16/10); `@livekit/components-react` 2.9.25 (05/11), 2.9.24 (11/08); `@livekit/components-styles` 1.2.0 (14/11/2025). Dùng bản cũ hơn 2 tuần: 2.19.2 / 2.23.0 / 2.9.24 / 1.2.0. | verified | `npm view <pkg> time` chạy 12/11/2026 |
| 2 | `@livekit/components-react` 2.9.25 yêu cầu peer `react >=18`, `react-dom >=18`, `livekit-client ^2.20.1`, `tslib ^2.6.2`; `@livekit/krisp-noise-filter` là peer tuỳ chọn. | verified | `npm view @livekit/components-react peerDependencies` |
| 3 | Tag image `livekit/livekit-server`: `v1.13.11` (25/10/2026), `v1.13.10` (14/10). Ghim `v1.13.10`. | verified | Docker Hub API `/v2/repositories/livekit/livekit-server/tags`, 12/11/2026 |
| 4 | `livekit-server --dev` dùng cặp khoá giữ chỗ `devkey` / `secret`. | documented | https://raw.githubusercontent.com/livekit/livekit/master/README.md (đọc 12/11/2026) |
| 5 | Cấu hình rtc: `tcp_port: 7881` (ICE qua TCP khi không có UDP, không đặt sau TLS/LB); `udp_port` là UDP mux; `node_ip` là IP quảng bá cho client; cổng signal mặc định 7880. | documented | https://raw.githubusercontent.com/livekit/livekit/master/config-sample.yaml (12/11/2026) |
| 6 | Cờ CLI và biến môi trường tương ứng: `--keys` ↔ `LIVEKIT_KEYS` (dạng `"key: secret"`), `--node-ip` ↔ `NODE_IP`, `--udp-port` ↔ `UDP_PORT`, `--bind`, `--config-body` ↔ `LIVEKIT_CONFIG`, `--dev`. | documented | https://raw.githubusercontent.com/livekit/livekit/master/cmd/server/main.go (12/11/2026) |
| 7 | Ở chế độ dev, dải cổng TURN relay mặc định là 30000–30002 ("to make it easier to run in dev mode/docker"). | documented | https://raw.githubusercontent.com/livekit/livekit/master/pkg/config/config.go (12/11/2026) |

Các dòng về API của SDK (tên lớp, tham số token) được bổ sung khi cài package ở M1, đọc từ file `.d.ts` của bản đã cài.
