/** Địa chỉ gốc của site, đổi khi triển khai thật. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/** Thông tin site lấy nguyên từ bản lưu trữ của nongsan.maugiaodien.com. */
export const SITE = {
  // "Fruist" là lỗi chính tả có sẵn trên site gốc — giữ nguyên cho đúng bản clone.
  name: 'Halona Fruist',
  tagline: 'Chuyên cung cấp thực phẩm sạch',
  description:
    'Chuyên cung cấp các loại hoa quả nhập khẩu, nội địa và các loại thực phẩm từ thiên nhiên.',
  address: 'Phạm Văn Bạch, P. 15, Q. Tân Bình, Tp. HCM',
  phone: '0999.999.999',
  email: 'contact@halona.vn',
  facebook: 'https://fb.com/facebook',
  youtubeId: 'i493IC18WvY',
} as const

/** Các mục trong khối "VỀ CHÚNG TÔI" ở footer bản gốc. */
export const ABOUT_LINKS = [
  { label: 'Giới thiệu', href: '/gioi-thieu' },
  { label: 'Lĩnh vực hoạt động', href: '/gioi-thieu#linh-vuc' },
  { label: 'Chính sách chất lượng', href: '/gioi-thieu#chat-luong' },
  { label: 'Triết lí kinh doanh', href: '/gioi-thieu#triet-li' },
  { label: 'Năng lực - cơ sở vật chất', href: '/gioi-thieu#nang-luc' },
] as const
