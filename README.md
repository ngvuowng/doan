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
      FastAPI (Python)         :8000        ← nghiệp vụ, 31 endpoint, Swagger ở /docs
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

| Vai trò    | Email                 | Mật khẩu   |
| ---------- | --------------------- | ---------- |
| Quản trị   | `admin@halona.vn`     | `admin123` |
| Khách hàng | `khachhang@halona.vn` | `khach123` |

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
- Cửa hàng và trang danh mục: lọc theo danh mục, sắp xếp, phân trang
- Chi tiết sản phẩm: chọn số lượng, mô tả, sản phẩm liên quan
- Tìm kiếm sản phẩm theo tên và mô tả
- Giỏ hàng lưu ở `localStorage` + ngăn kéo giỏ hàng trong header
- Thanh toán: COD hoặc chuyển khoản, tạo đơn hàng và trang xác nhận theo mã đơn
- Tài khoản: đăng ký, đăng nhập, cập nhật hồ sơ, xem lịch sử đơn hàng
- Tin tức: danh sách, chuyên mục, chi tiết bài viết
- Giới thiệu và liên hệ (form lưu vào CSDL)
- Trợ lý ảo tư vấn (nút nổi ở mọi trang): giải đáp về sản phẩm, tư vấn chọn hoa quả
  theo nhu cầu, hướng dẫn bảo quản, gợi ý công thức nước ép/sinh tố

**Phía quản trị** (`/admin`, cần tài khoản `ADMIN`)

- Bảng điều khiển: thống kê sản phẩm, đơn hàng, doanh thu, liên hệ chưa xử lý
- Sản phẩm: thêm, sửa, xoá, gán danh mục
- Đơn hàng: xem chi tiết và đổi trạng thái
- Bài viết và tin nhắn liên hệ
- Xem lại hội thoại của trợ lý ảo (chỉ đọc)

Quyền quản trị được kiểm ở **cả hai phía**: frontend chặn sớm để báo lỗi thân thiện,
backend kiểm lại trên từng endpoint `/api/admin/*` (thiếu token → 401, sai quyền → 403).

**Giá đơn hàng luôn được backend tính lại từ CSDL.** Client chỉ gửi
`{productId, quantity}`; có sửa giá trong payload cũng không ảnh hưởng tổng tiền.

## Lệnh thường dùng

```bash
# Frontend (trong frontend/)
npm run dev           # môi trường phát triển
npm run build         # build production (cần backend đang chạy)
npm run lint          # ESLint
npx tsc --noEmit      # kiểm tra kiểu
node scripts/e2e.mjs  # 43 kiểm thử đầu-cuối (cần cả 3 tiến trình đang chạy)

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

## Cấu trúc thư mục

Mỗi tầng trong sơ đồ kiến trúc ở trên là một thư mục riêng ở gốc repo:

```
docker-compose.yml   MySQL 8.4 + phpMyAdmin
docs/SRS.md          đặc tả yêu cầu phần mềm
_reference/          bản lưu trữ của site gốc (HTML trang chủ, RSS, danh mục CDX)

backend/             ← tầng nghiệp vụ (Python)
  app/models.py      9 bảng + 2 bảng nối (SQLAlchemy)
  app/schemas.py     Pydantic; đổi snake_case ↔ camelCase ở biên API
  app/routers/       products · categories · posts · auth · orders · contact · chat · admin
  app/gemini.py      gọi Gemini API qua REST (httpx)
  app/chat_prompt.py system prompt tiếng Việt + nhồi danh mục sản phẩm vào ngữ cảnh
  app/security.py    băm mật khẩu, ký/đọc JWT
  app/deps.py        dependency lấy người dùng từ Authorization, tiện ích or_404
  alembic/           migration
  seed.py            nạp dữ liệu gốc (đọc RSS trong _reference/)

frontend/            ← tầng giao diện (TypeScript)
  src/lib/api.ts     lớp gọi backend — thay cho Prisma ở bản trước
  src/lib/auth.ts    phiên đăng nhập; lib/session.ts giữ cookie
  src/app/           các route (giữ nguyên đường dẫn tiếng Việt của bản gốc)
  src/components/    component giao diện, chia theo khu vực (có chat/ cho trợ lý ảo)
  src/actions/       server action (đặt hàng, xác thực, quản trị, liên hệ)
  public/images/     ảnh gốc đã tải về
  scripts/           tải ảnh từ Wayback, kiểm thử đầu-cuối
```

> Lệnh `npm` phải chạy trong `frontend/`, giống như lệnh `uvicorn`/`alembic` phải
> chạy trong `backend/`. Gốc repo không có `package.json`.

`_reference/` nằm ở gốc vì cả hai tầng đều dùng: `backend/seed.py` đọc RSS lưu trữ
trong đó, còn `frontend/scripts/fetch-assets.ts` tải ảnh từ cùng bản lưu trữ.

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
Playwright/Puppeteer) và chạy 43 kiểm tra: hiển thị trang chủ, điều hướng catalog, thêm
giỏ hàng, đặt hàng cho khách vãng lai và cho thành viên, đăng nhập, tìm kiếm, blog, form
liên hệ, toàn bộ luồng quản trị, responsive ở 375px, trang 404 và khung trợ lý ảo.

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
