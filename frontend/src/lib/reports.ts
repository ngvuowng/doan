/**
 * Phần dùng chung của trang báo cáo (`/admin/bao-cao`), route xuất CSV và biểu đồ.
 * Không import `server-only` để component client dùng được; chỉ lấy type từ api.ts.
 */
import type { ReportGranularity, ReportKpis } from '@/lib/api'
import { formatPercent, formatPrice } from '@/lib/format'

/** Khớp MAX_RANGE_DAYS ở backend/app/routers/reports.py. */
export const MAX_RANGE_DAYS = 366

/** Tham số trên URL: `?tu=YYYY-MM-DD&den=YYYY-MM-DD&cua-hang=<id>`. */
export type ReportParams = { start?: string; end?: string; storeId?: string }

type SearchParams = Record<string, string | string[] | undefined>

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 86_400_000

function toUtcDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function isIsoDate(value: string): boolean {
  // Loại cả ngày không tồn tại như 2026-02-30 (Date tự đẩy sang tháng sau).
  return ISO_DATE.test(value) && toUtcDate(value).toISOString().startsWith(value)
}

export function addDays(iso: string, days: number): string {
  return new Date(toUtcDate(iso).getTime() + days * DAY_MS).toISOString().slice(0, 10)
}

function daysBetween(from: string, to: string): number {
  return Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / DAY_MS)
}

/** Hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD (en-CA định dạng sẵn kiểu ISO). */
export function todayVN(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date())
}

export const REPORT_PRESETS = [
  { key: '7', label: '7 ngày' },
  { key: '30', label: '30 ngày' },
  { key: '90', label: '90 ngày' },
  { key: 'thang', label: 'Tháng này' },
  { key: 'nam', label: 'Năm nay' },
] as const

export function presetRange(
  key: (typeof REPORT_PRESETS)[number]['key'],
  today: string,
): { start: string; end: string } {
  if (key === 'thang') return { start: `${today.slice(0, 8)}01`, end: today }
  if (key === 'nam') return { start: `${today.slice(0, 5)}01-01`, end: today }
  return { start: addDays(today, -(Number(key) - 1)), end: today }
}

/**
 * Đọc tham số từ URL. Giá trị sai bị bỏ qua (backend lấy mặc định 30 ngày), ngày đảo
 * ngược được đổi chỗ và khoảng quá dài bị cắt, để người dùng không bao giờ gặp lỗi 422.
 */
export function parseReportParams(sp: SearchParams): ReportParams {
  const read = (key: string) => {
    const value = sp[key]
    return typeof value === 'string' && value.trim() ? value.trim() : undefined
  }
  let start = read('tu')
  let end = read('den')
  if (start && !isIsoDate(start)) start = undefined
  if (end && !isIsoDate(end)) end = undefined
  if (start && !end) {
    // Chỉ có ngày bắt đầu: xem tới hôm nay, nhưng không vượt quá độ dài cho phép.
    const today = todayVN()
    const limit = addDays(start, MAX_RANGE_DAYS - 1)
    end = start > today ? start : limit < today ? limit : today
  }
  if (start && end) {
    if (start > end) [start, end] = [end, start]
    if (daysBetween(start, end) + 1 > MAX_RANGE_DAYS) start = addDays(end, -(MAX_RANGE_DAYS - 1))
  }
  return { start, end, storeId: read('cua-hang') }
}

/** Chuỗi query (kèm `?`) cho trang báo cáo hoặc route CSV; rỗng khi không có tham số. */
export function reportQuery({ start, end, storeId }: ReportParams): string {
  const query = new URLSearchParams()
  if (start) query.set('tu', start)
  if (end) query.set('den', end)
  if (storeId) query.set('cua-hang', storeId)
  const text = query.toString()
  return text ? `?${text}` : ''
}

/** Nhãn một cột của biểu đồ: "13/10" theo ngày, "10/2026" theo tháng. */
export function bucketLabel(iso: string, granularity: ReportGranularity, long = false): string {
  const [year, month, day] = iso.split('-')
  if (granularity === 'month') return long ? `Tháng ${month}/${year}` : `${month}/${year}`
  return long ? `${day}/${month}/${year}` : `${day}/${month}`
}

type KpiKind = 'price' | 'count' | 'rate'

export const KPI_DEFS: readonly {
  key: keyof ReportKpis
  label: string
  kind: KpiKind
  /** Tỉ lệ huỷ tăng là xấu: mũi tên lên tô đỏ. */
  higherIsBetter: boolean
}[] = [
  { key: 'revenue', label: 'Doanh thu', kind: 'price', higherIsBetter: true },
  { key: 'orderCount', label: 'Số đơn', kind: 'count', higherIsBetter: true },
  { key: 'avgOrderValue', label: 'Giá trị trung bình / đơn', kind: 'price', higherIsBetter: true },
  { key: 'itemsSold', label: 'Sản phẩm đã bán', kind: 'count', higherIsBetter: true },
  { key: 'cancelRate', label: 'Tỉ lệ huỷ', kind: 'rate', higherIsBetter: false },
  { key: 'newCustomers', label: 'Khách hàng mới', kind: 'count', higherIsBetter: true },
]

export function formatKpiValue(kind: KpiKind, value: number): string {
  if (kind === 'price') return formatPrice(value)
  if (kind === 'rate') return formatPercent(value)
  return value.toLocaleString('vi-VN')
}

export type Change = { direction: 'up' | 'down' | 'flat'; text: string }

/**
 * Mức thay đổi so với kỳ trước. Tỉ lệ tính bằng điểm phần trăm (7% → 10% là +3 điểm %,
 * không phải +43%). Kỳ trước bằng 0 thì không có phần trăm để so: trả null.
 */
export function describeChange(kind: KpiKind, current: number, previous: number): Change | null {
  const diff = current - previous
  const direction = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat'
  if (kind === 'rate') {
    const points = Math.abs(diff * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })
    return { direction, text: `${points} điểm %` }
  }
  if (previous === 0) return current === 0 ? { direction: 'flat', text: '0%' } : null
  return { direction, text: formatPercent(Math.abs(diff) / previous) }
}
