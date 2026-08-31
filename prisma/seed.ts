/**
 * Nạp dữ liệu gốc của nongsan.maugiaodien.com.
 *
 * Sản phẩm/danh mục lấy từ trang chủ lưu trữ; nội dung bài viết đọc trực tiếp từ
 * RSS feed lưu trữ (`_reference/original-feed.xml`) để giữ nguyên văn bản gốc
 * thay vì chép cứng hàng ngàn ký tự HTML vào file này.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcryptjs'

process.loadEnvFile(path.join(process.cwd(), '.env'))

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
})

const PRODUCT_CATEGORIES = [
  {
    slug: 'trai-cay-nhap-khau',
    name: 'Trái cây nhập khẩu',
    subtitle: 'Là nhà cung cấp thực phẩm tươi sạch hàng đầu khu vực phía nam',
    position: 1,
  },
  {
    slug: 'trai-cay-noi-dia',
    name: 'Trái cây nội địa',
    subtitle: 'Có hàng ngàn mẫu hoa quả tươi đủ loại cho bạn chọn!',
    position: 2,
  },
  {
    slug: 'nuoc-ep',
    name: 'Nước ép',
    subtitle: 'Mang lại sự sảng khoái khi thưởng thức nước ép tại Halona Fruits',
    position: 3,
  },
  {
    slug: 'cac-loai-hat-dinh-duong',
    name: 'Các loại hạt dinh dưỡng',
    subtitle: 'Nguồn dinh dưỡng tự nhiên cho cả gia đình',
    position: 4,
  },
  // "Oragnic" là lỗi chính tả có sẵn trên site gốc — giữ nguyên để trung thành với bản clone.
  {
    slug: 'cac-loai-rau-cu-qua-oragnic',
    name: 'Các loại rau củ quả Oragnic',
    subtitle: 'Rau củ quả canh tác hữu cơ, không hoá chất',
    position: 5,
  },
]

const POST_CATEGORIES = [
  { slug: 'tin-tuc', name: 'Tin tức', position: 1 },
  { slug: 'lam-dep', name: 'Làm đẹp', position: 2 },
]

/** 4 sản phẩm của site gốc. Giá tính bằng VND. */
const PRODUCTS = [
  {
    slug: 'bom-my',
    name: 'Bom mỹ',
    price: 200000,
    salePrice: 180000,
    image: '/images/product-bom-my.png',
    shortDescription: 'Bom Mỹ nhập khẩu, quả to đều, giòn ngọt và mọng nước.',
    description:
      '<p>Bom Mỹ (táo Mỹ) được nhập khẩu trực tiếp, quả to đều, vỏ đỏ bóng, thịt quả giòn ngọt và mọng nước. Sản phẩm được bảo quản lạnh trong suốt quá trình vận chuyển nên giữ được độ tươi và hương vị đặc trưng.</p><p>Bom Mỹ giàu chất xơ và vitamin C, thích hợp ăn trực tiếp, làm salad hoặc ép lấy nước.</p><ul><li>Xuất xứ: Hoa Kỳ</li><li>Quy cách: tính theo kilogram</li><li>Bảo quản: ngăn mát 2-5°C</li></ul>',
  },
  {
    slug: 'vai-nhap-khau',
    name: 'Vải nhập khẩu',
    price: 80000,
    salePrice: 60000,
    image: '/images/product-vai-nhap-khau.png',
    shortDescription: 'Vải thiều nhập khẩu, cùi dày, hạt nhỏ, ngọt thanh.',
    description:
      '<p>Vải nhập khẩu quả to, cùi dày, hạt nhỏ, vị ngọt thanh và thơm dịu. Hàng được tuyển chọn kỹ, loại bỏ quả dập nát trước khi đóng gói.</p><p>Vải chứa nhiều vitamin C và khoáng chất, thích hợp ăn tráng miệng hoặc làm chè, sinh tố.</p><ul><li>Quy cách: tính theo kilogram</li><li>Bảo quản: ngăn mát, dùng trong 3-5 ngày</li></ul>',
  },
  {
    slug: 'tao-nhap-khau',
    name: 'Táo nhập khẩu',
    price: 50000,
    salePrice: 30000,
    image: '/images/product-tao-nhap-khau.png',
    shortDescription: 'Táo nhập khẩu giòn ngọt, vỏ mỏng, an toàn cho cả gia đình.',
    description:
      '<p>Táo nhập khẩu có vỏ mỏng, thịt quả giòn, vị ngọt xen chút chua nhẹ rất dễ ăn. Sản phẩm có nguồn gốc rõ ràng, đạt tiêu chuẩn kiểm định an toàn thực phẩm.</p><p>Đây là loại trái cây quen thuộc cho bữa phụ của trẻ nhỏ và người lớn tuổi.</p><ul><li>Quy cách: tính theo kilogram</li><li>Bảo quản: nơi khô mát hoặc ngăn mát tủ lạnh</li></ul>',
  },
  {
    slug: 'ca-chua-da-lat',
    name: 'Cà chua Đà Lạt',
    price: 100000,
    salePrice: 80000,
    image: '/images/product-ca-chua-da-lat.png',
    shortDescription: 'Cà chua Đà Lạt chín cây, đỏ mọng, canh tác an toàn.',
    description:
      '<p>Cà chua Đà Lạt được trồng trên vùng cao nguyên khí hậu mát mẻ, quả chín cây nên đỏ mọng, chắc thịt và nhiều nước. Canh tác theo hướng an toàn, hạn chế tối đa thuốc bảo vệ thực vật.</p><p>Thích hợp nấu canh, sốt, làm salad hoặc ép nước uống mỗi ngày.</p><ul><li>Xuất xứ: Đà Lạt, Lâm Đồng</li><li>Quy cách: tính theo kilogram</li><li>Bảo quản: ngăn mát 5-8°C</li></ul>',
  },
]

/**
 * Bản gốc dùng CHUNG một ảnh cắt vuông (Screenshot_4-300x300) làm ảnh hover cho cả 4
 * sản phẩm, nên rê chuột lên "Cà chua Đà Lạt" lại hiện quả táo. Đó là lỗi cấu hình của
 * site demo; ở đây bỏ ảnh hover và dùng hiệu ứng phóng to nhẹ thay thế.
 */
const HOVER_IMAGE = null

/** Ảnh trong nội dung bài viết trỏ về domain gốc — đổi sang ảnh đã tải về máy. */
const IMAGE_REWRITES: Record<string, string> = {
  'blog-img-6': '/images/post-trong-rau-sach.jpg',
  'eat-clean-bi-kip': '/images/post-eat-clean.svg',
  'lay-lai-vong-eo-con-kien': '/images/post-vong-eo-con-kien.jpg',
  'km-thang-giai-phong-mo-thua': '/images/post-km-thang.png',
}

type FeedItem = {
  slug: string
  title: string
  excerpt: string
  content: string
  image: string
  publishedAt: Date
  categories: string[]
}

function decode(s: string) {
  return s
    .replace(/&#8217;|&#039;/g, '’')
    .replace(/&#8211;/g, '–')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8230;/g, '…')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

function parseFeed(): FeedItem[] {
  const xml = readFileSync(path.join(process.cwd(), '_reference', 'original-feed.xml'), 'utf-8')
  const items: FeedItem[] = []

  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const raw = m[1]
    const pick = (tag: string) => {
      const r = new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`).exec(raw)
      return r ? r[1].trim() : ''
    }

    const link = pick('link')
    const slug = link.replace(/\/$/, '').split('/').pop()!

    // Đổi mọi URL ảnh của domain gốc sang file cục bộ đã tải về.
    const content = pick('content:encoded').replace(
      /https?:\/\/nongsan\.maugiaodien\.com\/wp-content\/uploads\/[^"' )]+/g,
      (url) => Object.entries(IMAGE_REWRITES).find(([key]) => url.includes(key))?.[1] ?? url,
    )

    const inline = /src="(\/images\/[^"]+)"/.exec(content)
    const categories = [...raw.matchAll(/<category><!\[CDATA\[(.*?)\]\]><\/category>/g)]
      .map((c) => c[1])
      .filter((c) => c !== 'Chưa phân loại')

    items.push({
      slug,
      title: decode(pick('title')),
      excerpt: decode(pick('description')).replace(/\s+/g, ' ').trim(),
      content,
      image: inline ? inline[1] : '/images/post-eat-clean.svg',
      publishedAt: new Date(pick('pubDate')),
      categories,
    })
  }
  return items
}

async function main() {
  // Xoá sạch để chạy lại `db seed` nhiều lần mà không nhân đôi dữ liệu.
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.contactMessage.deleteMany()
  await prisma.post.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()

  for (const c of PRODUCT_CATEGORIES) {
    await prisma.category.create({ data: { ...c, kind: 'product' } })
  }
  for (const c of POST_CATEGORIES) {
    await prisma.category.create({ data: { ...c, kind: 'post' } })
  }

  // Bản gốc hiển thị cả 4 sản phẩm ở 3 danh mục đầu tiên.
  const inCategories = ['trai-cay-nhap-khau', 'trai-cay-noi-dia', 'nuoc-ep']
  for (const p of PRODUCTS) {
    await prisma.product.create({
      data: {
        ...p,
        hoverImage: HOVER_IMAGE,
        categories: { connect: inCategories.map((slug) => ({ slug })) },
      },
    })
  }

  const posts = parseFeed()
  for (const p of posts) {
    const slugs = p.categories
      .map((name) => POST_CATEGORIES.find((c) => c.name === name)?.slug)
      .filter((s): s is string => Boolean(s))
    await prisma.post.create({
      data: {
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        content: p.content,
        image: p.image,
        publishedAt: p.publishedAt,
        categories: { connect: slugs.map((slug) => ({ slug })) },
      },
    })
  }

  await prisma.user.createMany({
    data: [
      {
        email: 'admin@halona.vn',
        name: 'Quản trị viên',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'ADMIN',
      },
      {
        email: 'khachhang@halona.vn',
        name: 'Nguyễn Văn A',
        passwordHash: await bcrypt.hash('khach123', 10),
        role: 'USER',
        phone: '0912345678',
        address: '12 Phạm Văn Bạch, P. 15, Q. Tân Bình, TP. HCM',
      },
    ],
  })

  console.log(
    `Đã nạp: ${PRODUCT_CATEGORIES.length + POST_CATEGORIES.length} danh mục, ` +
      `${PRODUCTS.length} sản phẩm, ${posts.length} bài viết, 2 tài khoản.`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
