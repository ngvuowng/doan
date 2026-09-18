/**
 * Nhập sản phẩm thật từ kleverfruits.com.vn cho 7 danh mục lá của menu chính.
 *
 * Site gốc Halona chỉ có 4 sản phẩm nên các danh mục mới (theo menu kleverfruits) không có
 * gì để hiển thị. kleverfruits chạy Haravan, có JSON công khai
 * `/collections/<handle>/products.json` (50 sản phẩm/trang, đủ cho 6 sản phẩm/danh mục).
 * Ảnh tải về `public/images` (CDN hstatic nhận hậu tố `_1024x1024`, lỗi thì lấy ảnh gốc) để
 * không hotlink; dữ liệu đã làm sạch ghi vào `_reference/kleverfruits-products.json` và commit
 * kèm ảnh, nên `backend/seed.py` chạy được offline.
 *
 * Chạy: npm run fetch:kleverfruits  (rồi `python seed.py` trong backend/)
 * Thứ tự lấy = thứ tự feed; kleverfruits có thể xếp lại nên xem `git diff _reference/` trước khi commit.
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const SITE = 'https://kleverfruits.com.vn'
const OUT = join(process.cwd(), 'public', 'images')
const DATA = join(process.cwd(), '..', '_reference', 'kleverfruits-products.json')
const PER_CATEGORY = 6
/** Slug 4 sản phẩm gốc trong seed.py — handle kleverfruits không được trùng. */
const ORIGINAL_SLUGS = ['bom-my', 'vai-nhap-khau', 'tao-nhap-khau', 'ca-chua-da-lat']

type Mapping = { category: string; collections: string[]; skip?: RegExp }

/** Danh mục lá của seed.py <- collection kleverfruits. Nhiều collection thì xoay vòng mỗi lượt 1. */
const MAPPING: Mapping[] = [
  { category: 'gio-qua-tang-trai-cay-cao-cap', collections: ['qua-tang-trai-cay-cao-cap'] },
  { category: 'chuc-mung-cac-dip-le', collections: ['chuc-mung-nhan-dip'] },
  // Bỏ hộp/giỏ quà lẫn trong collection quả để nhóm này đúng là trái cây.
  {
    category: 'trai-cay-nhap-khau',
    collections: ['tao', 'cherry', 'nho', 'le', 'kiwi', 'viet-quat'],
    skip: /^(hop|gio|khay|set|combo)-/,
  },
  { category: 'trai-cay-noi-dia', collections: ['trai-cay-viet-nam'] },
  { category: 'nuoc-ep', collections: ['do-uong'] },
  { category: 'khay-set-hoa-qua', collections: ['trai-cay-cat-san'] },
  { category: 'bo-doi-dinh-duong', collections: ['bo-doi-dinh-duong'] },
]

/** Phần của feed Haravan mà script dùng. Giá là chuỗi; `compare_at_price` là "0" khi không giảm. */
type HrvProduct = {
  title: string
  handle: string
  body_html: string | null
  available: boolean
  images: { src: string }[]
  variants: { price: string; compare_at_price: string | null }[]
}

/** Một dòng trong file JSON — cùng shape với PRODUCTS của seed.py, thêm `category` và `source`. */
type Row = {
  slug: string
  name: string
  price: number
  sale_price: number | null
  image: string
  short_description: string
  description: string
  category: string
  source: string
}

/** Chữ ký nhị phân — chặn việc ghi trang HTML lỗi thành file ảnh. */
function sniff(b: Buffer): 'png' | 'jpeg' | 'gif' | null {
  if (b.length > 8 && b.toString('hex', 0, 8) === '89504e470d0a1a0a') return 'png'
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg'
  if (b.length > 6 && b.toString('ascii', 0, 6).startsWith('GIF8')) return 'gif'
  return null
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function fetchRetry(url: string, tries = 5): Promise<Response> {
  let last = ''
  for (let i = 0; i < tries; i++) {
    if (i) await sleep(1500 * 2 ** (i - 1))
    try {
      const res = await fetch(url)
      if (res.ok) return res
      if (res.status === 404) return res
      last = `HTTP ${res.status}`
    } catch (err) {
      last = err instanceof Error ? err.message : String(err)
    }
  }
  throw new Error(`${last} sau ${tries} lần thử`)
}

// ---------- Làm sạch HTML mô tả ----------
// Regex thuần (cùng tinh thần parse_feed() của seed.py), không thêm thư viện. Chỉ giữ các thẻ
// mà .rich-text trong globals.css có style. tsconfig target ES2017 nên không dùng lookbehind.

const ALLOWED = 'p|h2|h3|h4|ul|ol|li|strong|em|br'
const MAX_DESCRIPTION = 2500
const MAX_SHORT = 200

function plain(html: string): string {
  return html
    // Thẻ khối thành khoảng trắng, thẻ inline (strong, em) bỏ hẳn để không sinh "Splendor ."
    .replace(/<\/?(?:p|li|h[1-6]|ul|ol|br|div)\b[^>]*>/g, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanHtml(raw: string, title: string): string {
  let s = raw
    // Khối không hiển thị được: bỏ trọn cả nội dung bên trong.
    .replace(/<(script|style|iframe|table)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // Ảnh trong bài bỏ hẳn (đã có ảnh chính); <br .../> chuẩn hoá.
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<br\b[^>]*>/gi, '<br>')
    .replace(/<(\/?)b\b[^>]*>/gi, '<$1strong>')
    .replace(/<(\/?)i\b[^>]*>/gi, '<$1em>')
    .replace(/<(\/?)h1\b[^>]*>/gi, '<$1h2>')
    // Thẻ được phép: bỏ mọi thuộc tính (style=, class=...), tên thẻ viết thường.
    .replace(new RegExp(`<(\\/?)(${ALLOWED})\\b[^>]*>`, 'gi'), (_m, c: string, t: string) => `<${c}${t.toLowerCase()}>`)
    // Mọi thẻ khác (span, a, div, font, u, blockquote, td/tr sót lại...) -> gỡ vỏ, giữ chữ.
    .replace(new RegExp(`<\\/?(?!(?:${ALLOWED})\\b)[a-z][^>]*>`, 'gi'), '')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    // Haravan bọc <p> trong <li>: gỡ để chỗ cắt độ dài không rơi vào giữa danh sách.
    .replace(/<li><p>([\s\S]*?)<\/p><\/li>/g, '<li>$1</li>')
  // Khối rỗng — lặp vì gỡ trong tạo ra rỗng ngoài (<p><strong></strong></p>).
  for (let i = 0; i < 3; i++) {
    s = s.replace(/<(p|h2|h3|h4|li|strong|em)>(?:\s|<br>)*<\/\1>/g, '').replace(/<(ul|ol)><\/\1>/g, '')
  }
  // Chữ trần trước thẻ đầu tiên (nhiều body bắt đầu bằng tên sản phẩm) -> gói trong <p>.
  s = s.trim().replace(/^([^<]+)/, '<p>$1</p>')
  // Đoạn chỉ lặp lại tên sản phẩm hoặc lặp một đoạn trước đó (chú thích ảnh) -> bỏ,
  // tránh mô tả ngắn kiểu "tên tên".
  const seenText = new Set<string>([title.toLowerCase()])
  s = s.replace(/<p>(?:<(?:em|strong)>)*([^<]*)(?:<\/(?:em|strong)>)*<\/p>/g, (m, text: string) => {
    const key = plain(text).toLowerCase()
    if (seenText.has(key)) return ''
    seenText.add(key)
    return m
  })
  return truncate(s) || `<p>${title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`
}

/** Cắt ở ranh giới khối, chỉ chốt tại điểm mọi <ul>/<ol> đã đóng. */
function truncate(html: string): string {
  const chunks = html.replace(/<\/(p|h[234]|ul|ol)>/g, '$&\u0000').split('\u0000')
  const count = (s: string, t: string) => s.split(t).length - 1
  let out = ''
  let safe = ''
  for (const c of chunks) {
    if (out.length + c.length > MAX_DESCRIPTION && safe) break
    out += c
    if (count(out, '<ul>') === count(out, '</ul>') && count(out, '<ol>') === count(out, '</ol>')) safe = out
  }
  return safe || out
}

/** Chữ thuần của mô tả (bỏ tiêu đề vì thường lặp tên), cắt ở ranh giới từ cho vừa cột 500. */
function summarize(description: string, title: string): string {
  const text = plain(description.replace(/<h[234]>[\s\S]*?<\/h[234]>/g, ' '))
  if (!text) return title
  if (text.length <= MAX_SHORT) return text
  return text.slice(0, MAX_SHORT).replace(/\s+\S*$/, '').replace(/[\s,.;:–-]+$/, '') + '…'
}

// ---------- Ánh xạ và tải ----------

function toRow(p: HrvProduct, category: string, image: string): Row {
  const v = p.variants[0]
  const price = Number.parseInt(v.price, 10)
  const compare = Number.parseInt(v.compare_at_price ?? '0', 10) || 0
  // Giá gạch chỉ có nghĩa khi cao hơn giá bán (feed có vài dòng compare_at_price thấp hơn).
  const onSale = compare > price
  const name = p.title.trim()
  const description = cleanHtml(p.body_html ?? '', name)
  return {
    slug: p.handle,
    name,
    price: onSale ? compare : price,
    sale_price: onSale ? price : null,
    image,
    short_description: summarize(description, name),
    description,
    category,
    source: `${SITE}/products/${p.handle}`,
  }
}

/** Tải ảnh chính về public/images/product-<handle>.<ext>; đã có thì bỏ qua. Trả đường dẫn web. */
async function saveImage(handle: string, src: string): Promise<string> {
  for (const ext of ['jpg', 'png']) {
    const name = `product-${handle}.${ext}`
    const path = join(OUT, name)
    if (existsSync(path) && sniff(await readFile(path))) {
      console.log(`  · ${name} đã có, bỏ qua`)
      return `/images/${name}`
    }
  }
  // Ảnh gốc có thể rất lớn; hstatic hỗ trợ hậu tố kích thước kiểu Shopify (không phóng to).
  const candidates = [src.replace(/(\.\w+)(\?.*)?$/, '_1024x1024$1'), src]
  for (const url of candidates) {
    const res = await fetchRetry(url)
    if (!res.ok) continue
    const buf = Buffer.from(await res.arrayBuffer())
    const kind = sniff(buf)
    if (kind !== 'png' && kind !== 'jpeg') continue
    const name = `product-${handle}.${kind === 'png' ? 'png' : 'jpg'}`
    await writeFile(join(OUT, name), buf)
    console.log(`  ✓ ${name} ${buf.length}b`)
    return `/images/${name}`
  }
  throw new Error(`không tải được ảnh của ${handle}: ${src}`)
}

async function loadCollection(handle: string, skip?: RegExp): Promise<HrvProduct[]> {
  const res = await fetchRetry(`${SITE}/collections/${handle}/products.json`)
  if (!res.ok) throw new Error(`${handle}: HTTP ${res.status}`)
  const { products } = (await res.json()) as { products: HrvProduct[] }
  return (
    products
      .filter((p) => p.images.length > 0 && p.variants.length > 0 && !skip?.test(p.handle))
      // Đang bán xếp trước; sort ổn định nên thứ tự feed được giữ trong mỗi nhóm.
      .sort((a, b) => Number(b.available) - Number(a.available))
  )
}

async function main() {
  await mkdir(OUT, { recursive: true })
  // Một sản phẩm có thể nằm ở nhiều collection: chỉ vào danh mục gặp trước.
  const seen = new Set<string>(ORIGINAL_SLUGS)
  const rows: Row[] = []

  for (const { category, collections, skip } of MAPPING) {
    const queues = await Promise.all(collections.map((h) => loadCollection(h, skip)))
    const picked: HrvProduct[] = []
    // Xoay vòng qua các collection, mỗi lượt 1 sản phẩm; hết mùa chỉ dùng để bù cho đủ.
    while (picked.length < PER_CATEGORY && queues.some((q) => q.length > 0)) {
      for (const q of queues) {
        let p = q.shift()
        while (p && seen.has(p.handle)) p = q.shift()
        if (!p || picked.length >= PER_CATEGORY) continue
        seen.add(p.handle)
        picked.push(p)
      }
    }
    const late = picked.filter((p) => !p.available).length
    console.log(`${category.padEnd(30)} ${picked.length} sản phẩm${late ? ` (${late} hết mùa, bù cho đủ)` : ''}`)
    for (const p of picked) {
      if (ORIGINAL_SLUGS.includes(p.handle)) throw new Error(`trùng slug sản phẩm gốc: ${p.handle}`)
      rows.push(toRow(p, category, await saveImage(p.handle, p.images[0].src)))
    }
  }

  await writeFile(DATA, JSON.stringify(rows, null, 2) + '\n')
  console.log(`\n${rows.length} sản phẩm → ${DATA}`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
