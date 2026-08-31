/**
 * Tải ảnh gốc của nongsan.maugiaodien.com từ Wayback Machine.
 *
 * Site gốc bị Cloudflare chặn (403 mọi URL), nên nguồn duy nhất là bản lưu trữ
 * công khai của web.archive.org. Bắt buộc dùng timestamp chính xác lấy từ CDX API —
 * dùng wildcard (vd. `2026id_`) sẽ nhận về 404/403 kèm trang HTML lỗi.
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const UPLOADS = 'nongsan.maugiaodien.com/wp-content/uploads'
const OUT = join(process.cwd(), 'public', 'images')

/** Ảnh cần tải: tên file đích -> phần đuôi đường dẫn gốc (không tính biến thể kích thước). */
const WANTED: Record<string, string> = {
  'product-bom-my.png': '2019/01/Screenshot_1.png',
  'product-vai-nhap-khau.png': '2019/01/Screenshot_2.png',
  'product-tao-nhap-khau.png': '2019/01/Screenshot_3.png',
  'product-ca-chua-da-lat.png': '2019/01/Screenshot_4.png',
  'logo.png': '2019/07/halonalogo.png',
  'banner1.png': '2019/07/banner1.png',
  'banner2.png': '2019/07/banner2.png',
  'banner3.png': '2019/07/banner3.png',
  'banner-main-002.png': '2019/07/banner-main-002-5.png',
  'banner-main-003.png': '2019/07/banner-main-003-2.png',
  'hero-2.jpg': '2022/03/banner_list12.jpg',
  'post-trong-rau-sach.jpg': '2019/01/blog-img-6.jpg',
  'post-km-thang.png': '2019/01/km-thang-giai-phong-mo-thua-da-xau-doc-to-trong-co-the-e1648746180713.png',
  'post-vong-eo-con-kien.jpg': '2019/01/lay-lai-vong-eo-con-kien-nho-cong-thuc-don-gian-tu-cu-dau-va-rau-cai.jpg',
}

type Row = { url: string; ts: string; w: number; h: number; full: boolean }

/** Chữ ký nhị phân — chặn việc ghi trang HTML lỗi thành file .png/.jpg. */
function sniff(b: Buffer): 'png' | 'jpeg' | 'gif' | null {
  if (b.length > 8 && b.toString('hex', 0, 8) === '89504e470d0a1a0a') return 'png'
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpeg'
  if (b.length > 6 && b.toString('ascii', 0, 6).startsWith('GIF8')) return 'gif'
  return null
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Wayback hay trả 429/503/504 lúc tải nặng — thử lại với backoff tăng dần. */
async function fetchRetry(url: string, tries = 5): Promise<Response> {
  let last = ''
  for (let i = 0; i < tries; i++) {
    if (i) await sleep(1500 * 2 ** (i - 1))
    try {
      const res = await fetch(url)
      if (res.ok) return res
      // 404 nghĩa là không có bản lưu trữ — thử lại cũng vô ích.
      if (res.status === 404) return res
      last = `HTTP ${res.status}`
    } catch (err) {
      last = err instanceof Error ? err.message : String(err)
    }
  }
  throw new Error(`${last} sau ${tries} lần thử`)
}

async function cdx(pathSuffix: string): Promise<Row[]> {
  // Bỏ đuôi kích thước để tìm mọi biến thể của cùng một ảnh.
  const base = pathSuffix.replace(/\.\w+$/, '')
  const api = `https://web.archive.org/cdx/search/cdx?url=${UPLOADS}/${base}*&output=json&collapse=urlkey&filter=statuscode:200&limit=100`
  const res = await fetchRetry(api)
  if (!res.ok) return []
  const text = await res.text()
  if (!text.trim()) return []
  const rows = JSON.parse(text) as string[][]
  const [header, ...data] = rows
  const iTs = header.indexOf('timestamp')
  const iUrl = header.indexOf('original')
  return data.map((r) => {
    const url = r[iUrl]
    const m = url.match(/-(\d+)x(\d+)\.\w+$/)
    return {
      url,
      ts: r[iTs],
      w: m ? Number(m[1]) : 0,
      h: m ? Number(m[2]) : 0,
      full: !m,
    }
  })
}

async function download(row: Row): Promise<Buffer> {
  const url = `https://web.archive.org/web/${row.ts}id_/${row.url}`
  const res = await fetchRetry(url, 3)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const kind = sniff(buf)
  if (!kind) throw new Error(`không phải ảnh (${buf.length} bytes, có thể là trang lỗi)`)
  return buf
}

async function main() {
  await mkdir(OUT, { recursive: true })
  const missing: string[] = []

  for (const [dest, src] of Object.entries(WANTED)) {
    const path = join(OUT, dest)
    if (existsSync(path) && sniff(await readFile(path))) {
      console.log(`· ${dest.padEnd(30)} đã có, bỏ qua`)
      continue
    }
    const variants = await cdx(src)
    if (!variants.length) {
      console.log(`✗ ${dest.padEnd(30)} không có bản lưu trữ nào`)
      missing.push(dest)
      continue
    }
    // Ưu tiên ảnh gốc (không có đuôi kích thước), sau đó tới biến thể lớn nhất.
    const ordered = [...variants].sort((a, b) => {
      if (a.full !== b.full) return a.full ? -1 : 1
      return b.w * b.h - a.w * a.h
    })

    let saved = false
    for (const row of ordered) {
      try {
        const buf = await download(row)
        await writeFile(join(OUT, dest), buf)
        const dims = row.full ? 'gốc' : `${row.w}x${row.h}`
        console.log(`✓ ${dest.padEnd(30)} ${String(buf.length).padStart(7)}b  ${dims}`)
        saved = true
        break
      } catch (err) {
        // Thử biến thể tiếp theo — không phải mọi biến thể đều được lưu trữ.
        void err
      }
    }
    if (!saved) {
      console.log(`✗ ${dest.padEnd(30)} tải thất bại ở cả ${ordered.length} biến thể`)
      missing.push(dest)
    }
  }

  console.log(`\n${Object.keys(WANTED).length - missing.length}/${Object.keys(WANTED).length} ảnh đã tải.`)
  if (missing.length) console.log(`Thiếu: ${missing.join(', ')}`)
}

main()
