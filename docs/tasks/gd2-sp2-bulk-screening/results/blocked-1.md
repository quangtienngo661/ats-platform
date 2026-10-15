# Blocked — Task 1: Codex không commit được trong worktree (2026-10-14)

**Trạng thái:** ĐÃ GIẢI QUYẾT (2026-10-14). Người dùng chốt, qua phiên điều phối, gần với phương án A: Codex không
`git add`/commit; mỗi task có test + code chạy 2 pha (Codex viết test → phiên `-impl` thấy đỏ đúng lý do, commit `test(...)`;
Codex viết code → phiên `-impl` thấy xanh, review, commit `feat/fix/refactor(...)`); task một commit thì review rồi commit.
Commit do phiên `-impl` làm, đúng message của plan, không trailer, chỉ `git add` file trong Files.

**Ban đầu:** nội dung Task 1 approved; bước Commit chưa làm được. Dừng trước Task 2, chờ điều phối/người dùng.

## Hiện tượng

Codex (gọi qua `codex:codex-rescue`, `--write`) chạy `git add docs/tasks/gd2-sp2-bulk-screening/results/early-checks.md`:

```text
fatal: Unable to create 'E:/Learnings/Learning Stuffs/University/HK6/Do_an_1/Main/Project/alsp-ai-harness/projects/ats-platform/.git/worktrees/ats-sp2/index.lock': Permission denied
```

`git rev-parse --git-dir` trong worktree (phiên `-impl` chạy) =
`E:/Learnings/…/projects/ats-platform/.git/worktrees/ats-sp2`, tức thư mục git của worktree nằm **trong checkout dùng chung**,
ngoài `E:\wt\ats-sp2`.

## Nguyên nhân (giả thuyết, chưa kiểm)

Sandbox `--write` của Codex chỉ cho ghi trong thư mục làm việc (`E:\wt\ats-sp2`); `index.lock` phải tạo ở `.git/worktrees/ats-sp2`
nằm ngoài vùng đó. Cách khác cũng cho cùng thông báo: quyền NTFS của thư mục đó. Chưa tách hai khả năng (phiên `-impl` chưa
thử `git add` vì làm vậy là đổi giao thức commit trước khi được duyệt).

## Hệ quả

Mọi task có bước Commit (Task 1–11, 5b) gặp đúng lỗi này. Task 0 không có commit nên không lộ.

## Phương án

| Phương án | Được | Mất |
|---|---|---|
| A. Codex viết code và chạy test, để thay đổi trong working tree; phiên `-impl` review xong thì `git add` đúng file trong Files và commit đúng message của plan (không trailer), test commit trước, code commit sau (khuyến nghị) | Không đụng cấu hình Codex hay settings; review xảy ra **trước** commit | Lệch quy tắc "commit do Codex làm"; bằng chứng "test đỏ trước" là log đỏ của Codex + thứ tự commit, không phải commit do chính Codex tạo |
| B. Cho sandbox Codex ghi thêm `…/.git/worktrees/ats-sp2` | Giữ đúng giao thức | Phải đổi cấu hình Codex/plugin — phiên `-impl` không được tự làm; chưa biết forwarder có cờ cho việc này |
| C. Người dùng tự commit mỗi task | Không ai ngoài người dùng ghi history | Người dùng phải có mặt sau mỗi task |
