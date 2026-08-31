# Halona Fruist — Website bán nông sản sạch

Bản dựng lại (clone) của website **nongsan.maugiaodien.com** bằng Next.js, kèm đầy đủ
chức năng thương mại điện tử: giỏ hàng, đặt hàng, tài khoản và trang quản trị.

## Chạy dự án

Yêu cầu: **Node.js 20 trở lên** (khuyến nghị 22+). Không cần cài MySQL/PostgreSQL.

```bash
cp .env.example .env       # tạo file cấu hình môi trường
npm install                # tự chạy `prisma generate` sau khi cài
npx prisma migrate deploy  # tạo CSDL SQLite tại prisma/dev.db
npm run db:seed            # nạp dữ liệu mẫu
npm run dev                # http://localhost:3000
```

### Tài khoản demo

| Vai trò    | Email                 | Mật khẩu   |
| ---------- | --------------------- | ---------- |
| Quản trị   | `admin@halona.vn`     | `admin123` |
| Khách hàng | `khachhang@halona.vn` | `khach123` |

## Công nghệ

| Thành phần | Lựa chọn                                   |
| ---------- | ------------------------------------------ |
| Framework  | Next.js 16 (App Router) + React 19          |
| Ngôn ngữ   | TypeScript                                  |
| Giao diện  | Tailwind CSS 4                              |
| CSDL       | SQLite qua Prisma 7 (`better-sqlite3`)      |
| Xác thực   | JWT ký bằng `jose`, lưu trong cookie httpOnly |
| Kiểm tra   | `zod` cho toàn bộ dữ liệu vào từ form       |

Chọn SQLite để dự án chạy được ngay sau `npm install` mà không phải dựng server CSDL.
Muốn chuyển sang PostgreSQL chỉ cần đổi `provider` trong `prisma/schema.prisma` và
`DATABASE_URL` trong `.env`.

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

**Phía quản trị** (`/admin`, cần tài khoản `ADMIN`)

- Bảng điều khiển: thống kê sản phẩm, đơn hàng, doanh thu, liên hệ chưa xử lý
- Sản phẩm: thêm, sửa, xoá, gán danh mục
- Đơn hàng: xem chi tiết và đổi trạng thái
- Bài viết và tin nhắn liên hệ

## Lệnh thường dùng

```bash
npm run dev           # chạy môi trường phát triển
npm run build         # build production
npm run lint          # kiểm tra ESLint
npm run db:seed       # nạp lại dữ liệu mẫu (xoá dữ liệu cũ)
npm run db:reset      # tạo lại CSDL từ đầu rồi seed
npm run db:studio     # mở Prisma Studio để xem CSDL
npm run fetch:assets  # tải lại ảnh gốc từ Wayback Machine
node scripts/e2e.mjs  # chạy 38 kiểm thử đầu-cuối (cần `npm run dev` chạy song song)
```

## Cấu trúc thư mục

```
prisma/          schema, migration và script seed
scripts/         tải ảnh từ Wayback, kiểm thử đầu-cuối
_reference/      bản lưu trữ của site gốc (HTML trang chủ, RSS, danh mục CDX)
public/images/   ảnh gốc đã tải về
src/app/         các route (giữ nguyên đường dẫn tiếng Việt của bản gốc)
src/components/  component giao diện, chia theo khu vực
src/actions/     server action (đặt hàng, xác thực, quản trị, liên hệ)
src/lib/         Prisma client, xác thực, định dạng, hằng số của site
```

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

| Nội dung                                                                 | Xử lý                                                                                                          |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Trang Cửa hàng, Chi tiết SP, Giới thiệu, Liên hệ, Giỏ hàng, Thanh toán, Tài khoản | Không có trong kho lưu trữ → tự thiết kế theo đúng design token và cấu trúc của trang chủ                        |
| Ảnh `banner-home-1.png` (slide 1)                                        | Không được lưu trữ → dựng lại bằng HTML/CSS, tự co giãn theo màn hình                                           |
| Ảnh nền footer `bgff-404.jpg`                                            | Không được lưu trữ → dùng gradient tối (bản gốc vốn phủ lớp đen 60% nên gần như không thấy ảnh)                  |
| Thumbnail bài "Eat Clean"                                                | Không được lưu trữ → dùng ảnh SVG trang trí cùng tông màu                                                       |
| Ảnh hover trên card sản phẩm                                             | Bản gốc dùng chung **một** ảnh cho cả 4 sản phẩm (rê chuột lên "Cà chua Đà Lạt" lại hiện quả táo) → thay bằng hiệu ứng phóng to nhẹ |
| Iframe Facebook Page                                                     | Cần App ID còn hiệu lực của chủ site gốc → bỏ, giữ lại video YouTube                                            |

Các lỗi chính tả của bản gốc được **giữ nguyên** cho đúng tinh thần bản clone:
"Halona Fru**i**st" (tên site) và "Or**a**gnic" (tên danh mục).

## Kiểm thử

`scripts/e2e.mjs` điều khiển Chrome thật qua DevTools Protocol (không cần cài
Playwright/Puppeteer) và chạy 38 kiểm tra: hiển thị trang chủ, điều hướng catalog, thêm
giỏ hàng, đặt hàng cho khách vãng lai và cho thành viên, đăng nhập, tìm kiếm, blog, form
liên hệ, toàn bộ luồng quản trị, responsive ở 375px và trang 404.

```bash
npm run dev            # cửa sổ 1
node scripts/e2e.mjs   # cửa sổ 2
```
