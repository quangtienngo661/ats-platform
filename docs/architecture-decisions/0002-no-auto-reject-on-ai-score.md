# 0002. Không tự động loại ứng viên dựa trên điểm AI

## Trạng thái

Accepted

## Ngày

2026-07-14

## Bối cảnh (Context)

`AiConfig.minimumScoreThreshold` và `CVScreening.aiRecommendation` (khi ADR này được viết: `hire` / `interview` / `reject`; từ 2026-07-16 chỉ còn `interview` / `reject` — xem `docs/architecture/database.md` §4.7, quyết định *này* không đổi vì lý do refactor đó không liên quan tới auto-reject) tồn tại trong schema từ đầu, nhưng **không có code nào đọc chúng để thay đổi `Application.status`**. Audit ngày 2026-07-12 (`docs/audit/2026-07-12-cv-ai-pipeline.md`, mục "Business logic gaps" #3) ghi nhận điều này như một lỗ hổng: điểm được tính, nhãn được gán, rồi không ai làm gì với nó. `determineRecommendation()` chỉ sinh ra một chuỗi để recruiter tự nhìn.

Câu hỏi đặt ra khi lập kế hoạch Phase 0.5: có nên "hoàn thiện" luồng này bằng cách tự động chuyển `Application.status` sang `rejected` khi `overallScore < minimumScoreThreshold` không?

Trước khi quyết định, đã research thực tiễn ngành và khung pháp lý (`docs/research/2026-07-13-ats-ai-screening-interview.md`, mục Q1 và Q5).

## Quyết định (Decision)

**Không** tự động loại ứng viên dựa trên điểm AI. `minimumScoreThreshold` và `aiRecommendation` giữ nguyên vai trò **gợi ý cho con người**: chúng được tính, được lưu, được hiển thị cho recruiter, nhưng **không** tự sinh ra bất kỳ thay đổi trạng thái nào trên `Application`.

Mọi chuyển trạng thái của `Application` vẫn phải đến từ một hành động có chủ đích của con người, đi qua `ApplicationsService.updateStatus()` và được ghi lại trong `ApplicationHistory` với `changedBy` là một `User` có thật.

Đây là trạng thái hiện tại của code — nghĩa là **quyết định này không thay đổi dòng code nào**. Nó tồn tại để ghi lại rằng hiện trạng là *có chủ đích*, chứ không phải một tính năng còn dang dở.

## Lý do (Rationale)

1. **GDPR Điều 22** trao cho cá nhân quyền không bị lệ thuộc vào một quyết định "chỉ dựa trên xử lý tự động" có ảnh hưởng pháp lý hoặc tác động đáng kể tới họ. Bị loại khỏi một quy trình tuyển dụng là ví dụ kinh điển được nêu trong hướng dẫn của EU. Auto-reject theo ngưỡng điểm, không có người xem lại, rơi thẳng vào phạm vi cấm đó.

2. **Đây là rủi ro đang sống, không phải lý thuyết.** Research ghi nhận vụ *Mobley v. Workday* (lý thuyết quy trách nhiệm cho chính nhà cung cấp công cụ sàng lọc AI) và hướng dẫn của EEOC về việc nhà tuyển dụng vẫn chịu trách nhiệm cho công cụ của bên thứ ba. Xu hướng pháp lý đang siết chặt, không nới ra.

3. **Bỏ ngỏ auto-reject hiện đang là "an toàn nhờ tình cờ".** Hệ thống đang đúng luật *vì chưa ai viết đoạn code đó*, chứ không phải vì đã cân nhắc. Một lập trình viên tương lai (hoặc một AI agent) nhìn vào `minimumScoreThreshold` không được dùng rất dễ coi đó là bug và "sửa" nó. ADR này tồn tại để chặn đúng hành động đó.

4. **Về mặt sản phẩm, không mất gì.** Recruiter vẫn thấy điểm, thấy khuyến nghị, thấy kỹ năng khớp/thiếu, và vẫn có thể loại ứng viên bằng một cú click. Cái mất đi chỉ là việc *hệ thống tự quyết thay họ* — điều mà chính họ cũng không nên muốn.

## Lựa chọn khác đã cân nhắc (Alternatives considered)

- **Auto-reject cứng theo ngưỡng** (`overallScore < threshold` → `status = rejected`) — vi phạm GDPR Art. 22 như trên. Loại.

- **Auto-reject kèm "quyền khiếu nại"** (tự động loại, ứng viên có thể yêu cầu xem xét lại) — vẫn là quyết định tự động tại thời điểm ra quyết định; quyền khiếu nại *sau đó* không cứu được. Ngoài ra, ứng viên bị loại thường không bao giờ biết để mà khiếu nại. Loại.

- **Tự động chuyển sang một trạng thái trung gian** (ví dụ `screening_failed`) để recruiter xử lý hàng loạt — về bản chất vẫn là hệ thống ra quyết định phân loại, chỉ đổi tên. Và nó thêm một giá trị enum mà không giải quyết vấn đề pháp lý. Loại.

- **Auto-*advance* thay vì auto-reject** (điểm cao → tự đẩy sang `interview`) — không bị Điều 22 cấm (không gây bất lợi), nhưng vẫn làm recruiter mất quyền kiểm soát pipeline và sẽ tạo lịch phỏng vấn không ai duyệt. Chưa cần thiết ở giai đoạn này; có thể xem lại sau. Hoãn.

## Đánh đổi (Trade-offs)

**Được:**
- Đúng GDPR Art. 22 và các hướng dẫn EEOC hiện hành, không phải sửa lại khi hệ thống được đem đi bảo vệ hoặc dùng thật.
- Là một điểm cộng có thể nói được khi bảo vệ đồ án: "human-in-the-loop là lựa chọn thiết kế, đây là căn cứ".
- Không có nguy cơ một bug trong `calculateOverallScore()` âm thầm loại hàng loạt ứng viên hợp lệ.

**Mất:**
- Recruiter phải tự bấm loại từng ứng viên điểm thấp — với hàng trăm đơn thì đây là công việc lặp lại thật sự. (Giảm nhẹ bằng tính năng "loại hàng loạt" trong Phase 1, vẫn do người bấm.)
- `minimumScoreThreshold` trông giống một field chưa dùng tới với người đọc code lần đầu — chính là lý do ADR này phải tồn tại và phải được trỏ tới.

## Hệ quả (Consequences)

- **Không thay đổi code.** Hiện trạng đã đúng.
- `.claude/rules/apis/anti-patterns.md` cần một dòng nói rõ: `minimumScoreThreshold` / `aiRecommendation` **không phải** field chết, đừng "sửa" chúng thành auto-reject — trỏ về ADR này.
- `docs/audit/2026-07-12-cv-ai-pipeline.md` mục #3 vẫn mô tả đúng *hiện trạng kỹ thuật*, nhưng kết luận "gap" của nó bị ADR này phủ định: đây là thiết kế, không phải thiếu sót.
- Nếu sau này thực sự cần tự động hóa, hướng khả dĩ duy nhất là **auto-advance** (đẩy tới, không loại bỏ) — và cần một ADR mới thay thế ADR này.
