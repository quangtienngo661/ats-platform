# Task 1 — Kiểm chứng sớm

Ngày kiểm chứng: 2026-10-14. Worktree: `E:\wt\ats-sp2`; branch: `feat/gd2-sp2-bulk-screening`.

Các dòng dưới đây được lấy từ output thực tế của `grep` trong worktree. Cả chín lệnh `grep` đều có exit code 0. Số dòng ghi theo các file đang cài trong `node_modules`.

| # | check | file:line | quoted line(s) | PASS/FAIL |
|---|---|---|---|---|
| K1 | Có `common_1.Global`. | `node_modules/@nestjs/throttler/dist/throttler.module.js:61` | ``61:    (0, common_1.Global)(),`` | PASS |
| K2 | `getTracker(req)` trả `req.ip`; decorator nhận `getTracker?`. | `node_modules/@nestjs/throttler/dist/throttler.guard.js:141–143`<br>`node_modules/@nestjs/throttler/dist/throttler.decorator.d.ts:6` | ``141:    async getTracker(req) {``<br>``142-        return req.ip;``<br>``143-    }``<br>``6:    getTracker?: ThrottlerGetTrackerFunction;`` | PASS |
| K3 | Ba constants đúng chuỗi; decorator tạo metadata key bằng constant cộng `name`. | `node_modules/@nestjs/throttler/dist/throttler.constants.js:4–6`<br>`node_modules/@nestjs/throttler/dist/throttler.decorator.js:9,10,12` | ``4:exports.THROTTLER_LIMIT = 'THROTTLER:LIMIT';``<br>``5:exports.THROTTLER_TTL = 'THROTTLER:TTL';``<br>``6:exports.THROTTLER_TRACKER = 'THROTTLER:TRACKER';``<br>``9:        Reflect.defineMetadata(throttler_constants_1.THROTTLER_TTL + name, options[name].ttl, target);``<br>``10:        Reflect.defineMetadata(throttler_constants_1.THROTTLER_LIMIT + name, options[name].limit, target);``<br>``12:        Reflect.defineMetadata(throttler_constants_1.THROTTLER_TRACKER + name, options[name].getTracker, target);`` | PASS |
| K4 | `stripBOM` nằm trong nhánh `responseType !== 'arraybuffer'`. | `node_modules/axios/lib/adapters/http.js:1019–1024` | ``1019-              if (responseType !== 'arraybuffer') {``<br>``1020-                responseData = responseData.toString(responseEncoding);``<br>``1021-                if (!responseEncoding &#124;&#124; responseEncoding === 'utf8') {``<br>``1022:                  responseData = utils.stripBOM(responseData);``<br>``1023-                }``<br>``1024-              }`` | PASS |
| K5 | `router.refresh()` giữ unaffected client-side React state (`useState`). | `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md:46` | ``46:- `router.refresh()`: Refresh the current route. Making a new request to the server, re-fetching data requests, and re-rendering Server Components. The client will merge the updated React Server Component payload without losing unaffected client-side React (e.g. `useState`) or browser state (e.g. scroll position). This clears the [Client Cache](/docs/app/glossary#client-cache) for the current route, but does **not** invalidate the server-side cache. Use [`revalidatePath`](/docs/app/api-reference/functions/revalidatePath) or [`revalidateTag`](/docs/app/api-reference/functions/revalidateTag) to invalidate server-side cached data.`` | PASS |
| K6 | `bodySizeLimit` nói về request body; limit áp dụng cho raw HTTP request body. | `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md:27,29,31,39,45` | ``27:## `bodySizeLimit```<br>``29:By default, the maximum size of the request body sent to a Server Action is 1MB, to prevent the consumption of excessive server resources in parsing large amounts of data, as well as potential DDoS attacks.``<br>``31:However, you can configure this limit using the `serverActions.bodySizeLimit` option. It can take the number of bytes or any string format supported by bytes, for example `1000`, `'500kb'` or `'3mb'`.``<br>``39:      bodySizeLimit: '2mb',``<br>``45:The limit applies to the raw HTTP request body, including the bytes that `multipart/form-data` adds for boundaries, part headers, and field metadata. If you expect uploads close to the configured value, leave some room for this overhead. For typical multipart uploads, an additional 10–20 KB is a reasonable rule of thumb.`` | PASS |
| A2 | Không có response size limit nhỏ hơn 3 MB được ghi trong output của lệnh bắt buộc. | `node_modules/next/dist/docs/01-app/02-guides/server-actions.md:4,24,34,36,43,48,74,145,150`<br>`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md` (không có dòng khớp) | ``node_modules/next/dist/docs/01-app/02-guides/server-actions.md:4:description: How Server Actions work in Next.js, including the single-roundtrip response model, sequential dispatch, security, and caching integration.``<br>``node_modules/next/dist/docs/01-app/02-guides/server-actions.md:34:## A single response carries data and UI`` | PASS |

A2: Lệnh `grep -rn -i "response"` trả về chín dòng từ `server-actions.md`, mô tả response chứa data và UI/RSC Payload, revalidation, redirect và caching. Không có dòng khớp từ `serverActions.md`, cũng không có lỗi đường dẫn. Trong output này không có response size limit nhỏ hơn 3 MB, nên A2 PASS theo tiêu chí Task 1. K6 ghi limit 1MB cho request body; đây là request limit. Khả năng trả CSV thật vẫn thuộc bước đo của Task 11.

## Lệnh và output nguyên văn

### K1

```powershell
grep -n -F 'common_1.Global' node_modules/@nestjs/throttler/dist/throttler.module.js
```

Exit code: `0`.

```text
61:    (0, common_1.Global)(),
```

### K2a

```powershell
grep -n -A 2 -F 'getTracker(req)' node_modules/@nestjs/throttler/dist/throttler.guard.js
```

Exit code: `0`.

```text
141:    async getTracker(req) {
142-        return req.ip;
143-    }
```

### K2b

```powershell
grep -n -F 'getTracker?' node_modules/@nestjs/throttler/dist/throttler.decorator.d.ts
```

Exit code: `0`.

```text
6:    getTracker?: ThrottlerGetTrackerFunction;
```

### K3a

```powershell
grep -n -e 'THROTTLER:LIMIT' -e 'THROTTLER:TTL' -e 'THROTTLER:TRACKER' node_modules/@nestjs/throttler/dist/throttler.constants.js
```

Exit code: `0`.

```text
4:exports.THROTTLER_LIMIT = 'THROTTLER:LIMIT';
5:exports.THROTTLER_TTL = 'THROTTLER:TTL';
6:exports.THROTTLER_TRACKER = 'THROTTLER:TRACKER';
```

### K3b

```powershell
grep -n -E 'THROTTLER_(LIMIT|TTL|TRACKER).*name' node_modules/@nestjs/throttler/dist/throttler.decorator.js
```

Exit code: `0`.

```text
9:        Reflect.defineMetadata(throttler_constants_1.THROTTLER_TTL + name, options[name].ttl, target);
10:        Reflect.defineMetadata(throttler_constants_1.THROTTLER_LIMIT + name, options[name].limit, target);
12:        Reflect.defineMetadata(throttler_constants_1.THROTTLER_TRACKER + name, options[name].getTracker, target);
```

### K4

```powershell
grep -n -B 6 -A 2 -F 'stripBOM' node_modules/axios/lib/adapters/http.js
```

Exit code: `0`.

```text
582-        }
583-
584-        if (responseType === 'text') {
585-          convertedData = convertedData.toString(responseEncoding);
586-
587-          if (!responseEncoding || responseEncoding === 'utf8') {
588:            convertedData = utils.stripBOM(convertedData);
589-          }
590-        } else if (responseType === 'stream') {
--
1016-            try {
1017-              let responseData =
1018-                responseBuffer.length === 1 ? responseBuffer[0] : Buffer.concat(responseBuffer);
1019-              if (responseType !== 'arraybuffer') {
1020-                responseData = responseData.toString(responseEncoding);
1021-                if (!responseEncoding || responseEncoding === 'utf8') {
1022:                  responseData = utils.stripBOM(responseData);
1023-                }
1024-              }
```

### K5

```powershell
grep -n -F 'without losing unaffected client-side React' node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md
```

Exit code: `0`.

```text
46:- `router.refresh()`: Refresh the current route. Making a new request to the server, re-fetching data requests, and re-rendering Server Components. The client will merge the updated React Server Component payload without losing unaffected client-side React (e.g. `useState`) or browser state (e.g. scroll position). This clears the [Client Cache](/docs/app/glossary#client-cache) for the current route, but does **not** invalidate the server-side cache. Use [`revalidatePath`](/docs/app/api-reference/functions/revalidatePath) or [`revalidateTag`](/docs/app/api-reference/functions/revalidateTag) to invalidate server-side cached data.
```

### K6

```powershell
grep -n -e 'bodySizeLimit' -e 'request body' node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md
```

Exit code: `0`.

```text
27:## `bodySizeLimit`
29:By default, the maximum size of the request body sent to a Server Action is 1MB, to prevent the consumption of excessive server resources in parsing large amounts of data, as well as potential DDoS attacks.
31:However, you can configure this limit using the `serverActions.bodySizeLimit` option. It can take the number of bytes or any string format supported by bytes, for example `1000`, `'500kb'` or `'3mb'`.
39:      bodySizeLimit: '2mb',
45:The limit applies to the raw HTTP request body, including the bytes that `multipart/form-data` adds for boundaries, part headers, and field metadata. If you expect uploads close to the configured value, leave some room for this overhead. For typical multipart uploads, an additional 10–20 KB is a reasonable rule of thumb.
```

### A2

```powershell
grep -rn -i "response" node_modules/next/dist/docs/01-app/02-guides/server-actions.md node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md
```

Exit code: `0`.

```text
node_modules/next/dist/docs/01-app/02-guides/server-actions.md:4:description: How Server Actions work in Next.js, including the single-roundtrip response model, sequential dispatch, security, and caching integration.
node_modules/next/dist/docs/01-app/02-guides/server-actions.md:24:This page covers the parts of Server Actions that are specific to Next.js: how they commonly map to mutations, how the response carries both returned data and re-rendered UI, how the client dispatches them, the security boundary the framework enforces, and the configuration available.
node_modules/next/dist/docs/01-app/02-guides/server-actions.md:34:## A single response carries data and UI
node_modules/next/dist/docs/01-app/02-guides/server-actions.md:36:When a Server Action triggers an immediate revalidation, Next.js does the work inside one HTTP request: it runs the action, then re-renders the current route server-side. The response that comes back contains both pieces in the same Flight stream:
node_modules/next/dist/docs/01-app/02-guides/server-actions.md:43:A re-render is included in the same response when the action does any of these:
node_modules/next/dist/docs/01-app/02-guides/server-actions.md:48:- Calls [`redirect`](/docs/app/api-reference/functions/redirect). The response navigates the router and streams the destination's RSC Payload.
node_modules/next/dist/docs/01-app/02-guides/server-actions.md:74:[`revalidateTag`](/docs/app/api-reference/functions/revalidateTag) with a stale-while-revalidate profile is the exception: it marks the tag for background refresh and does **not** include a re-render in the action response. The page reflects the change on a later read. An action that does none of the above carries only its return value, and the current route is not re-rendered.
node_modules/next/dist/docs/01-app/02-guides/server-actions.md:145:- [`updateTag`](/docs/app/api-reference/functions/updateTag): immediate expiration of a tag. The next read (including the route re-render that ships with the action's response) waits for fresh data. Use when the action needs **read-your-own-writes** so the user immediately sees their change. Server Actions only.
node_modules/next/dist/docs/01-app/02-guides/server-actions.md:150:When `updateTag`, `revalidatePath`, or `refresh` runs, Next.js re-renders the current route server-side and includes a newly rendered [RSC Payload](/docs/app/glossary#rsc-payload) in the action's response, so the page reflects the change in the same roundtrip. `revalidateTag` with a stale-while-revalidate profile intentionally skips that immediate re-render.
```

Kết quả: K1–K6 và A2 đều PASS; đủ điều kiện commit kết quả Task 1.

## Trạng thái commit

Đã chạy lệnh stage đúng file:

```powershell
git add docs/tasks/gd2-sp2-bulk-screening/results/early-checks.md
```

Lệnh thất bại với exit code `1`; output nguyên văn:

```text
fatal: Unable to create 'E:/Learnings/Learning Stuffs/University/HK6/Do_an_1/Main/Project/alsp-ai-harness/projects/ats-platform/.git/worktrees/ats-sp2/index.lock': Permission denied
```

Chưa stage được file và chưa tạo commit. Git metadata nằm ngoài worktree; quyền ghi hiện tại không cho tạo `index.lock` tại đường dẫn trên.

**Giải quyết (2026-10-14):** người dùng chốt giao thức mới (qua phiên điều phối): Codex không commit; phiên `-impl` review rồi
commit. File này được phiên `-impl` commit với đúng message của plan. Xem `blocked-1.md`.

