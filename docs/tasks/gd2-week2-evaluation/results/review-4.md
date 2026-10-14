# Review — Task 4 (API scorecard)

- Pha 1: Codex viết `interview-scorecards.service.spec.ts` (13 `it`/`it.each`), `dto/upsert-scorecard.dto.spec.ts` (4), thêm `interviewScorecard`, `applicationNote` vào `createPrismaMock`.
  - Phiên `-impl` chạy lại: 2 suite đỏ vì `TS2307 Cannot find module` (service/DTO chưa có) → đỏ đúng lý do; `interviews.service|applications.service` vẫn xanh 110/110.
  - Review Focus 1 (recruiter khác khoa đọc → 403, helper được gọi với `(caller, id)`), 3 (2000/2001), 4 (hai lần submit cùng `where: { interviewId }`, không `create`) có test assert hành vi.
  - Commit `4fac673 test(api): add the scorecard rules`.
- Pha 2: DTO, service, controller, module, `app.module.ts`. Không file test nào đổi.
  - Thứ tự kiểm: tìm lịch → `assertInCallerOrganizationOr404` → R1 → R2 → R3 → `upsert({ where: { interviewId } })`; `organizationId` lấy từ lịch, field DTO chép tường minh (không spread).
  - Route `@Roles(UserRole.recruiter, UserRole.admin)`; `RolesGuard.grantedRoles(org_admin)` = `[org_admin, recruiter]` (phiên `-impl` tự đọc `roles.guard.ts`) nên org_admin được phủ.
  - Không trùng route: `InterviewsController` (`@Controller('interviews')`) có `schedules/:id` nhưng không có `schedules/:id/scorecard`.
  - Phiên `-impl` chạy lại: jest `interview-scorecards|interviews|applications|tenant-caller` → 13 suite, 203/203 pass; `rm -rf dist .nx/cache && npx nx build api` → thành công; `npx nx lint api` → thành công.
  - Commit `c35b3f9 feat(api): add interview scorecards`.
- Finding nhỏ: Review Focus 1 được chứng minh bằng mock helper trả 403 (unit, nối dây), không chạy logic khoa thật của `assertCanViewSchedule`/`assertCanAccessApplication` (logic đó đã có test riêng ở `interviews.service.spec.ts`/`applications.service.spec.ts`). E2E Task 12 phủ thêm.
- `git ls-remote --heads origin feat/gd2-sp1-evaluation` → rỗng.
- Kết luận: approved.
