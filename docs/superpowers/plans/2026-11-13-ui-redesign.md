# Thiết kế lại giao diện TalentAI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay toàn bộ lớp trình bày của `apps/web` bằng hướng A · Mực & kính, có motion, giữ UI cũ làm fallback chuyển được lúc chạy.

**Architecture:**
- UI cũ được chép nguyên vào `src/legacy/` và đóng băng.
- Mỗi layout/page đọc cookie `talentai-ui` để chọn bản cũ hoặc bản mới.
- Bản mới thay tại chỗ trong `src/components/**`, dựa trên token CSS (Tailwind 3.4), primitives trong
  `src/components/ui/` và preset motion.
- Server actions, stores, lib và types dùng chung cho cả hai bản.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2.4, Tailwind CSS 3.4.3, `motion` 12.38 (`LazyMotion` + `m`), Radix (dialog có sẵn, thêm dropdown-menu, tooltip), Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-13-ui-redesign-design.md` (đọc kèm; các mục §x dưới đây trỏ vào spec).

Mọi lệnh chạy từ root repo `projects/ats-platform`. Đường dẫn file tương đối với `apps/web/` nếu bắt đầu bằng `src/`.

## Global Constraints

- Không đổi URL, `src/proxy.ts`, `src/servers/**`, `src/stores/**`, logic trong `src/lib/**` (chỉ thêm file mới), `libs/**`.
- `src/legacy/**` đóng băng sau Task 1: không sửa, trừ khi build hỏng vì thay đổi dùng chung.
- Không thêm dependency ngoài `@radix-ui/react-dropdown-menu` và `@radix-ui/react-tooltip`.
- Chỉ dùng field API đang trả. Chuỗi người dùng thấy bằng tiếng Việt, theo `~/.claude/rules/vietnamese-writing.md`:
  - nút là động từ + đối tượng, chỉ viết hoa chữ đầu
  - lỗi viết theo dạng "Không … được. …"
  - không dùng "Vui lòng" trên nút
- Màu chỉ qua token (spec §5.1).
  - Chữ xanh luôn là `text-accent-text`, không dùng `text-accent`.
  - Không còn class `[#hex]` hay `style={{ fontFamily }}` trong code mới (Task 31 có test chặn).
- Thang chữ, radius, shadow, z-index đúng spec §5.2–5.3. Không viết `z-[số]`, không dùng `h-screen`; dùng
  `min-h-dvh`/`h-dvh`.
- Motion đúng spec §6:
  - chỉ animate transform/opacity
  - nhấn co `.97`
  - stagger tối đa 8 phần tử
  - component mới dùng `m.*` từ `motion/react-m`
- Mỗi `page.tsx` có đúng một `<main id="main-content">` qua khung; không thêm `<main>` lồng.
- **Công thức restyle** (Task 12–30):
  1. Giữ nguyên props của component export (page và test dùng).
  2. Giữ mọi accessible name và chữ hiển thị mà test đang truy vấn, trừ khi task nói đổi. Nếu đổi thì sửa test trong
     cùng commit, có ghi lý do.
  3. Thay markup bằng primitives Task 5–7.
  4. Danh sách có `Skeleton` khi chờ và `EmptyState` khi rỗng.
  5. Không có khối tiêu đề + mô tả lớn ở đầu trang app; dùng `PageToolbar`.
- **Cổng sau mỗi task:**
  - `npm run typecheck:web` exit 0
  - `npm run lint:web` exit 0
  - `npm run test:web` toàn xanh
- Commit theo Conventional Commits, scope `web`, cuối message có dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
  Chỉ `git add` file của task. Không add `AGENTS.md` và `docs/tasks/gd2-parallel-execution/manual-testing/seed-output.txt`.

## Review Focus

1. **Chuỗi tiếng Việt dài:** tên việc, tên công ty, email hay tên tổ chức dài 80–120 ký tự phải xuống dòng hoặc rút gọn
   có `title`, không tràn ngang ở 390 px. Kiểm bằng dữ liệu xấu nhất ở Task 33.
2. **Dữ liệu rỗng:** 0 việc, 0 đơn, 0 ứng viên, 0 thông báo phải hiện `EmptyState` có bước tiếp theo, không để trống.
   Test thuộc Task 13, 16, 23, 28.
3. **Cookie `talentai-ui` sai giá trị hoặc thiếu, env sai:** phải rơi về `modern`. Test ở Task 2.
4. **Người dùng chỉ dùng bàn phím:**
   - rail sidebar, command palette, panel xem nhanh, menu chuyển vòng Kanban, dropdown: mở, điều hướng và đóng được
     bằng phím
   - focus quay về nút mở
   - Test ở Task 7, 8, 9, 23, 26.
5. **Reduced motion:** khi OS bật reduce motion, không còn animation transform. `global.css` phải có khối
   `@media (prefers-reduced-motion: reduce)` (test ở Task 3), `MotionConfig reducedMotion="user"` (test ở Task 4),
   giả lập ở Task 33.

---

## M0 · Nền móng

### Task 1: Đóng băng UI cũ vào `src/legacy/`

**Files:**
- Create: `src/legacy/components/**` (chép từ `src/components/**`, gồm test)
- Create: `src/legacy/app/**/page.tsx`, `src/legacy/app/(admin|candidate|interview-session|public|recruiter)/layout.tsx`, `src/legacy/app/**/page.test.ts(x)` (chép từ `src/app/**`)

**Interfaces:**
- Produces: mỗi file `src/legacy/app/<route>/page.tsx` giữ `export default` như bản gốc. Task 2 import
  `import LegacyPage from '@/legacy/app/<route>/page'`.
- Mỗi layout nhóm: `import LegacyXLayout from '@/legacy/app/(x)/layout'`.

- [ ] **Step 1: Ghi số test trước khi chép**

Run: `npm run test:web 2>&1 | tail -5`
Expected: ghi lại "Test Files N passed" và "Tests M passed" vào ghi chú task.

- [ ] **Step 2: Chép file**

```bash
cd apps/web/src
mkdir -p legacy && cp -r components legacy/components
find app -name 'page.tsx' -o -name 'page.test.ts' -o -name 'page.test.tsx' | while read f; do mkdir -p "legacy/$(dirname "$f")"; cp "$f" "legacy/$f"; done
for g in admin candidate interview-session public recruiter; do cp "app/($g)/layout.tsx" "legacy/app/($g)/layout.tsx"; done
```

- [ ] **Step 3: Đổi import trong bản chép**

```bash
cd apps/web/src/legacy && grep -rl "@/components/" . | xargs sed -i "s#@/components/#@/legacy/components/#g"
```
Kiểm: `grep -rn "from '@/components/" apps/web/src/legacy | wc -l` → `0`.

- [ ] **Step 4: Chạy cổng**

Run: `npm run typecheck:web && npm run lint:web && npm run test:web 2>&1 | tail -5`
Expected: exit 0. Số test file bằng N cộng số test file đã chép (`find apps/web/src/legacy -name '*.test.*' | wc -l`), toàn xanh.

- [ ] **Step 5: Commit** — `chore(web): freeze the current ui under src/legacy as the fallback`

### Task 2: Chọn giao diện lúc chạy

**Files:**
- Create: `src/lib/ui-variant.ts`, `src/lib/ui-variant.test.ts`
- Create: `src/servers/ui/ui-variant.action.ts`, `src/servers/ui/ui-variant.action.test.ts`
- Create: `src/components/ui-variant/LegacyFrame.tsx`, `src/components/ui-variant/UseModernPill.tsx`, `src/components/ui-variant/UiVariantMenuItem.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Modify: `src/app/layout.tsx`, 5 layout nhóm, 36 `src/app/**/page.tsx`
- Test: `src/app/(candidate)/my-applications/page.variant.test.tsx`

**Interfaces:**
- Produces:
  - `type UiVariant = 'legacy' | 'modern'`
  - `UI_VARIANT_COOKIE = 'talentai-ui'`
  - `resolveUiVariant(cookieValue: string | undefined, envDefault: string | undefined): UiVariant`
  - `getUiVariant(): Promise<UiVariant>` (server-only, đọc `cookies()` và `process.env.UI_DEFAULT_VARIANT`)
  - `setUiVariantAction(variant: UiVariant): Promise<void>` (`'use server'`)
  - `<LegacyFrame>{children}</LegacyFrame>` (server component, render children + `UseModernPill`)
  - `<UiVariantMenuItem />` (client; nhãn "Dùng giao diện cũ"; gọi action rồi `router.refresh()`). Task 8, 10 dùng.

- [ ] **Step 1: Đo bundle trước khi đổi**

Run: `npx nx build web --skip-nx-cache 2>&1 | grep -E "/my-applications|/dashboard|First Load"`
Expected: ghi lại First Load JS của `/my-applications` và `/dashboard`.

- [ ] **Step 2: Viết test đỏ cho resolver**

`src/lib/ui-variant.test.ts`, test `resolveUiVariant`:
- `('legacy', undefined)` → `'legacy'`
- `('modern', 'legacy')` → `'modern'`
- `(undefined, 'legacy')` → `'legacy'`
- `('LEGACY', undefined)` → `'modern'` (phân biệt hoa thường)
- `('x', 'y')` → `'modern'`
- `(undefined, undefined)` → `'modern'`
- `('', 'legacy')` → `'legacy'`

- [ ] **Step 3: Viết test đỏ cho action**

`ui-variant.action.test.ts` mock `next/headers` (`cookies().set`) và `next/cache` (`revalidatePath`).
`setUiVariantAction('legacy')` gọi:
```ts
set('talentai-ui', 'legacy', { path: '/', maxAge: 31536000, sameSite: 'lax', httpOnly: true })
revalidatePath('/', 'layout')
```
Giá trị khác `'legacy' | 'modern'` thì throw `Error('Invalid UI variant')` và không ghi cookie.

- [ ] **Step 4: Chạy để thấy đỏ** — `npm run test:web -- src/lib/ui-variant.test.ts src/servers/ui` → FAIL (module chưa có).

- [ ] **Step 5: Viết `ui-variant.ts` và `ui-variant.action.ts`** cho test xanh. `getUiVariant` có `import 'server-only'` nếu gói có sẵn; không có thì bỏ, không thêm gói.

- [ ] **Step 6: Viết test đỏ cho switch ở page**

`page.variant.test.tsx`:
- mock `@/lib/ui-variant`, `@/servers/applications/applications.action` (trả `[]`) và hai module page/component
- `getUiVariant` → `'legacy'`: render kết quả của `await MyApplicationsPage()`, thấy phần tử từ mock legacy
  (`data-testid` trong mock là chấp nhận được vì là mock)
- `'modern'`: thấy mock modern

- [ ] **Step 7: Nối switch**

- Mỗi page: `if ((await getUiVariant()) === 'legacy') return <LegacyPage {...props} />;` ở đầu hàm, giữ phần còn lại.
  Page nhận `params`/`searchParams` thì truyền nguyên `props`.
- Mỗi layout nhóm: nhánh legacy trả `<LegacyFrame><LegacyXLayout>{children}</LegacyXLayout></LegacyFrame>`.
- `(auth)/layout.tsx` mới: legacy → `<LegacyFrame>{children}</LegacyFrame>`, modern → `children`.
- Root layout:
  - `const variant = await getUiVariant()`
  - `<html lang="vi" data-ui={variant} data-scroll-behavior="smooth">`
  - `<body className={variant === 'legacy' ? inter.className : undefined}>` (Task 3 thêm class font mới)
- `UseModernPill`: nút cố định góc dưới trái, chữ "Dùng giao diện mới", `z-index: 70` viết bằng CSS thường (token
  chưa có), gọi `setUiVariantAction('modern')` rồi `router.refresh()`.

- [ ] **Step 8: Chạy test** — `npm run test:web` → toàn xanh; `npm run typecheck:web && npm run lint:web` → exit 0.

- [ ] **Step 9: Đo bundle sau**

Chạy lại lệnh Step 1. Nếu First Load JS của `/my-applications` hoặc `/dashboard` tăng hơn 10%, đổi import legacy trong
page thành `next/dynamic(() => import('@/legacy/app/...'))`, đo lại. Ghi hai số trước/sau vào commit body.

- [ ] **Step 10: Commit** — `feat(web): switch between the legacy and the new ui at runtime`

### Task 3: Token, font và Tailwind theme

**Files:**
- Modify: `src/app/global.css`, `tailwind.config.js`, `src/app/layout.tsx`
- Create: `src/lib/contrast.ts`, `src/lib/contrast.test.ts`, `src/app/design-tokens.test.ts`

**Interfaces:**
- Produces:
  - class Tailwind theo spec §5:
    - màu: `canvas`, `surface`, `surface-2`, `line`, `line-strong`, `ink`, `ink-2`…`ink-4`, `accent`, `accent-text`,
      `accent-soft`, `success(-soft)`, `warning(-soft)`, `danger(-soft|-solid)`, `night`, `night-2`, `night-3`,
      `night-line`, `night-ink(-2|-3)`
    - chữ: `text-micro|caption|body-sm|body|title-sm|title|heading|display-sm|display`
    - radius: `rounded-ctl|card|panel`
    - bóng: `shadow-e1…e5`
    - z-index: `z-sticky|header|drawer|overlay|modal|popover|toast|palette`
    - motion: `duration-press|hover|base|slow`, `ease-out-expo` = `cubic-bezier(.16,1,.3,1)`, `ease-in-quart` = `cubic-bezier(.5,0,.75,0)`
    - font: `font-sans` (Geist), `font-mono` (Geist Mono)
  - `contrastRatio(fgHex: string, bgHex: string): number`
- Mọi key là `theme.extend`, không ghi đè key mặc định.

- [ ] **Step 1: Viết test đỏ**

- `contrast.test.ts`: `contrastRatio('#171717','#ffffff')` ≈ 17.93 (`toBeCloseTo(17.93, 2)`); `('#888888','#ffffff')` ≈
  3.54; `('#ffffff','#ffffff')` = 1; đảo thứ tự cho cùng kết quả.
- `design-tokens.test.ts` đọc `src/app/global.css` bằng `fs`, parse các `--tên: r g b` trong khối `:root`.
  - Assert ≥ 4.5 cho chữ:
    - `ink`, `ink-2`, `ink-3` trên `canvas`, `surface`, `surface-2`
    - `accent-text` trên `canvas`, `surface`, `surface-2`, `accent-soft`
    - `surface` trên `accent`, `ink`, `danger-solid`
    - `success`/`success-soft`, `warning`/`warning-soft`, `danger`/`danger-soft`
    - `night-ink` trên `night`, `night-2`, `night-3`; `night-ink-2` trên `night-2`; `night-ink-3` trên `night-3`
  - Assert ≥ 3 cho thành phần: `line-strong` trên `surface`, `accent` trên `surface`.
  - Assert thêm `global.css` chứa khối `@media (prefers-reduced-motion: reduce)` đặt `animation-duration` và
    `transition-duration` về `0.01ms` cho `html[data-ui="modern"] *`.

- [ ] **Step 2: Chạy** — `npm run test:web -- src/lib/contrast.test.ts src/app/design-tokens.test.ts` → FAIL.

- [ ] **Step 3: Viết token và theme**

- `global.css` thêm khối `:root` với đúng giá trị hex của spec §5.1, viết dạng kênh (`--ink: 23 23 23;`).
- Thêm các rule phần tử mới **chỉ** dưới `html[data-ui="modern"]`:
  - `body { background: rgb(var(--canvas)); color: rgb(var(--ink)); font-family: var(--font-sans), system-ui, sans-serif; -webkit-font-smoothing: antialiased; }`
  - `::selection` dùng `accent-soft`
  - `:focus-visible` outline 2px `accent`, offset 2px
  - `h1,h2,h3 { text-wrap: balance }`, `p { text-wrap: pretty }`
  - khối reduced motion
- Tailwind: màu dạng `'rgb(var(--ink) / <alpha-value>)'`.
- Root layout:
  - `Geist({ subsets: ['latin','vietnamese'], variable: '--font-sans' })`
  - `Geist_Mono({ subsets: ['latin','vietnamese'], variable: '--font-mono' })`
  - gắn hai `.variable` lên `<html>`
  - `viewport.themeColor` đổi thành `#fafafa`
- Viết `contrast.ts` theo công thức WCAG relative luminance.

- [ ] **Step 4: Kiểm `<alpha-value>`**

```bash
printf '<div class="bg-ink/50 text-accent-text shadow-e3 z-modal rounded-card text-body-sm"></div>' > /tmp/tw-probe.html
npx tailwindcss -c apps/web/tailwind.config.js -i apps/web/src/app/global.css --content /tmp/tw-probe.html 2>/dev/null | grep -E "bg-ink\\\\/50|text-accent-text|z-modal" -A2
```
Expected: có `background-color: rgb(23 23 23 / 0.5)` và `color: rgb(var(--accent-text) / var(--tw-text-opacity))`
hoặc tương đương. Nếu không ra, đổi cách khai báo màu trước khi đi tiếp.

- [ ] **Step 5: Chạy cổng** → xanh.

- [ ] **Step 6: Commit** — `feat(web): add the design tokens, geist fonts and tailwind theme`

### Task 4: Motion và hai gói Radix

**Files:**
- Modify: `src/components/common/MotionProvider.tsx`, `package.json`, `package-lock.json`
- Create: `src/lib/motion.ts`, `src/lib/motion.test.ts`, `src/components/ui/motion/Reveal.tsx`, `src/components/ui/motion/Stagger.tsx`, `src/components/ui/motion/Stagger.test.tsx`, `src/components/common/MotionProvider.test.tsx`

**Interfaces:**
- Produces:
  - `duration = { press: 0.12, hover: 0.2, base: 0.28, slow: 0.42 }`
  - `ease = { out: [0.16, 1, 0.3, 1], in: [0.5, 0, 0.75, 0] } as const`
  - `spring = { snappy: { type: 'spring', stiffness: 500, damping: 40 } }`
  - `exitDuration(enter: number): number` (= enter × 0.7)
  - `staggerDelay(index: number, step = 0.04, cap = 8): number | null` (`null` khi `index >= cap`)
  - `fadeRise`: variants `{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }`
  - `<Reveal delay?: number as?: 'div'|'section'|'li'>`
  - `<Stagger as?: 'div'|'ul'|'ol'>`: con thứ `i` dùng `staggerDelay(i)`; con `i >= 8` render tĩnh, không animate

- [ ] **Step 1: Viết test đỏ**

- `motion.test.ts`:
  - `staggerDelay(0)` = 0, `staggerDelay(3)` = 0.12, `staggerDelay(7)` ≈ 0.28, `staggerDelay(8)` = null,
    `staggerDelay(-1)` = null
  - `exitDuration(0.28)` ≈ 0.196
- `Stagger.test.tsx`: render 10 `<li>` trong `<Stagger as="ul">`, cả 10 nằm trong document và theo đúng thứ tự.
- `MotionProvider.test.tsx`: mock `motion/react`, ghi lại props `MotionConfig`; assert `reducedMotion === 'user'`.

- [ ] **Step 2: Chạy** → FAIL.

- [ ] **Step 3: Viết code**

- `MotionProvider`: `<LazyMotion features={domAnimation}><MotionConfig reducedMotion="user">{children}</MotionConfig></LazyMotion>`, không `strict`.
- `Reveal`/`Stagger` dùng `m` từ `motion/react-m`.

- [ ] **Step 4: Cài gói**

`npm install @radix-ui/react-dropdown-menu @radix-ui/react-tooltip --save`, ghi version vào commit body.

- [ ] **Step 5: Cổng** → xanh. **Step 6: Commit** — `feat(web): add the motion presets and the radix menu and tooltip`

### Task 5: Primitives — thao tác và form

**Files:** Create trong `src/components/ui/`: `Button.tsx`, `ButtonLink.tsx`, `IconButton.tsx`, `Field.tsx`, `Input.tsx`, `Textarea.tsx`, `Select.tsx`, `Checkbox.tsx`, `Switch.tsx`, `Kbd.tsx`, `index.ts`, `forms.test.tsx`, `Button.test.tsx`

**Interfaces:**
- Produces:
  - `Button(props: ButtonHTMLAttributes & { variant?: 'primary'|'secondary'|'ghost'|'danger'|'accent'; size?: 'sm'|'md'|'lg'; loading?: boolean })`
  - `ButtonLink(props: LinkProps & { variant?; size?; className?; children })`
  - `IconButton(props: ButtonHTMLAttributes & { 'aria-label': string; size?: 'sm'|'md' })`
  - `Field({ label, hint?, error?, required?, children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode })`
  - `Input`, `Textarea`, `Select`, `Checkbox`: forwardRef, nhận `invalid?: boolean`
  - `Switch({ checked, onCheckedChange, label })`
  - `Kbd({ children })`
  - `index.ts` re-export mọi primitive của Task 5–7
- Kích thước: sm `h-8` · md `h-9` · lg `h-11`.
- primary `bg-ink text-surface`; secondary `bg-surface shadow-e2`; accent `bg-accent text-surface`; danger `bg-danger-solid text-surface`.
- Mọi biến thể: `active:scale-[.97] transition duration-press`.

- [ ] **Step 1: Viết test đỏ**

- `Button.test.tsx`:
  - `loading` → `getByRole('button')` có `aria-busy="true"` và `disabled`
  - click khi `loading` không gọi `onClick`
  - mặc định `type="button"`
- `forms.test.tsx`:
  - `Field` có `error="Email không đúng định dạng."` → `getByLabelText('Email')` có `aria-invalid="true"`, và
    `aria-describedby` trỏ tới phần tử chứa đúng chuỗi lỗi
  - `hint` cũng được nối vào `aria-describedby`
  - `Switch` → `getByRole('switch', { name: 'Thông báo email' })`; bấm thì `onCheckedChange(true)`; có `aria-checked`

- [ ] **Step 2: FAIL** → **Step 3: viết primitives** → **Step 4: cổng xanh** → **Step 5: Commit** `feat(web): add the action and form primitives`

### Task 6: Primitives — hiển thị dữ liệu

**Files:**
- Create trong `src/components/ui/`: `Badge.tsx`, `StatusChip.tsx`, `Surface.tsx`, `Avatar.tsx`, `Skeleton.tsx`, `EmptyState.tsx`, `Stat.tsx`, `ScoreBar.tsx`, `Table.tsx`, `PageToolbar.tsx`, `Breadcrumbs.tsx`, `display.test.tsx`
- Create: `src/lib/status-tones.ts`, `src/lib/status-tones.test.ts`, `src/lib/avatar-tone.ts`, `src/lib/avatar-tone.test.ts`

**Interfaces:**
- Produces:
  - `type Tone = 'neutral'|'accent'|'success'|'warning'|'danger'`
  - `statusTone(kind: 'application'|'job'|'screening'|'parsing'|'schedule'|'interview', value: string): { tone: Tone; label: string }`
  - `avatarTone(name: string): { bg: string; fg: string }`: lấy từ một bảng 6 cặp class token cố định, tính bằng hash
    chuỗi
  - `StatusChip({ kind, value })`
  - `Badge({ tone, children })`
  - `Surface({ variant?: 'plain'|'raised'|'inset', as? })`
  - `Avatar({ name, size?: 24|28|32|40 })`
  - `Skeleton({ className })`
  - `EmptyState({ icon?, title, description?, action?: ReactNode })`
  - `Stat({ label, value: number, suffix?, delta?: string })`: đếm lên một lần
  - `ScoreBar({ score: number | null, label?: string })`: nhãn mặc định "Gợi ý AI"
  - `Table`, `THead`, `TH`, `TR`, `TD` (`numeric` → `tabular-nums text-right`)
  - `PageToolbar({ title, children? /* lọc + thao tác */ })`
  - `Breadcrumbs({ items: { label: string; href?: string }[] })`

Nhãn trạng thái (không phải thiết kế, đã có trong code cũ; giữ):

| kind | giá trị → nhãn · tone |
|---|---|
| `application` | applied→Mới·accent, screening→Sàng lọc·warning, interview→Phỏng vấn·accent, offer→Offer·success, hired→Đã tuyển·success, rejected→Từ chối·danger, cancelled→Đã hủy·neutral |
| `job` | draft→Nháp·neutral, active→Đang tuyển·success, closed→Đã đóng·warning |
| `screening` | pending→Chờ sàng lọc·neutral, processing→Đang sàng lọc·warning, completed→Đã sàng lọc·success, failed→Sàng lọc lỗi·danger |
| `parsing` | pending→Chờ phân tích·neutral, processing→Đang phân tích·warning, completed→Đã phân tích·success, failed→Phân tích lỗi·danger |
| `schedule` | scheduled→Đã lên lịch·accent, completed→Đã xong·success, cancelled→Đã hủy·neutral |
| `interview` | generating→Đang tạo câu hỏi·warning, in_progress→Đang làm·accent, pending_result→Đang chấm·warning, completed→Hoàn thành·success, abandon→Bỏ dở·neutral |

Giá trị lạ → `{ tone: 'neutral', label: value }`.

- [ ] **Step 1: Viết test đỏ**

- `status-tones.test.ts`:
  - lặp qua `Object.values(ApplicationStatus|JobStatus|ScreeningStatus|ParsingStatus|ScheduleStatus|InterviewStatus)`
    từ `@ats-platform/types`: mọi giá trị có nhãn khác chính giá trị đó
  - assert đúng từng dòng bảng trên
  - `statusTone('job','weird')` → `{ tone: 'neutral', label: 'weird' }`
- `avatar-tone.test.ts`:
  - cùng tên → cùng kết quả
  - `'Trần Minh Khoa'` và `'trần minh khoa'` cho cùng kết quả (chuẩn hóa chữ thường)
  - chuỗi rỗng không throw
  - 50 tên khác nhau dùng ít nhất 4 cặp màu khác nhau
- `display.test.tsx`:
  - `ScoreBar score={86}` → `getByRole('meter', { name: 'Gợi ý AI' })` có `aria-valuenow="86"`; `score={null}` hiện
    "Chưa có điểm"
  - `EmptyState title="Chưa có đơn ứng tuyển" action={<a href="/job-postings">Tìm việc</a>}` → heading và link đúng
  - `StatusChip kind="application" value="hired"` → chữ "Đã tuyển"
  - `Avatar name="Lê Ngọc Hân"` → chữ "NH", có `aria-hidden` trên chữ viết tắt và `title` là tên

- [ ] **Step 2: FAIL** → **Step 3: viết** → **Step 4: cổng xanh** → **Step 5: Commit** `feat(web): add the data display primitives and status tones`

### Task 7: Primitives — overlay và điều hướng

**Files:** Create trong `src/components/ui/`: `Dialog.tsx`, `Sheet.tsx`, `DropdownMenu.tsx`, `Tooltip.tsx`, `Segmented.tsx`, `Tabs.tsx`, `overlays.test.tsx`

**Interfaces:**
- Produces:
  - `Dialog({ open, onOpenChange, title, description?, size?: 'sm'|'md'|'lg', children, footer? })`: dựa trên Radix
    Dialog; motion `scale .97→1` + opacity, `duration.base`
  - `Sheet({ open, onOpenChange, title, side?: 'right', width?: 'md'|'lg', children })`: trượt từ phải, có nút đóng
    "Đóng"
  - `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSub`,
    `DropdownMenuSubTrigger`, `DropdownMenuSubContent`, `DropdownMenuSeparator`: bọc Radix, style token, scale theo
    `--radix-dropdown-menu-content-transform-origin`
  - `Tooltip({ content, children, side? })`, `TooltipProvider` (delay 300 ms)
  - `Segmented({ options: { value, label }[], value, onValueChange, label })`: indicator `layoutId`
  - `Tabs({ tabs: { value, label, content }[], value?, onValueChange? })`: ARIA tablist, ←/→/Home/End

- [ ] **Step 1: Viết test đỏ** (`overlays.test.tsx`, dùng `userEvent`)

- `Sheet`: nút "Mở" → `getByRole('dialog', { name: 'Hồ sơ ứng viên' })`; Esc → dialog biến mất, focus về nút "Mở".
- `DropdownMenu`: focus trigger "Thao tác", Enter → thấy `menuitem` "Sửa" và "Xóa"; ↓ chuyển focus; Esc đóng.
- `Tabs`: 3 tab; ở tab 1 nhấn → thì tab 2 `aria-selected="true"` và panel 2 hiện; End → tab 3.
- `Segmented`: `getByRole('radiogroup', { name })`; bấm "Kanban" gọi `onValueChange('kanban')`.

- [ ] **Step 2–5:** FAIL → viết → cổng xanh → Commit `feat(web): add the dialog, sheet, menu, tooltip and tab primitives`

### Task 8: Khung staff/admin

**Files:**
- Create: `src/components/shell/StaffShell.tsx`, `StaffSidebar.tsx`, `StaffTopBar.tsx`, `AccountMenu.tsx`, `staff-nav.ts`, `StaffShell.test.tsx`, `staff-nav.test.ts`
- Modify: nhánh modern của `src/app/(recruiter)/layout.tsx`, `src/app/(admin)/layout.tsx`. Hai layout đọc thêm cookie `talentai-sidebar` và truyền `initialCollapsed`.
- `src/components/dashboard/DashboardLayout.tsx` không còn ai import ở bản mới. Xóa ở Task 31 sau khi kiểm không còn tham chiếu.

**Interfaces:**
- Consumes: `mayVisit(role, path)`, `logoutAction(redirectTo)`, `NotificationDropdown` (props hiện có), `UiVariantMenuItem` (Task 2), primitives.
- Produces:
  - `staffNav(role?: string): { recruiting: NavItem[]; admin: NavItem[] }`
  - `type NavItem = { href: string; label: string; icon: LucideIcon }`
  - nhãn và href giữ như `DashboardLayout` hiện tại; "AI Usage Logs" đổi thành "Nhật ký AI"
  - `StaffShell` props như `DashboardLayout` + `initialCollapsed: boolean`
  - `AccountMenu({ name, email?, subtitle?, profileHref, logoutRedirect })`: dùng chung với Task 10
  - cookie `talentai-sidebar` = `rail` | `full`, ghi bằng `document.cookie` (path `/`, 1 năm)

- [ ] **Step 1: Viết test đỏ**

- `staff-nav.test.ts`:
  - `staffNav('recruiter').admin` rỗng
  - `staffNav('org_admin').admin` chỉ có `/department-management`, `/recruiter-management`, `/ai-configuration`
  - `staffNav('admin').admin` có 8 mục đúng thứ tự hiện tại
- `StaffShell.test.tsx` (mock `next/navigation` `usePathname` = `/jobs/abc/kanban`):
  - link "Tin tuyển dụng" có `aria-current="page"`
  - nút `getByRole('button', { name: 'Thu gọn thanh bên' })` có `aria-expanded="true"`; bấm thì đổi thành
    `aria-expanded="false"` và tên "Mở rộng thanh bên"
  - link "Bảng điều khiển" vẫn có accessible name khi đã thu gọn
  - `<main id="main-content">` có đúng một
- Test hiện có của `NotificationDropdown` (nếu có) vẫn xanh.

- [ ] **Step 2: FAIL** → **Step 3: viết**

- Sidebar 248 px, rail 64 px. Chuyển chiều rộng bằng `transform` của nội dung và `grid-template-columns` (không
  animate `width`).
- Tooltip chỉ bật khi rail.
- Dưới 1024 px dùng `Sheet` bên trái với `title="Điều hướng"`.
- Breadcrumbs từ pathname:
  - map segment tĩnh sang nhãn nav
  - segment động (`[jobId]`, `[id]`) hiện "Chi tiết"
  - `candidates` → "Ứng viên", `kanban` → "Kanban", `compare` → "So sánh"

- [ ] **Step 4: cổng xanh** → **Step 5: Commit** `feat(web): add the staff shell with a collapsible rail`

### Task 9: Command palette

**Files:** Create `src/components/shell/CommandPalette.tsx`, `src/components/shell/commands.ts`, `src/components/shell/commands.test.ts`, `src/components/shell/CommandPalette.test.tsx`; Modify `StaffTopBar.tsx` (nút mở + phím tắt).

**Interfaces:**
- Consumes: `staffNav(role)`, `setUiVariantAction`.
- Produces:
  - `type Command = { id: string; group: 'Đi tới' | 'Giao diện'; label: string; keywords?: string[]; href?: string; run?: () => void }`
  - `buildCommands(role?: string): Command[]`
  - `normalizeVi(s: string): string`: NFD, bỏ dấu, `đ→d`, chữ thường, gộp khoảng trắng
  - `filterCommands(query: string, commands: Command[]): Command[]`: mọi từ của query phải là tiền tố của một từ
    trong label/keywords; query rỗng → trả nguyên danh sách

- [ ] **Step 1: Viết test đỏ**

- `normalizeVi('Đơn ỨNG tuyển')` → `'don ung tuyen'`.
- `filterCommands('ung vien', …)` khớp "Ứng viên"; `'tin tuyen'` khớp "Tin tuyển dụng"; `'xyz'` → `[]`.
- `buildCommands('recruiter')` không có "Quản lý người dùng"; `buildCommands('admin')` có; cả hai có "Dùng giao diện cũ".
- `CommandPalette.test.tsx`:
  - nhấn `Control+k` → `getByRole('dialog', { name: 'Tìm hoặc đi tới' })`, combobox có focus
  - gõ "lich" → option "Lịch phỏng vấn"; Enter → `router.push('/interviews')`
  - Esc đóng
  - ↓ ↑ đổi `aria-activedescendant`

- [ ] **Step 2–5:** FAIL → viết → cổng xanh → Commit `feat(web): add the command palette for staff navigation`

### Task 10: Khung public và ứng viên

**Files:**
- Create: `src/components/shell/SiteHeader.tsx`, `CandidateTabBar.tsx`, `SiteFooter.tsx`, `BrandMark.tsx`, `SiteHeader.test.tsx`
- Modify: nhánh modern của `src/app/(public)/layout.tsx`, `src/app/(candidate)/layout.tsx`
- `PublicHeader`/`PublicFooter` cũ không còn được bản mới import. Xóa ở Task 31. `PublicHeader.test.tsx` chuyển thành `SiteHeader.test.tsx` với cùng các khẳng định hành vi.

**Interfaces:**
- Consumes: `AccountMenu` (Task 8), `NotificationDropdown`, `useSocketStore().disconnect`, `logoutAction()`.
- Produces:
  - `SiteHeader({ userInfo, initialNotifications?, initialUnreadCount? })`: cùng props với `PublicHeader`
  - `BrandMark()`: khối mực 22 px + chữ "TalentAI", link `/`; dùng lại ở khung staff và auth
  - `CandidateTabBar()`: 5 tab, chỉ hiện dưới 768 px khi `role === 'candidate'`
  - `SiteFooter()`: link pháp lý hiện có

- [ ] **Step 1: Viết test đỏ**

- Khách: thấy link "Tìm việc", "Đăng nhập", "Đăng ký"; không có "Đơn của tôi".
- Ứng viên: thấy nav "Tìm việc", "Đơn của tôi", "Lịch phỏng vấn", "CV của tôi", "Phỏng vấn thử"; mục đang ở có
  `aria-current="page"`.
- Mở menu tài khoản thấy `menuitem` "Hồ sơ", "Dùng giao diện cũ", "Đăng xuất". "Đăng xuất" gọi
  `socket.disconnect` và `logoutAction`.
- Chép mọi khẳng định hành vi còn đúng của `PublicHeader.test.tsx` cũ sang file mới.

- [ ] **Step 2–5:** FAIL → viết

- Header cao 60 px, `sticky top-0 z-header bg-canvas/75 backdrop-blur-xl backdrop-saturate-150 border-b border-line`.
- Nội dung `max-w-[1200px]`. Layout dùng `pt-0` vì header dính.

→ cổng xanh → Commit `feat(web): add the public and candidate shell`

### Task 11: Khung auth, phỏng vấn và màn trạng thái

**Files:**
- Modify: `src/components/auth/ui/AuthShell.tsx`, `StaffAuthShell.tsx`, `src/app/(interview-session)/layout.tsx` (nhánh modern), `src/components/common/RouteLoading.tsx`, `RouteError.tsx`, `src/app/global-error.tsx`
- Create: `src/app/not-found.tsx`, `src/components/shell/InterviewShell.tsx`, `src/components/common/RouteStates.test.tsx`

**Interfaces:**
- Produces:
  - `AuthShell` / `StaffAuthShell` giữ props hiện có
  - `InterviewShell({ children })`: nền `night`, `min-h-dvh`
  - `RouteLoading`: giữ `role="status"` và chữ "Đang tải…" (sr-only), thêm skeleton 3 khối
  - `RouteError`: giữ hành vi refresh + reset

- [ ] **Step 1: Viết test đỏ** (`RouteStates.test.tsx`)

- `NotFound` có heading "Không tìm thấy trang", link "Về trang chủ" (`/`) và "Tìm việc" (`/job-postings`).
- `RouteLoading` có `getByRole('status')` với tên "Đang tải…".
- `RouteError`: bấm "Thử lại" gọi `reset` và `router.refresh`; chữ "Không tải được dữ liệu." (đổi từ "Không thể tải
  dữ liệu" theo quy tắc văn phong).

- [ ] **Step 2–5:** FAIL → viết

- Panel auth bên phải: `bg-night`, grain bằng SVG `feTurbulence` inline làm data URI ở opacity .06, một
  `radial-gradient` trắng 6% ở góc trên. Chỉ hiện ≥ 1024 px.
- Nội dung panel ứng viên: "Tìm việc hợp với kỹ năng của bạn", "Theo dõi đơn ứng tuyển ở một nơi", "Luyện phỏng vấn
  với AI trước vòng thật".
- Nội dung panel staff: "Sàng lọc CV có giải thích", "Quản lý pipeline từng tin tuyển dụng", "Quyết định cuối cùng
  luôn thuộc về bạn".

→ cổng xanh → Commit `feat(web): restyle the auth, interview and route state screens`

## M1 · Public và auth

### Task 12: Trang chủ

**Files:** Modify `src/components/public/home/HomeHero.tsx`, `HomeAIHighlight.tsx`, `HomeStats.tsx`, `HomeCategories.tsx`, `HomeFeaturedJobs.tsx`; `src/app/(public)/page.tsx` (bỏ `PublicFooter`, dùng `SiteFooter` qua layout). Test giữ: `HomeHero.test.tsx`.

- [ ] **Step 1:** Restyle theo công thức.
  - Hero: `text-display` (mobile `text-[34px]/[40px]`), ô tìm kiếm là `Surface raised` cao 56 px có nút "Tìm việc".
    Giữ ô địa điểm ở trạng thái disabled như hiện tại.
  - Danh mục: cuộn ngang có snap.
  - Khối AI: 2 cột không đối xứng (chữ 5/12, minh họa điểm `ScoreBar` mẫu ghi rõ "Ví dụ" 7/12).
  - `Reveal` cho từng section ở `duration.slow`.
- [ ] **Step 2:** cổng xanh (gồm `HomeHero.test.tsx`).
- [ ] **Step 3:** Commit `feat(web): redesign the home page`

### Task 13: Tìm việc

**Files:** Modify `src/components/public/jobs/JobSearchClient.tsx`, `JobCard.tsx`, `src/app/(public)/job-postings/page.tsx` (chỉ markup). Test giữ: `JobSearchClient.test.tsx`, `JobCard.test.tsx`, `src/app/(public)/job-postings/page.test.ts`. Test thêm vào `JobSearchClient.test.tsx`.

- [ ] **Step 1: Viết test đỏ**
  - Danh sách rỗng → heading "Không có việc phù hợp" và nút "Xóa bộ lọc".
  - Đang lọc "Từ xa" → có chip "Từ xa" với nút `getByRole('button', { name: 'Bỏ lọc Từ xa' })`.
- [ ] **Step 2:** FAIL → restyle

- Ô tìm trên cùng, chip bộ lọc ngang, chip đang lọc.
- Lưới `grid-cols-[minmax(0,7fr)_minmax(0,3fr)]` từ 1024 px. Cột phải: tóm tắt bộ lọc + gợi ý tạo CV.
- Cả `JobCard` là một link (giữ cách test hiện tại truy vấn). Hover nhấc 2 px.
- `Stagger` cho danh sách.

→ cổng xanh → Commit `feat(web): redesign the job search`

### Task 14: Chi tiết việc

**Files:** Modify `src/components/public/jobs/detail/JobDetailHero.tsx`, `JobDetailBody.tsx`, `JobDetailSidebar.tsx`, `JobParsedRequirements.tsx`, `ApplyButton.tsx`; `src/app/(public)/job-postings/[id]/page.tsx` (markup). Test giữ: `JobDetailHero.test.tsx`, `JobDetailSidebar.test.tsx`.

- [ ] **Step 1:** Restyle.
  - Lưới 2/3 + 1/3; thẻ ứng tuyển `sticky top-[76px]`.
  - Yêu cầu đã parse thành `Badge`.
  - Luồng chọn CV của `ApplyButton` chuyển vào `Sheet` (`title="Ứng tuyển"`), giữ action và các trạng thái hiện có.
  - Mobile: thanh ứng tuyển dính đáy, có safe-area.
- [ ] **Step 2:** cổng xanh → **Step 3:** Commit `feat(web): redesign the job detail page`

### Task 15: Form xác thực

**Files:** Modify `src/components/auth/forms/LoginForm.tsx`, `RegisterForm.tsx`, `ForgotPasswordForm.tsx`, `ResetPasswordForm.tsx`, `StaffLoginForm.tsx`, `VerifyEmailView.tsx`, `src/components/auth/VerificationSuccessView.tsx`, `src/components/auth/ui/OAuthButtons.tsx`, `src/app/(auth)/auth-callback/page.tsx` (markup). Test giữ: `StaffLoginForm.test.tsx`, `src/servers/auth/auth.action.test.ts`.

- [ ] **Step 1:** Restyle bằng `Field` + `Input` + `Button loading`. Lỗi inline có `aria-invalid`. Giữ `autoComplete`, `spellCheck={false}` và mọi nhãn.
- [ ] **Step 2:** cổng xanh → **Step 3:** Commit `feat(web): redesign the sign-in and sign-up forms`

## M2 · Ứng viên

### Task 16: Đơn của tôi

**Files:** Modify `src/components/my-applications/MyApplicationsClient.tsx`, `ApplicationDetail.tsx`, `status-config.ts` (chỉ màu; nhãn chuyển sang dùng `statusTone`), `timeline/ApplicationTimeline.tsx`, `ui/ApplicationCard.tsx`, `ui/MyApplicationsHeader.tsx`, `ui/MyApplicationsStats.tsx`, `ui/WithdrawApplicationForm.tsx`. Test giữ: `ApplicationTimeline.test.tsx`, `build-timeline.test.ts`, `ApplicationCard.test.tsx`, `src/app/(candidate)/my-applications/[id]/page.test.tsx`.

- [ ] **Step 1: Viết test đỏ** (`MyApplicationsClient.test.tsx` mới): `applications=[]` → heading "Chưa có đơn ứng tuyển" và link "Tìm việc" tới `/job-postings`.
- [ ] **Step 2:** FAIL → restyle

- Thẻ đơn có `StatusChip kind="application"` và dòng "Bước tiếp theo" lấy từ timeline sẵn có.
- Trang chi tiết dùng 2 cột ≥ 1024 px (timeline | thông tin việc).
- Rút đơn trong `Dialog` xác nhận.

→ cổng xanh → Commit `feat(web): redesign my applications`

### Task 17: CV của tôi

**Files:** Modify `src/components/my-cvs/MyCvsClient.tsx`, `ui/CvCard.tsx`, `ui/CvDetailModal.tsx` (thành `Sheet`), `ui/MyCvsHeader.tsx`, `ui/MyCvsStats.tsx`, `ui/UploadCvModal.tsx` (vùng kéo thả + nút chọn file, giữ action).

- [ ] **Step 1: Viết test đỏ** (`MyCvsClient.test.tsx` mới, bọc bằng provider store hiện có): không có CV → heading "Chưa có CV nào" và nút "Tải CV lên".
- [ ] **Step 2:** FAIL → restyle (lưới thẻ, `StatusChip kind="parsing"`) → cổng xanh → Commit `feat(web): redesign my cvs`

### Task 18: Lịch phỏng vấn và hồ sơ ứng viên

**Files:** Modify `src/components/my-interviews/MyInterviewsClient.tsx`, `src/components/profile/ProfileClient.tsx`, `ui/ProfileDetails.tsx`, `ui/ProfileEditModal.tsx` (thành `Sheet`), `ui/ProfileHeader.tsx`, `ui/ProfileInfoCard.tsx`. Test giữ: `MyInterviewsClient.test.tsx`, `group-schedules.test.ts`, `src/app/(candidate)/my-interviews/page.test.tsx`.

- [ ] **Step 1:** Restyle.
  - Lịch: nhóm theo ngày có tiêu đề ngày dính.
  - Nút "Vào phòng họp" là `ButtonLink` mở tab mới khi có link (giữ `meeting-link`).
  - Hồ sơ: một cột rộng 720 px, sửa trong `Sheet`.
- [ ] **Step 2:** cổng xanh → **Step 3:** Commit `feat(web): redesign my interviews and the candidate profile`

### Task 19: Thiết lập phỏng vấn thử

**Files:** Modify `src/components/mock-interview/MockInterviewClient.tsx`, `ui/TopicSelector.tsx`, `ui/DifficultySelector.tsx` (thành `Segmented`), `ui/CategoryDropdown.tsx` (thành `Select`), `ui/SessionCard.tsx`, `ui/SessionSidebar.tsx`.

- [ ] **Step 1:** Restyle.
  - Một thẻ chia 3 bước có số thứ tự thật (chủ đề → độ khó → bắt đầu).
  - Danh sách phiên cũ bên phải với `StatusChip kind="interview"`.
- [ ] **Step 2:** cổng xanh → **Step 3:** Commit `feat(web): redesign the mock interview setup`

### Task 20: Phiên phỏng vấn và kết quả

**Files:** Modify `src/components/mock-interview/InterviewChatClient.tsx`, `InterviewGeneratingClient.tsx`, `InterviewPendingResultClient.tsx`, `InterviewResultClient.tsx`, `ui/ChatBubble.tsx`, `ui/AnswerInput.tsx`, `ui/TypingIndicator.tsx`, `ui/ScoreOverview.tsx`, `ui/ActionPlanCard.tsx`, `ui/QnAAccordion.tsx`; dùng `InterviewShell` (Task 11).

- [ ] **Step 1:** Restyle.
  - Bề mặt `night`; thanh tiến độ "Câu x/y" bằng `transform: scaleX`.
  - Bong bóng vào trang `fadeRise`. Ô trả lời dính đáy có safe-area; Enter gửi, Shift+Enter xuống dòng (giữ nếu đã có).
  - Kết quả: điểm tổng `Stat`, điểm theo tiêu chí bằng `ScoreBar` (nhãn là tên tiêu chí), kế hoạch hành động, danh
    sách hỏi đáp mở từng câu (`button` có `aria-expanded`).
- [ ] **Step 2:** cổng xanh → **Step 3:** Commit `feat(web): redesign the mock interview session and result`

## M3 · Recruiter

### Task 21: Bảng điều khiển

**Files:** Modify `src/components/dashboard/DashboardKpiCards.tsx` (dùng `Stat`), `RecruitmentPipeline.tsx`, `ApplicationsTrendChart.tsx`, `OpenJobsList.tsx`, `RecentCandidates.tsx`; `src/app/(recruiter)/dashboard/page.tsx` (markup).

- [ ] **Step 1:** Restyle.
  - Lưới KPI 4 cột.
  - Pipeline thành thanh ngang tỉ lệ theo số lượng (`scaleX`).
  - Recharts: `stroke="rgb(var(--accent))"`, lưới `rgb(var(--line))`, tooltip theo token, chữ trục `ink-3` 12 px.
- [ ] **Step 2:** cổng xanh → **Step 3:** Commit `feat(web): redesign the recruiter dashboard`

### Task 22: Tin tuyển dụng

**Files:** Modify `src/components/job-postings/JobPostingsClient.tsx`, `ui/JobPostingCard.tsx`, `ui/JobPostingsHeader.tsx` (thành `PageToolbar` có tab trạng thái `Segmented`), `ui/JobPostingsStats.tsx`, `ui/MutateJobPostingModal.tsx` (dùng `Dialog size="lg"` có chỉ báo bước "Bước 1/2"), `ui/JobPostingStep1.tsx`, `ui/JobPostingStep2.tsx`; `src/app/(recruiter)/jobs/page.tsx`. Test giữ: `JobPostingStep1.test.tsx`, `JobPostingStep2.test.tsx`.

- [ ] **Step 1:** Restyle. Thẻ tin có `StatusChip kind="job"`, số ứng viên `tabular-nums`, menu hàng bằng `DropdownMenu`.
- [ ] **Step 2:** cổng xanh → **Step 3:** Commit `feat(web): redesign the job postings`

### Task 23: Danh sách ứng viên và panel xem nhanh

**Files:**
- Modify: `src/components/candidates/CandidatesClient.tsx`, `ui/CandidatesHeader.tsx`, `ui/CandidatesStats.tsx`, `ui/CandidatesFilters.tsx`, `ui/CandidateRow.tsx`, `ui/BulkScreeningBar.tsx`, `ui/BulkScreeningDialog.tsx`, `ui/CompareBar.tsx`, `ui/ExportCsvButton.tsx`, `ui/ViewToggle.tsx`; `src/app/(recruiter)/jobs/[jobId]/candidates/page.tsx`
- Create: `src/components/candidates/ui/CandidatePeek.tsx`, `CandidatePeek.test.tsx`
- Test giữ: `CandidateRow.test.tsx`, `CandidatesFilters.test.tsx`, `BulkScreeningBar.test.tsx`, `BulkScreeningDialog.test.tsx`, `CompareBar.test.tsx`, `ExportCsvButton.test.tsx`, `useScreeningLiveRefresh.test.ts`

**Interfaces:**
- Consumes: `IApplicationDto`, `effectiveScreeningScores` từ `@ats-platform/types` (như `CandidateRow` đang dùng), `Sheet`, `ScoreBar`, `StatusChip`.
- Produces:
  - `CandidatePeek({ application: IApplicationDto | null, jobId: string, onClose: () => void })`
  - `CandidateRow` thêm prop tùy chọn `onPeek?: (applicationId: string) => void` và nút
    `IconButton aria-label="Xem nhanh {tên}"`

- [ ] **Step 1: Viết test đỏ** (`CandidatePeek.test.tsx` + bổ sung `CandidatesFilters.test.tsx`)

- Peek với application có screening → dialog tên là tên ứng viên; `getByRole('meter', { name: 'Gợi ý AI' })` đúng
  điểm hiệu lực (dùng fixture có điểm đã duyệt để thấy khác điểm gốc); link "Mở hồ sơ đầy đủ" tới
  `/jobs/{jobId}/candidates/{applicationId}`; có câu "Điểm AI chỉ là gợi ý. Bạn quyết định vòng tiếp theo."
- Không có screening → "Chưa có điểm".
- Bấm "Xem nhanh {tên}" ở hàng thì mở peek; Esc đóng và focus về nút đó.
- Danh sách rỗng → heading "Chưa có ứng viên".

- [ ] **Step 2:** FAIL → viết peek, restyle bảng

- Cột: Ứng viên (Avatar + tên + email `ink-3`) · Gợi ý AI (`ScoreBar`) · Vòng (`StatusChip`) · Nộp lúc
  (`tabular-nums`) · thao tác.
- Thanh hàng loạt dính đáy, hiện số đã chọn, vào bằng `fadeRise`.
- Peek không chứa thao tác chuyển vòng (chỉ link sang chi tiết).

→ cổng xanh → Commit `feat(web): redesign the candidate list with a quick peek panel`

### Task 24: Chi tiết ứng viên

**Files:** Modify `src/components/candidates/CandidateDetailClient.tsx`, `ui/CandidateTabs.tsx` (dùng `Tabs`, giữ tên tab test đang truy vấn), `ui/CandidateOverviewTab.tsx`, `ui/NotesPanel.tsx`, `ui/ScorecardPanel.tsx`, `ui/ScorecardForm.tsx`, `ui/ReviewScreeningButton.tsx`, `ui/ReviewScreeningDialog.tsx` (thành `Dialog`). Test giữ: `CandidateTabs.test.tsx`, `NotesPanel.test.tsx`, `ScorecardPanel.test.tsx`, `ScorecardForm.test.tsx`, `ReviewScreeningButton.test.tsx`.

- [ ] **Step 1:** Restyle.
  - Header dính: Avatar, tên, `StatusChip`, thao tác hiện có.
  - Khối "Gợi ý AI": điểm, khuyến nghị, điểm theo tiêu chí bằng `ScoreBar`, phần giải thích. Luồng "Duyệt điểm" giữ
    nguyên.
- [ ] **Step 2:** cổng xanh → **Step 3:** Commit `feat(web): redesign the candidate detail`

### Task 25: So sánh ứng viên

**Files:** Modify `src/components/candidates/CompareTable.tsx`; `src/app/(recruiter)/jobs/[jobId]/compare/page.tsx` (markup). Test giữ: `CompareTable.test.tsx`, `compare/page.test.tsx`.

- [ ] **Step 1:** Restyle.
  - Cột tiêu chí dính trái (`sticky left-0 bg-surface`); hàng điểm `tabular-nums`.
  - Ô cao nhất mỗi hàng có `Badge tone="success"` "Cao nhất", giữ logic hiện có nếu đã có; không có thì không thêm.
- [ ] **Step 2:** cổng xanh → **Step 3:** Commit `feat(web): redesign the candidate comparison`

### Task 26: Kanban và menu chuyển vòng

**Files:** Modify `src/components/kanban/KanbanClient.tsx`, `KanbanColumn.tsx`, `KanbanCard.tsx`, `ScreeningConfigModal.tsx`. Test giữ: `KanbanCard.test.tsx`, `kanban-mappers.test.ts`. Create `src/components/kanban/KanbanMoveMenu.test.tsx`.

**Interfaces:**
- Consumes: `handleDropToColumn(id: string, stage: Stage)` hiện có trong `KanbanClient` (giữ nguyên mọi luật chặn);
  `stages` từ `kanban.constants`.
- Produces: menu ngữ cảnh viết lại bằng `DropdownMenu` neo vào nút "Tùy chọn" của thẻ (bỏ toạ độ cố định), gồm:
  - "Xem hồ sơ"
  - "AI Sàng lọc CV" (giữ điều kiện disable hiện có)
  - submenu "Chuyển sang vòng…" liệt kê mọi stage khác stage hiện tại trừ `cancelled`; chọn một mục gọi
    `handleDropToColumn(id, stage)`

- [ ] **Step 1: Viết test đỏ** (render `KanbanClient` với store/fixture có 1 ứng viên ở `applied`, mock `updateApplicationStatusAction` trả `{ success: true }`)

- Mở "Tùy chọn" → `menuitem` "Chuyển sang vòng…" → `menuitem` "Sàng lọc" → `updateApplicationStatusAction`
  được gọi với `(id, 'screening')`.
- Chọn "Đã tuyển" (vượt 2 vòng) → không gọi action và hiện toast lỗi hiện có "Hệ thống không cho phép kéo ứng viên
  vượt qua 2 vòng cùng lúc." (mock `@/lib/toast`).

- [ ] **Step 2:** FAIL → viết menu, restyle

- Cột rộng 288 px, header cột có số lượng `tabular-nums` và chấm màu tone.
- Thẻ: `Surface plain`, khi kéo nhấc lên (`shadow-e4`, `scale 1.02`, xoay 1°).
- Nhãn trạng thái sàng lọc dùng `StatusChip kind="screening"`.

→ cổng xanh → Commit `feat(web): redesign the kanban and add a move to stage menu`

### Task 27: Lịch phỏng vấn của staff và hồ sơ staff

**Files:** Modify `src/components/interview-schedule/InterviewScheduleClient.tsx`, `ui/MutateInterviewScheduleModal.tsx`, `ui/ScheduleCard.tsx`, `ui/ScheduleDayColumn.tsx`, `ui/ScheduleDetailDrawer.tsx` (thành `Sheet`), `ui/ScheduleSummaryStrip.tsx`, `ui/ScheduleToolbar.tsx`, `ui/WeekCalendarGrid.tsx`; `src/components/recruiter-profile/RecruiterProfileClient.tsx`, `src/components/user-management/StaffProfileClient.tsx`; `src/app/(recruiter)/interviews/page.tsx`. Test giữ: `MutateInterviewScheduleModal.test.tsx`, `ScheduleCard.test.tsx`, `ScheduleDetailDrawer.test.tsx`, `interview-time.test.ts`, `meeting-link.test.ts`.

- [ ] **Step 1:** Restyle. Lưới tuần có cột hôm nay tô `accent-soft`, giờ `tabular-nums`, thẻ lịch theo `StatusChip kind="schedule"`.
- [ ] **Step 2:** cổng xanh → **Step 3:** Commit `feat(web): redesign the interview calendar and staff profile`

## M4 · Admin

Mẫu chung:
- `PageToolbar(title, tìm, lọc, nút thêm)`
- dải số liệu (component `*Stats` hiện có, restyle thành `Stat` cỡ nhỏ)
- `Table` với menu hàng `DropdownMenu`
- tạo/sửa trong `Dialog`, xem chi tiết trong `Sheet`

### Task 28: Người dùng, nhà tuyển dụng, phòng ban

**Files:** Modify mọi file trong `src/components/user-management/` (trừ `StaffProfileClient` đã làm ở Task 27), `src/components/recruiter-management/`, `src/components/department-management/`; `src/app/(admin)/recruiter-management/page.tsx`. Test giữ: `AddUserModal.test.tsx`, `EditUserModal.test.tsx`, `UserRow.test.tsx`, `DepartmentCard.test.tsx`, `users.action.test.ts`, `departments.action.test.ts`.

- [ ] **Step 1: Viết test đỏ** (`UserClient.test.tsx` mới): danh sách rỗng → heading "Chưa có người dùng"; tìm không ra → "Không có người dùng khớp".
- [ ] **Step 2:** FAIL → restyle → cổng xanh → Commit `feat(web): redesign user, recruiter and department management`

### Task 29: Danh mục ngành nghề, kỹ năng, chủ đề phỏng vấn

**Files:** Modify mọi file trong `src/components/job-category-management/`, `src/components/skill-management/`, `src/components/interview-topic-management/`. Test giữ: `DeleteInterviewTopicButton.test.tsx`.

- [ ] **Step 1:** Restyle.
  - Cây danh mục: thụt lề 16 px mỗi cấp, đường dẫn dọc `line`, nút mở/đóng có `aria-expanded`.
  - Bảng kỹ năng và chủ đề theo mẫu chung.
- [ ] **Step 2:** cổng xanh → **Step 3:** Commit `feat(web): redesign the category, skill and topic management`

### Task 30: Cấu hình AI, nhật ký AI, hồ sơ công ty

**Files:** Modify mọi file trong `src/components/ai-configuration/`, `src/components/ai-usage-logs/`; `src/app/(admin)/company-profile/page.tsx`. Test giữ: `AddProfileModal.test.tsx`, `ConfigCard.test.tsx`, `AiUsageLogsFilter.test.tsx`, `AiUsageLogsTable.test.tsx`.

- [ ] **Step 1:** Restyle.
  - Thẻ hồ sơ trọng số: tổng trọng số hiển thị "x/100" `tabular-nums`, `Badge` "Mặc định".
  - Nhật ký AI: bảng với token, chi phí, thời gian bằng `font-mono tabular-nums`.
  - Hồ sơ công ty: form một cột 720 px bằng `Field`.
- [ ] **Step 2:** cổng xanh → **Step 3:** Commit `feat(web): redesign the ai configuration, ai logs and company profile`

## M5 · Hoàn thiện

### Task 31: Dọn và chặn màu rời

**Files:**
- Create: `src/test/design-guard.test.ts`, `src/test/design-guard.allow.json`
- Delete: `src/components/dashboard/DashboardLayout.tsx`, `src/components/public/layout/PublicHeader.tsx`, `PublicHeader.test.tsx`, `PublicFooter.tsx`.
- Giữ `src/types/fonts/fonts.ts`, vì `src/legacy` còn import qua đường dẫn dùng chung `@/types/fonts/fonts`.

- [ ] **Step 1: Viết test**

`design-guard.test.ts` quét mọi `.tsx` trong `src/components` và `src/app` (bỏ qua `src/legacy`, `*.test.tsx` và
file trong allow-list). Fail và in danh sách `file:line` cho từng vi phạm:
- regex `\[#[0-9A-Fa-f]{3,8}\]`
- `fontFamily:`
- `z-\[\d+\]`
- `\bh-screen\b`
- import `@/types/fonts/fonts`

Allow-list chỉ cho `src/app/global-error.tsx` (không có Tailwind khi lỗi gốc), có ghi lý do trong JSON.

- [ ] **Step 2: Chạy, sửa đến khi xanh**

Chứng minh test có răng: thêm tạm `className="bg-[#123456]"` vào một component, thấy fail, hoàn lại.

- [ ] **Step 3:** Xóa file không còn tham chiếu (`grep -rn "DashboardLayout\|PublicHeader\|PublicFooter" apps/web/src --include=*.tsx | grep -v legacy` → rỗng), chạy cổng + `npx nx build web` → xanh.
- [ ] **Step 4:** Commit `refactor(web): guard the design tokens and drop the replaced shells`

### Task 32: E2E

**Files:** Modify các `apps/web/e2e/*.e2e.ts` có selector theo markup cũ; Create `apps/web/e2e/ui-variant.e2e.ts`.

- [ ] **Step 1:** Dựng stack test.
  - Theo `docs/tasks/test-defect-fixes/README.md`.
  - Cổng 3001 đang bị english-learning chiếm, nên đặt `WEB_E2E_BASE_URL=http://localhost:3011` trước khi
    `docker compose -f docker-compose.test.yml up -d --build --wait`.
  - Chạy `node apps/web/e2e/support/prepare-local.mjs`.
- [ ] **Step 2:** Viết `ui-variant.e2e.ts`.
  - Ứng viên đăng nhập.
  - Menu tài khoản → "Dùng giao diện cũ" → thấy `html[data-ui="legacy"]` và pill "Dùng giao diện mới".
  - Bấm pill → `html[data-ui="modern"]`.
- [ ] **Step 3:** `npm run test:e2e:web` → sửa selector đến khi mọi hành trình xanh. Selector sửa theo role/chữ, không theo class.
- [ ] **Step 4:** Hạ stack: `docker compose -f docker-compose.test.yml down -v --remove-orphans`.
- [ ] **Step 5:** Commit `test(web): cover switching between the ui variants end to end`

### Task 33: Kiểm bằng mắt

**Files:** Create `docs/tasks/ui-redesign/screenshots/*.png`, `docs/tasks/ui-redesign/visual-check.md`

- [ ] **Step 1:** Với stack test của Task 32, chụp mọi nhóm màn ở 1440, 1024 và 390 px bằng trình duyệt trong app. Mỗi vai trò đăng nhập bằng tài khoản mẫu.
- [ ] **Step 2:** Dữ liệu xấu nhất.
  - Tạo một tin tuyển dụng tiêu đề 120 ký tự và một ứng viên tên dài qua UI test.
  - Kiểm `/job-postings`, bảng ứng viên, Kanban và sidebar không tràn ngang ở 390 px:
    `document.documentElement.scrollWidth === 390`.
- [ ] **Step 3:** Giả lập `prefers-reduced-motion: reduce`, mở trang có stagger, xác nhận phần tử hiện ngay (không có `transform` khác `none` sau 50 ms).
- [ ] **Step 4:** Chuyển sang giao diện cũ, chụp `/job-postings` và `/dashboard`, so với ảnh trước khi redesign (chụp từ checkout `dev`); ghi lệch nếu có.
- [ ] **Step 5:** Sửa lỗi tìm thấy (mỗi lỗi một commit `fix(web): …`), ghi `visual-check.md` gồm bảng màn × kích thước × kết quả, và mục "Chưa kiểm".
- [ ] **Step 6:** Commit `docs(tasks): record the ui redesign visual check`

### Task 34: Tài liệu

**Files:** Modify `docs/deliveries/ui-redesign.md` (thêm mục as-built), `~/.claude/knowledge-base/ats-platform/context.md` §10 Web và §11, `CLAUDE.md` §10 (một dòng trỏ tới delivery record).

- [ ] **Step 1:** Brain §11.
  - Thay "Direction A" bằng hướng A · Mực & kính, kèm đường dẫn spec/decisions.
  - Ghi quy tắc token, `src/legacy` đóng băng, cookie `talentai-ui`, env `UI_DEFAULT_VARIANT`, `design-guard`.
- [ ] **Step 2:** As-built.
  - Đã làm theo mốc; lệch so với plan; số test trước/sau; số bundle; điều chưa kiểm.
- [ ] **Step 3:** Commit `docs(web): record the ui redesign as built`
