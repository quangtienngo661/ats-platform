# Review Task 6 — `toCsv` (2026-10-14)

**Kết luận:** approved. Commit do phiên `-impl`: `aa0c2c1` test, feat ngay sau.

| Kiểm | Kết quả (phiên `-impl` tự chạy) |
|---|---|
| Pha 1 | đỏ chỉ vì TS2307 `./csv.util`; hàm thuần, không setup nào có thể che lỗi (bài học Task 5) |
| Test | chuỗi kỳ vọng viết nguyên văn: BOM + CRLF; `"` nhân đôi; dấu phẩy và `\n` trong một ô (E9); `it.each` 7 ký tự `= + - @ \t \r \n` → tab đầu ô (C12, E10, Review Focus 2); null/undefined → `""`; tiếng Việt giữ nguyên; control: `82.5` và `Alice=1+1` không bị thêm tab |
| Pha 2 — file | chỉ `apps/api/src/common/utils/csv.util.ts`; spec không đổi |
| Jest `csv.util` | 13/13 passed |
| eslint | sạch |
| Vòng 1 (nhỏ) | comment trích URL OWASP cũ (`owasp.org/www-community/…`, theo spec đã 308) → đổi sang `https://community.owasp.org/attacks/CSV_Injection` |
| Không push | không có `refs/remotes/origin/feat/gd2-sp2-bulk-screening` |
