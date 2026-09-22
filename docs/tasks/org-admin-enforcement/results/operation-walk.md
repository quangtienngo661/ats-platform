org A rows: 1 departments · 2 job postings · 3 applications · 1 AI configs · 3 recruiters
org B rows: 2 departments · 4 AI configs (default created with the org) · 1 recruiters

SOCKET_IDS {"jobA":"3033066e-adbf-481b-a1d9-4a513ff6735b","org_admin B":"8kQ2ILXknTUhBHQVAAAR","recruiter B":"RswrN6zvyiVlcFfYAAAT","org_admin A":"HQWPovUIu827Sx14AAAV","platform admin":"VkDay3mf586Q4pHSAAAX"}
| who | request | status | verdict | note |
|---|---|---:|---|---|
| platform admin | `POST /departments` | 400 | PASS | Quản trị viên nền tảng phải chỉ định tổ chức (organizationId) |
| platform admin | `POST /users` | 400 | PASS | Tài khoản quản trị tổ chức phải được gắn với một tổ chức (organization |
| org_admin B | `GET /organizations` | 403 | PASS | Bạn không có quyền truy cập tài nguyên này |
| org_admin B | `GET /organizations/me` | 200 | PASS |  |
| org_admin B | `GET /departments` | 200 | PASS |  |
| org_admin B | `GET /departments/936e0304-6327-43b9-a677-c7c9d6a383ad` | 404 | PASS | Không tìm thấy phòng ban với ID 936e0304-6327-43b9-a677-c7c9d6a383ad |
| org_admin B | `PATCH /departments/936e0304-6327-43b9-a677-c7c9d6a383ad` | 404 | PASS | Không tìm thấy phòng ban với ID 936e0304-6327-43b9-a677-c7c9d6a383ad |
| org_admin B | `POST /departments` | 403 | PASS | Bạn không có quyền truy cập dữ liệu của tổ chức khác |
| org_admin B | `GET /recruiters` | 200 | PASS |  |
| org_admin B | `GET /ai-config` | 200 | PASS |  |
| org_admin B | `GET /ai-config/d263cd99-07f7-490e-82c3-f0b2483e8b82` | 404 | PASS | Không tìm thấy cấu hình AI với ID d263cd99-07f7-490e-82c3-f0b2483e8b82 |
| org_admin B | `PATCH /ai-config/d263cd99-07f7-490e-82c3-f0b2483e8b82/set-default` | 404 | PASS | Không tìm thấy cấu hình AI với ID d263cd99-07f7-490e-82c3-f0b2483e8b82 |
| org_admin B | `GET /job-postings` | 200 | PASS |  |
| org_admin B | `GET /job-postings/3033066e-adbf-481b-a1d9-4a513ff6735b` | 404 | PASS | Không tìm thấy tin tuyển dụng với ID 3033066e-adbf-481b-a1d9-4a513ff67 |
| org_admin B | `GET /applications/5a25f9db-1f89-4ff2-a6bc-f78912c4c3eb` | 403 | PASS | Bạn không có quyền truy cập dữ liệu của tổ chức khác |
| org_admin B | `GET /applications/board/all` | 200 | PASS |  |
| org_admin B | `GET /applications/board/3033066e-adbf-481b-a1d9-4a513ff6735b` | 403 | PASS | Bạn không có quyền truy cập dữ liệu của tổ chức khác |
| org_admin B | `GET /users` | 403 | PASS | Bạn không có quyền truy cập tài nguyên này |
| org_admin B | `GET /skills` | 200 | PASS |  |
| recruiter B | `GET /job-postings/3033066e-adbf-481b-a1d9-4a513ff6735b` | 404 | PASS | Không tìm thấy tin tuyển dụng với ID 3033066e-adbf-481b-a1d9-4a513ff67 |
| recruiter B | `GET /applications/5a25f9db-1f89-4ff2-a6bc-f78912c4c3eb` | 403 | PASS | Bạn không có quyền truy cập dữ liệu của tổ chức khác |
| recruiter B | `GET /recruiters` | 200 | PASS |  |
| recruiter B | `GET /applications/board/all` | 200 | PASS |  |
| recruiter B | `PATCH /users/me` | 400 | PASS | Dữ liệu không hợp lệ: role không được phép gửi lên |
| recruiter B | `PATCH /users/me` | 400 | PASS | Dữ liệu không hợp lệ: organizationId không được phép gửi lên |
| recruiter B | `PATCH /users/me` | 200 | PASS |  |
| recruiter B | `DB: users row after the PATCHes` | - | PASS | role=recruiter, organization_id=null |
| org_admin A | `GET /applications/5a25f9db-1f89-4ff2-a6bc-f78912c4c3eb` | 200 | PASS |  |
| org_admin A | `GET /job-postings/3033066e-adbf-481b-a1d9-4a513ff6735b` | 200 | PASS |  |
| org_admin A | `GET /departments` | 200 | PASS |  |
| org_admin A | `GET /departments/8b340567-4125-4d72-8d16-4cd9f956dbed` | 404 | PASS | Không tìm thấy phòng ban với ID 8b340567-4125-4d72-8d16-4cd9f956dbed |
| platform admin | `GET /departments` | 200 | PASS |  |
| platform admin | `GET /ai-config` | 200 | PASS |  |
| platform admin | `GET /recruiters` | 200 | PASS |  |
| platform admin | `GET /applications/board/all` | 200 | PASS |  |
| platform admin | `GET /job-postings` | 200 | PASS |  |
| platform admin | `GET /applications/5a25f9db-1f89-4ff2-a6bc-f78912c4c3eb` | 200 | PASS |  |
| platform admin | `GET /organizations` | 200 | PASS |  |
| anonymous | `GET /job-postings` | 200 | PASS |  |
| org_admin B | `socket join_job_room (org A job)` | - | PASS | refused |
| recruiter B | `socket join_job_room (org A job)` | - | PASS | refused |
| org_admin A | `socket join_job_room (org A job)` | - | PASS | joined |
| platform admin | `socket join_job_room (org A job)` | - | PASS | joined |

RESULT: 43 checks, all passed
