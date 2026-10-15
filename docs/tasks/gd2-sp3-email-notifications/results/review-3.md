# Review Task 3 — MailService.sendMail / readTemplate / isSmtpEnabled (approved, 5a797ee + a418672)

- Files: `mail.service.spec.ts` (pha 1), `mail.service.ts` (pha 2). Không chạm file khác; spec đã commit không đổi ở pha 2 (`git diff 5a797ee -- …spec.ts` rỗng).
- Đỏ trước: 7 lỗi TS2339 đúng cho ba hàm chưa có, không lỗi khác (`Tests: 0 total`, suite không chạy được vì type-check — đó chính là "hàm chưa có").
- Xanh: `--testPathPatterns="common/mail"` 6/6; `--testPathPatterns="auth"` 3 suite, 22/22 (nơi gọi hai hàm email cũ).
- Interfaces: `isSmtpEnabled(): boolean` thay getter `isEnabled`; `readTemplate(fileName: string): string` qua `getTemplatePath`, ném ENOENT; `sendMail({to,subject,html,text}): Promise<boolean>` — tắt thì log `[SMTP disabled] Would send "<subject>" to <to>` và trả `false`, bật thì gửi `{ from, ...message }` và trả `true`, lỗi SMTP được ném ra. Khớp plan.
- Ghi chú: agent chuyển tiếp chết giữa chừng vì giới hạn phiên (429); job Codex đã `completed` (kiểm bằng `codex-companion status`) trước khi review.
- `git ls-remote --heads origin feat/gd2-sp3-email-notifications`: rỗng.
