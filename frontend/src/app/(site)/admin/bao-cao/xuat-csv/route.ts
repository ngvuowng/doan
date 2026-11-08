import type { NextRequest } from 'next/server'
import { api, ApiError, type AdminReport } from '@/lib/api'
import { getCurrentUser } from '@/lib/auth'
import { formatIsoDate } from '@/lib/format'
import { PAYMENT_LABEL, statusInfo } from '@/lib/orderStatus'
import {
  KPI_DEFS,
  bucketLabel,
  describeChange,
  formatKpiValue,
  parseReportParams,
  todayVN,
} from '@/lib/reports'

// Excel ở máy đặt vùng Việt Nam dùng ";" làm dấu phân cách danh sách; đổi ở đây nếu cần.
const DELIMITER = ','

type Cell = string | number

/**
 * Số giữ nguyên để Excel tính toán được. Chuỗi có dấu phân cách, ngoặc kép hay xuống dòng
 * thì bọc ngoặc kép; chuỗi mở đầu bằng = + - @ (vd. tên sản phẩm do người dùng nhập) thêm
 * dấu nháy để Excel không chạy như công thức.
 */
function cell(value: Cell): string {
  if (typeof value === 'number') return String(value)
  const text = /^[=+\-@]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(text) || text.includes(DELIMITER) ? `"${text.replaceAll('"', '""')}"` : text
}

function changeText(kind: Parameters<typeof describeChange>[0], current: number, previous: number) {
  const change = describeChange(kind, current, previous)
  if (!change) return '—'
  if (change.direction === 'flat') return 'Không đổi'
  return `${change.direction === 'up' ? 'Tăng' : 'Giảm'} ${change.text}`
}

function buildRows(report: AdminReport): Cell[][] {
  const { kpis } = report
  const kpiRows: Cell[][] = KPI_DEFS.map((def) => {
    const { current, previous } = kpis[def.key]
    return [
      def.kind === 'price' ? `${def.label} (VND)` : def.label,
      // Tỉ lệ ghi dạng "7,4%" cho dễ đọc; tiền và số lượng giữ là số.
      def.kind === 'rate' ? formatKpiValue('rate', current) : current,
      def.kind === 'rate' ? formatKpiValue('rate', previous) : previous,
      changeText(def.kind, current, previous),
    ]
  })
  const extra = [
    ['Phí giao hàng (VND)', kpis.shippingTotal],
    ['Đơn không bị huỷ', kpis.validOrderCount],
    ['Đơn đã huỷ', kpis.cancelledCount],
  ] as const

  return [
    ['Báo cáo thống kê Halona Fruist'],
    ['Khoảng thời gian', `${formatIsoDate(report.start)} – ${formatIsoDate(report.end)}`],
    ['Kỳ so sánh', `${formatIsoDate(report.previousStart)} – ${formatIsoDate(report.previousEnd)}`],
    ['Cửa hàng', report.storeName ?? 'Tất cả cửa hàng'],
    ['Lập ngày', formatIsoDate(todayVN())],
    [],
    ['Chỉ số', 'Kỳ này', 'Kỳ trước', 'Thay đổi'],
    ...kpiRows,
    ...extra.map(([label, { current, previous }]): Cell[] => [
      label,
      current,
      previous,
      changeText('count', current, previous),
    ]),
    [],
    [report.granularity === 'day' ? 'Ngày' : 'Tháng', 'Số đơn', 'Doanh thu (VND)'],
    ...report.series.map((p) => [bucketLabel(p.bucket, report.granularity, true), p.orderCount, p.revenue]),
    [],
    ['Trạng thái', 'Số đơn', 'Giá trị đơn (VND)'],
    ...report.statusBreakdown.map((r) => [statusInfo(r.status).label, r.orderCount, r.total]),
    [],
    ['Phương thức thanh toán (đơn không huỷ)', 'Số đơn', 'Doanh thu (VND)'],
    ...report.paymentBreakdown.map((r) => [PAYMENT_LABEL[r.method] ?? r.method, r.orderCount, r.revenue]),
    [],
    ['Cửa hàng (đơn không huỷ)', 'Số đơn', 'Doanh thu (VND)'],
    ...report.storeBreakdown.map((r) => [r.name, r.orderCount, r.revenue]),
    [],
    ['Top sản phẩm', 'Số lượng bán', 'Doanh thu hàng (VND)'],
    ...report.topProducts.map((p) => [p.name, p.quantity, p.revenue]),
    [],
    [`Sắp hết hàng (tồn ≤ ${report.lowStockThreshold})`, 'Tồn kho'],
    ...report.lowStock.map((p) => [p.name, p.stock]),
  ]
}

export async function GET(request: NextRequest) {
  // Trả mã lỗi thay vì chuyển hướng: đây là file tải về, không phải trang.
  const user = await getCurrentUser()
  if (!user) return new Response('Chưa đăng nhập.', { status: 401 })
  if (user.role !== 'ADMIN') {
    return new Response('Bạn không có quyền thực hiện thao tác này.', { status: 403 })
  }

  const params = parseReportParams(Object.fromEntries(request.nextUrl.searchParams))
  let report: AdminReport
  try {
    report = await api.admin.report({
      start: params.start,
      end: params.end,
      store_id: params.storeId,
    })
  } catch (error) {
    if (error instanceof ApiError) return new Response(error.detail, { status: error.status })
    throw error
  }

  const csv = buildRows(report)
    .map((row) => row.map(cell).join(DELIMITER))
    .join('\r\n')
  // BOM ở đầu để Excel nhận ra UTF-8 và hiện đúng tiếng Việt.
  return new Response(`﻿${csv}\r\n`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bao-cao-${report.start}_${report.end}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
