# Halona Fruist — Website bán nông sản sạch

Bản dựng lại (clone) của website **nongsan.maugiaodien.com**, kiến trúc ba lớp:
**TypeScript (Next.js) cho giao diện — Python (FastAPI) cho backend — MySQL cho CSDL**.

## Kiến trúc

```
                Trình duyệt
                     │
                     ▼
      Next.js 16 (TypeScript)  :3000        ← giao diện, SSR, SEO
        • Server Component  →  gọi API
        • Server Action     →  gọi API   (zod kiểm tra form, JWT trong cookie httpOnly)
                     │  HTTP/JSON + Authorization: Bearer <JWT>
                     ▼
      FastAPI (Python)         :8000        ← nghiệp vụ, 39 endpoint, Swagger ở /docs
        • SQLAlchemy 2.0 + Alembic
        • Pydantic v2 · JWT HS256 · bcrypt
        • Trợ lý ảo: httpx  ──────────────→  Gemini API (Google)
                     │  PyMySQL
                     ▼
      MySQL 8.4 (Docker)       :3307        ← dữ liệu
      phpMyAdmin (Docker)      :8080
```

Frontend **không bao giờ nói chuyện trực tiếp với CSDL** — mọi truy vấn đều đi qua API.
Token cũng chỉ nằm ở phía máy chủ Next.js (cookie `httpOnly`), không lộ ra trình duyệt.

Đặc tả yêu cầu đầy đủ — tác nhân, use case, sơ đồ tuần tự/hoạt động/lớp, ERD và thiết kế
CSDL — nằm ở [docs/SRS.md](docs/SRS.md).

## Chạy dự án

Yêu cầu: **Docker**, **Python 3.12+**, **Node.js 20+**.

```bash
# 1. CSDL
docker compose up -d                       # MySQL + phpMyAdmin

# 2. Backend  (cửa sổ 1)
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head                       # tạo bảng
python seed.py                             # nạp dữ liệu mẫu
uvicorn app.main:app --reload --port 8000

# 3. Frontend (cửa sổ 2)
cd ../frontend
cp .env.example .env
npm install
npm run dev                                # http://localhost:3000
```

**Trợ lý ảo cần thêm một khoá API.** Lấy khoá miễn phí ở
[Google AI Studio](https://aistudio.google.com/apikey) rồi điền vào `backend/.env`:

```bash
GEMINI_API_KEY=khoa-cua-ban
```

Chưa có khoá thì **website vẫn chạy đầy đủ**, chỉ riêng khung chat báo lỗi cấu hình
bằng tiếng Việt. Muốn thử trước cả luồng chat (lưu CSDL, lịch sử, giao diện) khi chưa
có khoá thì đặt `GEMINI_MOCK=1` để trợ lý trả lời bằng câu giả lập.
File `.env` nằm trong `.gitignore` — **không commit khoá lên git**.

| Địa chỉ | Nội dung |
| --- | --- |
| http://localhost:3000 | Website |
| http://localhost:8000/docs | Tài liệu API (Swagger, tự sinh) |
| http://localhost:8080 | phpMyAdmin — xem trực tiếp dữ liệu trong MySQL |

> **Cổng MySQL là 3307, không phải 3306.** Máy dev đã có sẵn một MySQL khác chiếm cổng
> 3306 nên container ánh xạ ra 3307 để hai bên chạy song song. Muốn đổi lại thì sửa
> `docker-compose.yml` và `backend/.env`.

> `npm run build` cần backend đang chạy vì `generateStaticParams` và `sitemap.xml`
> đọc dữ liệu thật lúc build.

### Tài khoản demo

| Vai trò                        | Email                 | Mật khẩu     |
| ------------------------------ | --------------------- | ------------ |
| Quản trị                       | `admin@halona.vn`     | `admin123`   |
| Quản lý cửa hàng (Tân Bình)    | `quanly@halona.vn`    | `quanly123`  |
| Thu ngân (120 Yên Lãng)        | `thungan@halona.vn`   | `thungan123` |
| Nhân viên bán hàng (Tân Bình)  | `banhang@halona.vn`   | `banhang123` |
| Khách hàng                     | `khachhang@halona.vn` | `khach123`   |

## Công nghệ

| Lớp | Lựa chọn |
| --- | --- |
| Giao diện | Next.js 16 (App Router) + React 19 + TypeScript |
| CSS | Tailwind CSS 4 |
| Backend | FastAPI + SQLAlchemy 2.0 + Alembic |
| CSDL | MySQL 8.4 (Docker), driver PyMySQL |
| Xác thực | JWT HS256 (`python-jose`) + bcrypt, lưu trong cookie httpOnly |
| Kiểm tra dữ liệu | `zod` ở form frontend, `pydantic` ở biên API |
| Trợ lý ảo | Gemini API gọi qua REST bằng `httpx` (không dùng SDK) |

**Vì sao kiểm tra dữ liệu hai lần:** `zod` sinh thông báo lỗi tiếng Việt theo từng ô nhập
cho `useActionState`; `pydantic` là lớp bảo vệ ở biên API, chặn cả những request không đi
qua giao diện. Đây là trùng lặp có chủ đích.

**Vì sao PyMySQL:** thuần Python, không cần trình biên dịch C — `pip install` là chạy được.

## Chức năng

**Phía khách hàng**

- Trang chủ dựng lại đúng 9 khối theo thứ tự của bản gốc
- Menu chính theo kleverfruits.com.vn: một mục "Sản phẩm" xổ **mega menu** 3 cột — Quà
  tặng trái cây · 5 danh mục Halona · Trái cây tươi hàng ngày (mở khi rê chuột hoặc bấm
  mũi tên, đóng bằng Esc/bấm ra ngoài — không dựa vào `group-hover:` vì Tailwind v4 bọc
  nó trong `@media (hover: hover)`);
  7 danh mục lá của menu có **sản phẩm thật nhập từ kleverfruits.com.vn** (6 sản
  phẩm/danh mục, ảnh tải về máy)
- Cửa hàng và trang danh mục: danh mục nhiều cấp, hiện 3 cấp (trang danh mục cha gom sản
  phẩm của toàn bộ cây con), lọc theo danh mục, sắp xếp, phân trang
- Chi tiết sản phẩm: chọn số lượng (chặn theo tồn kho), mô tả, sản phẩm liên quan; sản phẩm
  hết hàng hiện nhãn "Hết hàng" ở cả thẻ sản phẩm lẫn trang chi tiết và khoá nút thêm vào giỏ
- Tìm kiếm sản phẩm theo tên và mô tả
- Giỏ hàng lưu ở `localStorage` + ngăn kéo giỏ hàng trong header
- Thanh toán: chọn cửa hàng giao trong hệ thống 3 cửa hàng (Tân Bình, 120 Yên Lãng,
  ngõ 38 Yên Lãng) — bấm "Dùng vị trí của tôi" để hệ thống tự chọn cửa hàng gần nhất và
  tính phí giao hàng theo khoảng cách (không định vị thì áp phí chuẩn); COD hoặc chuyển
  khoản, tạo đơn hàng và trang xác nhận theo mã đơn; đơn vượt tồn kho bị từ chối và giỏ
  tự hạ số lượng về mức còn lại
- Tài khoản: đăng ký, đăng nhập, cập nhật hồ sơ, xem lịch sử đơn hàng
- Tin tức: danh sách, chuyên mục, chi tiết bài viết
- Giới thiệu và liên hệ (form lưu vào CSDL, liệt kê hệ thống cửa hàng kèm chỉ đường)
- Trợ lý ảo tư vấn (nút nổi ở mọi trang): khách chọn 1 trong 4 chủ đề trước khi hỏi —
  giải đáp về sản phẩm, tư vấn chọn hoa quả theo nhu cầu, hướng dẫn bảo quản, gợi ý
  công thức nước ép/sinh tố — mỗi chủ đề có system prompt và temperature riêng; chủ đề
  công thức đọc thêm giỏ hàng và đơn đã mua để gợi ý đúng từ những gì khách có

**Phía quản trị** (`/admin`, dành cho tài khoản nhân viên — mọi vai trò trừ `USER`)

- Bảng điều khiển: thống kê sản phẩm, đơn hàng, doanh thu, liên hệ chưa xử lý (số đơn
  và doanh thu lọc theo cửa hàng của nhân viên; ADMIN thấy toàn bộ)
- Sản phẩm: thêm, sửa, xoá, gán danh mục
- Đơn hàng: xem chi tiết và đổi trạng thái; tồn kho **trừ đúng một lần** khi bấm "Đã nhận
  tiền" (đơn chuyển khoản) hoặc chuyển đơn sang Hoàn thành (đơn COD), **hoàn lại** khi huỷ
  đơn đã trừ; thiếu hàng thì báo lỗi ngay trên trang, không đổi trạng thái
- Bài viết và tin nhắn liên hệ
- Xem lại hội thoại của trợ lý ảo (chỉ đọc)
- Nhân sự (chỉ `ADMIN`): tạo tài khoản nhân viên, chọn vai trò (quản lý cửa hàng / thu
  ngân / nhân viên bán hàng / quản trị viên), gắn cửa hàng, tick **từng quyền** cho
  từng tài khoản (8 khoá: xem/sửa sản phẩm, xem/đổi trạng thái/xác nhận thanh toán đơn,
  xem bài viết, xử lý liên hệ, xem hội thoại), sửa họ tên/SĐT, đặt lại mật khẩu, và
  **khoá/mở khoá** tài khoản khi nhân sự nghỉ việc

Phân quyền được kiểm ở **cả hai phía**: frontend chặn sớm để báo lỗi thân thiện và ẩn
mục menu / nút không có quyền, backend kiểm lại trên từng endpoint `/api/admin/*` (thiếu
token → 401, sai quyền → 403). Vai trò chỉ là chức danh kèm bộ quyền tick sẵn; quyền
thật là danh sách khoá lưu riêng cho mỗi tài khoản (`users.permissions`), riêng `ADMIN`
có toàn quyền. Nhân viên (trừ `ADMIN`) thuộc một cửa hàng và chỉ thấy/đổi được đơn của
cửa hàng đó. Backend đọc lại bảng `users` ở mỗi request nên khoá tài khoản hay đổi quyền
có hiệu lực ngay, không phải chờ token hết hạn; tài khoản bị khoá đăng nhập sẽ nhận 403
kèm thông báo.

**Giá đơn hàng luôn được backend tính lại từ CSDL.** Client chỉ gửi
`{productId, quantity}`; có sửa giá trong payload cũng không ảnh hưởng tổng tiền.

## Lệnh thường dùng

```bash
# Frontend (trong frontend/)
npm run dev           # môi trường phát triển
npm run build         # build production (cần backend đang chạy)
npm run lint          # ESLint
npx tsc --noEmit      # kiểm tra kiểu
node scripts/e2e.mjs  # 87 kiểm thử đầu-cuối (cần cả 3 tiến trình đang chạy)

# Backend (trong backend/, đã kích hoạt .venv)
uvicorn app.main:app --reload --port 8000
alembic upgrade head                      # áp dụng migration
alembic revision --autogenerate -m "..."  # sinh migration sau khi sửa models.py
python seed.py                            # nạp lại dữ liệu mẫu (xoá dữ liệu cũ)

# CSDL
docker compose up -d      # bật MySQL + phpMyAdmin
docker compose down       # tắt (giữ dữ liệu)
docker compose down -v    # tắt và XOÁ toàn bộ dữ liệu
```

### Nạp lại sản phẩm kleverfruits

Sản phẩm của 7 danh mục lá (menu mới) lấy từ JSON công khai của kleverfruits.com.vn
(nền Haravan). File `_reference/kleverfruits-products.json` và ảnh trong
`frontend/public/images/product-*.jpg` **đã commit**, nên `python seed.py` chạy offline;
chỉ cần chạy lại khi muốn làm mới dữ liệu:

```bash
cd frontend && npm run fetch:kleverfruits   # tải JSON + ảnh, ghi _reference/kleverfruits-products.json
cd ../backend && python seed.py             # nạp lại CSDL
```

kleverfruits có thể xếp lại thứ tự bộ sưu tập theo thời gian, nên xem `git diff _reference/`
trước khi commit bản mới.

## Cấu trúc thư mục

Mỗi tầng trong sơ đồ kiến trúc ở trên là một thư mục riêng ở gốc repo:

```
docker-compose.yml   MySQL 8.4 + phpMyAdmin
docs/SRS.md          đặc tả yêu cầu phần mềm
_reference/          bản lưu trữ của site gốc (HTML trang chủ, RSS, danh mục CDX) + kleverfruits-products.json

backend/             ← tầng nghiệp vụ (Python)
  app/models.py      10 bảng + 2 bảng nối (SQLAlchemy)
  app/schemas.py     Pydantic; đổi snake_case ↔ camelCase ở biên API
  app/routers/       products · categories · posts · auth · orders · stores · contact · chat · admin · staff
  app/permissions.py bộ khoá quyền nhân viên + vai trò (khớp với frontend/src/lib/permissions.ts)
  app/shipping.py    bậc phí giao hàng theo km + haversine (khoảng cách khách → cửa hàng)
  app/inventory.py   trừ/hoàn tồn kho theo đơn (cờ stock_deducted_at + SELECT FOR UPDATE)
  app/gemini.py      gọi Gemini API qua REST (httpx)
  app/chat_modes.py  4 chủ đề tư vấn: đoạn prompt riêng + temperature từng chủ đề
  app/chat_prompt.py ghép system prompt tiếng Việt + nhồi danh mục sản phẩm vào ngữ cảnh
  app/security.py    băm mật khẩu, ký/đọc JWT
  app/deps.py        dependency lấy người dùng từ Authorization (chặn tài khoản khoá), staff_user / admin_user / require(quyền)
  alembic/           migration
  seed.py            nạp dữ liệu gốc (đọc RSS trong _reference/)

frontend/            ← tầng giao diện (TypeScript)
  src/lib/api.ts     lớp gọi backend — thay cho Prisma ở bản trước
  src/lib/auth.ts    phiên đăng nhập; lib/session.ts giữ cookie; requirePermission() chặn trang quản trị theo quyền
  src/lib/permissions.ts  bộ khoá quyền + nhãn tiếng Việt, bộ quyền tick sẵn theo vai trò, can()/isStaff()
  src/app/           các route (giữ nguyên đường dẫn tiếng Việt của bản gốc)
  src/components/    component giao diện, chia theo khu vực (có chat/ cho trợ lý ảo)
  src/actions/       server action (đặt hàng, xác thực, quản trị, nhân sự, liên hệ)
  public/images/     ảnh gốc và ảnh sản phẩm kleverfruits đã tải về
  scripts/           tải ảnh từ Wayback, nhập sản phẩm kleverfruits, kiểm thử đầu-cuối
```

> Lệnh `npm` phải chạy trong `frontend/`, giống như lệnh `uvicorn`/`alembic` phải
> chạy trong `backend/`. Gốc repo không có `package.json`.

`_reference/` nằm ở gốc vì cả hai tầng đều dùng: `backend/seed.py` đọc RSS lưu trữ
trong đó, còn `frontend/scripts/fetch-assets.ts` tải ảnh từ cùng bản lưu trữ. Tương tự,
`_reference/kleverfruits-products.json` do `frontend/scripts/fetch-kleverfruits.ts` sinh ra
và `backend/seed.py` nạp.

## Ghi chú về việc clone

Website gốc nằm sau **Cloudflare** và trả về HTTP 403 cho mọi truy cập tự động, kể cả
`/wp-json/` và RSS. Vì vậy toàn bộ nội dung được phục hồi từ **Wayback Machine** — một
kho lưu trữ công khai — thay vì scrape trực tiếp.

Bản gốc chạy **WordPress 5.9.2 + WooCommerce 6.3.1 + theme Flatsome 3.13.3**. Flatsome là
theme thương mại nên **không sao chép CSS/JS của theme**; giao diện được dựng lại bằng CSS
tự viết dựa trên các design token quan sát được từ HTML lưu trữ:

```
Màu chính   #669933      Font tiêu đề  Roboto Condensed
Màu nhấn    #0a0a0a      Font nội dung Roboto
Nền phụ     #f1f1f1      Font trang trí Pattaya
Nút         bo tròn 20px, chữ thường
Header      35px (top) + 90px (chính), thu còn 50px khi cuộn
```

### Những chỗ khác bản gốc (và lý do)

| Nội dung | Xử lý |
| --- | --- |
| Trang Cửa hàng, Chi tiết SP, Giới thiệu, Liên hệ, Giỏ hàng, Thanh toán, Tài khoản | Không có trong kho lưu trữ → tự thiết kế theo đúng design token và cấu trúc của trang chủ |
| Ảnh `banner-home-1.png` (slide 1) | Không được lưu trữ → dựng lại bằng HTML/CSS, tự co giãn theo màn hình |
| Ảnh nền footer `bgff-404.jpg` | Không được lưu trữ → dùng gradient tối (bản gốc vốn phủ lớp đen 60% nên gần như không thấy ảnh) |
| Thumbnail bài "Eat Clean" | Không được lưu trữ → dùng ảnh SVG trang trí cùng tông màu |
| Ảnh hover trên card sản phẩm | Bản gốc dùng chung **một** ảnh cho cả 4 sản phẩm (rê chuột lên "Cà chua Đà Lạt" lại hiện quả táo) → thay bằng hiệu ứng phóng to nhẹ |
| Iframe Facebook Page | Cần App ID còn hiệu lực của chủ site gốc → bỏ, giữ lại video YouTube |
| Menu chính | Bản gốc chỉ có một mục "Cửa hàng #Halona" xổ 5 danh mục phẳng → thay bằng một mục "Sản phẩm" xổ mega menu 3 cột theo kleverfruits.com.vn (2 nhóm Quà tặng trái cây / Trái cây tươi hàng ngày là con của "Sản phẩm" — cây 3 cấp); 5 danh mục Halona giữ nguyên dưới "Sản phẩm", "Nước ép" đổi tên thành "Nước ép trái cây" nhưng giữ slug `nuoc-ep`; 7 danh mục lá nạp 6 sản phẩm thật/danh mục từ kleverfruits.com.vn (JSON công khai của Haravan, ảnh tải về `public/images`); 2 danh mục hạt/rau củ không có tương đương nên để trống |

Các lỗi chính tả của bản gốc được **giữ nguyên** cho đúng tinh thần bản clone:
"Halona Fru**i**st" (tên site) và "Or**a**gnic" (tên danh mục).

### Khác biệt do đổi từ SQLite sang MySQL

| Nội dung | Ghi chú |
| --- | --- |
| Tìm kiếm | Đối chiếu `utf8mb4_unicode_ci` bỏ qua cả hoa/thường lẫn **dấu**, nên gõ "tao" cũng ra "Táo nhập khẩu". Bản SQLite trước đây chỉ bỏ qua hoa/thường với ký tự ASCII |
| Cột thời gian | Dùng `DATETIME(6)`. `DATETIME` thường làm tròn xuống giây, khiến các bản ghi tạo trong cùng một giây mất thứ tự khi `ORDER BY` |
| Khoá chính | `CHAR(36)` chứa UUID, thay cho `cuid()` của Prisma. Giữ kiểu chuỗi để giỏ hàng và các route `/admin/san-pham/[id]` không phải đổi |
| Tên cột | snake_case cho đúng quy ước MySQL; Pydantic đổi sang camelCase khi trả JSON |

## Kiểm thử

`scripts/e2e.mjs` điều khiển Chrome thật qua DevTools Protocol (không cần cài
Playwright/Puppeteer) và chạy 87 kiểm tra: hiển thị trang chủ, điều hướng catalog (mega
menu, breadcrumb đủ chuỗi tổ tiên, danh mục cha gom sản phẩm của các con không trùng), thêm
giỏ hàng, đặt hàng cho khách vãng lai (chọn cửa hàng tay, phí chuẩn) và cho thành viên
(giả lập định vị ngay trong trang → tự chọn cửa hàng gần nhất, phí theo km), đăng nhập,
tìm kiếm, blog, form liên hệ, toàn bộ luồng quản trị, tồn kho (hoàn thành đơn trừ kho,
không trừ hai lần, huỷ hoàn kho, thiếu hàng báo lỗi, nhãn "Hết hàng", từ chối đặt hàng
khi hết kho), nhân sự (tạo nhân viên, bộ quyền tick sẵn theo vai trò, menu và trang chặn
theo quyền, phạm vi đơn hàng theo cửa hàng, khoá tài khoản chặn đăng nhập), responsive
ở 375px, trang 404 và khung trợ lý ảo.

```bash
docker compose up -d                                    # cửa sổ 1
cd backend && uvicorn app.main:app --port 8000          # cửa sổ 2
npm run dev                                             # cửa sổ 3
node scripts/e2e.mjs                                    # cửa sổ 4
```

38 kiểm tra đầu **không bị sửa** khi chuyển stack — chúng chạy qua giao diện thật nên là
bằng chứng cho thấy việc đổi backend không làm thay đổi hành vi của website. Mục 11
(trợ lý ảo) được thêm sau, và cố ý chấp nhận **cả hai** kết quả: chưa gắn
`GEMINI_API_KEY` thì khung chat phải báo lỗi cấu hình, có khoá thì phải hiện câu trả
lời — nhờ vậy bộ kiểm thử vẫn xanh khi chưa có khoá.
7 kiểm tra về cửa hàng giao và phí giao hàng được chèn thêm vào các mục 4, 5, 7, 8 khi
thêm tính năng này; riêng kiểm tra "trang cảm ơn hiện đúng tổng tiền" được siết thêm
điều kiện tổng đã gồm phí (210.000₫).
