# Hướng dẫn chạy dự án bằng Docker Desktop

Dự án dùng Docker Desktop **cho phần CSDL** (MySQL + phpMyAdmin). Backend (FastAPI) và
frontend (Next.js) chạy trực tiếp trên máy.

## Yêu cầu cài sẵn

- **Docker Desktop** — đang mở, biểu tượng cá voi ở trạng thái *Running*
- **Python 3.12+**
- **Node.js 20+**

## Bước 1 — Khởi động MySQL bằng Docker Desktop

Mở terminal tại thư mục gốc của repo:

```bash
docker compose up -d
```

Docker sẽ kéo image `mysql:8.4` và `phpmyadmin:5`, tạo 2 container `halona-mysql` và
`halona-phpmyadmin`. Mở Docker Desktop → tab **Containers**, đợi đến khi `halona-mysql`
hiện **Healthy** (khoảng 10–20 giây lần đầu).

> MySQL được ánh xạ ra cổng **3307** (không phải 3306) để không đụng MySQL có sẵn trên máy.
> Cấu hình nằm trong `docker-compose.yml`.

## Bước 2 — Chạy backend (FastAPI) — terminal 1

**macOS / Linux:**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head               # tạo bảng trong MySQL
python seed.py                     # nạp dữ liệu mẫu
uvicorn app.main:app --reload --port 8000
```

**Windows (PowerShell):**

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
copy .env.example .env
python -m alembic upgrade head     # tạo bảng trong MySQL
python seed.py                     # nạp dữ liệu mẫu
python -m uvicorn app.main:app --reload --port 8000
```

> - Nếu PowerShell báo *"running scripts is disabled on this system"* khi kích hoạt venv,
>   chạy một lần `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` rồi kích hoạt lại.
>   Kích hoạt thành công thì đầu dòng lệnh có tiền tố `(.venv)`.
> - Trên Windows luôn dùng `python -m pip`, `python -m alembic`, `python -m uvicorn`
>   thay vì gọi `pip`, `alembic`, `uvicorn` trực tiếp: các file `.exe` trong `.venv\Scripts`
>   không có chữ ký số nên hay bị Smart App Control / Application Control chặn.

Thấy dòng `Application startup complete.` là xong. Kiểm tra: mở http://localhost:8000/docs.

### Trợ lý ảo (chat)

Mặc định chưa có khoá Gemini nên khung chat sẽ báo lỗi 503. Chọn 1 trong 2 cách, sửa
trong `backend/.env`:

- **Thử giả lập:** thêm dòng `GEMINI_MOCK=1`
- **Dùng thật:** lấy khoá tại https://aistudio.google.com/apikey rồi điền `GEMINI_API_KEY=...`

File `.env` đã nằm trong `.gitignore` — không commit khoá lên git.

## Bước 3 — Chạy frontend (Next.js) — terminal 2

```bash
cd frontend
cp .env.example .env               # Windows PowerShell: copy .env.example .env
npm install
npm run dev
```

Thấy `✓ Ready` là xong. Mở http://localhost:3000.

## Bước 4 — Kiểm tra

| Địa chỉ | Nội dung |
| --- | --- |
| http://localhost:3000 | Website |
| http://localhost:8000/docs | Swagger API |
| http://localhost:8080 | phpMyAdmin — server `db`, user `halona`, mật khẩu `halona` |

Tài khoản mẫu (từ `backend/seed.py`):

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Admin | `admin@halona.vn` | `admin123` |
| Khách hàng | `khachhang@halona.vn` | `khach123` |

## Các lần chạy sau

Không cần cài lại, chỉ cần:

```bash
# Terminal 0 — CSDL (hoặc bấm ▶ trong Docker Desktop)
docker compose up -d

# Terminal 1 — backend
cd backend
source .venv/bin/activate          # Windows PowerShell: .venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000   # Windows: python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```

- Tắt CSDL: `docker compose down` (dữ liệu vẫn giữ trong volume `mysql-data`).
- Xoá sạch dữ liệu để seed lại từ đầu: `docker compose down -v`, rồi làm lại
  `alembic upgrade head` và `python seed.py`.

## Lỗi thường gặp

| Lỗi | Nguyên nhân / cách sửa |
| --- | --- |
| `Can't connect to MySQL server on 127.0.0.1:3307` | Container chưa Healthy hoặc Docker Desktop chưa chạy. Kiểm tra bằng `docker ps`. |
| Port 3307 hoặc 8080 đã bị chiếm | Đổi số cổng bên trái trong `docker-compose.yml` (ví dụ `"3308:3306"`) và sửa `DATABASE_URL` trong `backend/.env` cho khớp. |
| `no configuration file provided: not found` khi `docker compose up` | Đang đứng sai thư mục — không có `docker-compose.yml` ở đó. Thường do giải nén ZIP bị lồng thêm một cấp (`doan-main\doan-main`); `cd` vào đúng thư mục chứa `docker-compose.yml`. |
| `source : The term 'source' is not recognized` | Đang dùng Windows PowerShell — dùng `.venv\Scripts\Activate.ps1` thay cho `source .venv/bin/activate`, và `copy` thay cho `cp`. |
| `Program 'pip.exe' failed to run: An Application Control policy has blocked this file` | Smart App Control / WDAC chặn `.exe` không ký trong `.venv\Scripts`. Dùng `python -m pip`, `python -m alembic`, `python -m uvicorn`. Nếu cả `python.exe` cũng bị chặn: tắt Smart App Control (*Settings → Privacy & security → Windows Security → App & browser control*) hoặc nhờ IT cấp phép. |
| `SyntaxError: expected '('` tại `def or_404[T](...)` trong `app/deps.py` | Python trên máy < 3.12 (cú pháp generic `def f[T]` chỉ có từ 3.12). Cài Python 3.12+ rồi tạo lại venv: `Remove-Item -Recurse -Force .venv`, `py -3.12 -m venv .venv`. |
| `npm : The term 'npm' is not recognized` | Chưa cài Node.js. Tải bản LTS tại https://nodejs.org/en/download, cài xong **mở lại PowerShell** rồi kiểm tra `node --version`. |
| `Thiếu DATABASE_URL trong backend/.env` / `Thiếu AUTH_SECRET` | Quên bước `cp .env.example .env` ở thư mục `backend`. |
| `Không kết nối được tới máy chủ API.` kèm `connect ECONNREFUSED 127.0.0.1:8000` | Backend chưa chạy hoặc chạy sai cổng — frontend render phía máy chủ nên gọi API ngay từ layout. Mở Terminal 1 xem `uvicorn` còn sống và có dòng `Application startup complete.` không (hay đã chết vì CSDL chưa lên / thiếu `.env`); thử mở http://localhost:8000/docs. Nếu cố ý chạy backend ở cổng khác, sửa `API_URL` trong `frontend/.env` cho khớp rồi khởi động lại `npm run dev` (Next.js chỉ đọc `.env` lúc khởi động). |
| Khung chat báo lỗi 503 | Chưa cấu hình `GEMINI_API_KEY` hoặc `GEMINI_MOCK=1` (xem Bước 2). |
| `npm run build` lỗi | Lệnh build cần backend đang chạy vì `generateStaticParams` và `sitemap.xml` đọc dữ liệu thật lúc build. |
