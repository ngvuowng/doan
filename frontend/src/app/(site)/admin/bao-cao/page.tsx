import type { Metadata } from 'next'
import Link from 'next/link'
import { api } from '@/lib/api'
import { requireAdmin } from '@/lib/auth'
import { formatIsoDate, formatPercent, formatPrice } from '@/lib/format'
import { PAYMENT_LABEL } from '@/lib/orderStatus'
import {
  KPI_DEFS,
  REPORT_PRESETS,
  bucketLabel,
  describeChange,
  formatKpiValue,
  parseReportParams,
  presetRange,
  reportQuery,
  todayVN,
} from '@/lib/reports'
import { StatusBadge } from '@/components/account/StatusBadge'
import { BreakdownBars } from '@/components/admin/reports/BreakdownBars'
import { KpiTile } from '@/components/admin/reports/KpiTile'
import { PrintButton } from '@/components/admin/reports/PrintButton'
import { RevenueChart } from '@/components/admin/reports/RevenueChart'

export const metadata: Metadata = { title: 'Báo cáo thống kê' }

const SECTION = 'rounded-lg border border-line p-4 break-inside-avoid'
const SECTION_TITLE = 'mb-4 font-heading text-base font-bold'

export default async function AdminReportPage({ searchParams }: PageProps<'/admin/bao-cao'>) {
  await requireAdmin()
  const params = parseReportParams(await searchParams)
  const stores = await api.stores.list()
  // Id cửa hàng lạ trên URL thì bỏ qua thay vì để backend trả 404.
  const storeId = stores.some((s) => s.id === params.storeId) ? params.storeId : undefined
  const report = await api.admin.report({ start: params.start, end: params.end, store_id: storeId })
  const { kpis } = report
  const today = todayVN()
  const goodsRevenue = kpis.revenue.current - kpis.shippingTotal.current
  const validOrders = kpis.validOrderCount.current
  const share = (part: number, whole: number) => (whole ? formatPercent(part / whole) : '0%')

  const hints: Partial<Record<(typeof KPI_DEFS)[number]['key'], string>> = {
    revenue: `Gồm ${formatPrice(kpis.shippingTotal.current)} phí giao hàng`,
    orderCount: `${kpis.cancelledCount.current} đơn đã huỷ`,
    avgOrderValue: 'Tính trên đơn không bị huỷ',
    cancelRate: `${kpis.cancelledCount.current} / ${kpis.orderCount.current} đơn`,
    newCustomers: storeId ? 'Tính trên toàn hệ thống' : 'Tài khoản đăng ký trong kỳ',
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="hidden text-xs uppercase tracking-wide text-muted print:block">
            Halona Fruist · Lập ngày {formatIsoDate(today)}
          </p>
          <h2 className="font-heading text-lg font-bold">Báo cáo thống kê</h2>
          <p className="mt-1 text-sm text-muted">
            {formatIsoDate(report.start)} – {formatIsoDate(report.end)} · so với{' '}
            {formatIsoDate(report.previousStart)} – {formatIsoDate(report.previousEnd)} ·{' '}
            {report.storeName ?? 'Tất cả cửa hàng'}
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          {/* Thẻ <a> thường: route handler trả file, không cần Link prefetch. */}
          <a
            href={`/admin/bao-cao/xuat-csv${reportQuery({ start: report.start, end: report.end, storeId })}`}
            className="btn-outline"
          >
            Xuất CSV
          </a>
          <PrintButton />
        </div>
      </header>

      {/* Bộ lọc nằm trên cùng và áp cho mọi số liệu bên dưới. */}
      <div className="space-y-4 rounded-lg border border-line bg-shell/40 p-4 print:hidden">
        <nav aria-label="Khoảng thời gian" className="flex flex-wrap gap-2">
          {REPORT_PRESETS.map((preset) => {
            const range = presetRange(preset.key, today)
            const active = range.start === report.start && range.end === report.end
            return (
              <Link
                key={preset.key}
                href={`/admin/bao-cao${reportQuery({ ...range, storeId })}`}
                aria-current={active ? 'page' : undefined}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                  active
                    ? 'border-primary bg-primary text-white'
                    : 'border-line bg-white hover:border-primary hover:text-primary'
                }`}
              >
                {preset.label}
              </Link>
            )
          })}
        </nav>
        {/* `key` dựng lại form khi đổi kỳ bằng nút preset, để ô ngày hiện đúng kỳ đang xem. */}
        <form
          key={`${report.start}_${report.end}_${storeId ?? ''}`}
          action="/admin/bao-cao"
          className="flex flex-wrap items-end gap-2"
        >
          <label className="text-xs text-muted">
            Từ ngày
            <input
              type="date"
              name="tu"
              defaultValue={report.start}
              max={today}
              className="field mt-1 block w-auto py-2"
            />
          </label>
          <label className="text-xs text-muted">
            Đến ngày
            <input
              type="date"
              name="den"
              defaultValue={report.end}
              max={today}
              className="field mt-1 block w-auto py-2"
            />
          </label>
          <label className="text-xs text-muted">
            Cửa hàng
            <select
              name="cua-hang"
              defaultValue={storeId ?? ''}
              className="field mt-1 block w-auto py-2"
            >
              <option value="">Tất cả cửa hàng</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary">
            Xem báo cáo
          </button>
        </form>
      </div>

      <section
        aria-label="Chỉ số chính"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-3"
      >
        {KPI_DEFS.map((def) => {
          const { current, previous } = kpis[def.key]
          return (
            <KpiTile
              key={def.key}
              label={def.label}
              value={formatKpiValue(def.kind, current)}
              change={describeChange(def.kind, current, previous)}
              higherIsBetter={def.higherIsBetter}
              hint={hints[def.key]}
            />
          )
        })}
      </section>

      <section className={SECTION}>
        <h3 className={SECTION_TITLE}>
          Diễn biến theo {report.granularity === 'day' ? 'ngày' : 'tháng'}
        </h3>
        {kpis.orderCount.current === 0 ? (
          <p className="py-12 text-center text-muted">
            Không có đơn hàng nào trong khoảng thời gian này.
          </p>
        ) : (
          <>
            <RevenueChart
              points={report.series.map((p) => ({
                label: bucketLabel(p.bucket, report.granularity),
                longLabel: bucketLabel(p.bucket, report.granularity, true),
                revenue: p.revenue,
                orderCount: p.orderCount,
              }))}
            />
            <details className="mt-4 text-sm print:hidden">
              <summary className="cursor-pointer text-muted hover:text-primary">
                Xem số liệu dạng bảng
              </summary>
              <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-line">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-shell text-left">
                    <tr>
                      <th className="px-4 py-2 font-medium">
                        {report.granularity === 'day' ? 'Ngày' : 'Tháng'}
                      </th>
                      <th className="px-4 py-2 text-right font-medium">Số đơn</th>
                      <th className="px-4 py-2 text-right font-medium">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line tabular-nums">
                    {report.series.map((p) => (
                      <tr key={p.bucket}>
                        <td className="px-4 py-2">{bucketLabel(p.bucket, report.granularity, true)}</td>
                        <td className="px-4 py-2 text-right">{p.orderCount}</td>
                        <td className="px-4 py-2 text-right">{formatPrice(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2">
        <section className={SECTION}>
          <h3 className={SECTION_TITLE}>Trạng thái đơn hàng</h3>
          <BreakdownBars
            rows={report.statusBreakdown.map((row) => ({
              key: row.status,
              label: <StatusBadge status={row.status} />,
              value: row.orderCount,
              display: `${row.orderCount} đơn`,
              note: formatPrice(row.total),
            }))}
          />
        </section>
        <section className={SECTION}>
          <h3 className={SECTION_TITLE}>Phương thức thanh toán</h3>
          <BreakdownBars
            rows={report.paymentBreakdown.map((row) => ({
              key: row.method,
              label: PAYMENT_LABEL[row.method] ?? row.method,
              value: row.revenue,
              display: formatPrice(row.revenue),
              note: `${row.orderCount} đơn · ${share(row.orderCount, validOrders)}`,
            }))}
          />
          <p className="mt-4 text-xs text-muted">Chỉ tính đơn không bị huỷ.</p>
        </section>
      </div>

      {!storeId && (
        <section className={SECTION}>
          <h3 className={SECTION_TITLE}>Theo cửa hàng</h3>
          <BreakdownBars
            rows={report.storeBreakdown.map((row) => ({
              key: row.storeId ?? 'none',
              label: row.name,
              value: row.revenue,
              display: formatPrice(row.revenue),
              note: `${row.orderCount} đơn · ${share(row.revenue, kpis.revenue.current)}`,
            }))}
          />
          <p className="mt-4 text-xs text-muted">Chỉ tính đơn không bị huỷ.</p>
        </section>
      )}

      <section className="break-inside-avoid">
        <h3 className={SECTION_TITLE}>Top {report.topProducts.length || ''} sản phẩm bán chạy</h3>
        {report.topProducts.length === 0 ? (
          <p className="rounded-lg border border-line py-12 text-center text-muted">
            Chưa có sản phẩm nào được bán trong kỳ này.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[640px] text-sm print:min-w-0">
              <thead className="bg-shell text-left">
                <tr>
                  <th className="w-12 px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Sản phẩm</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium">SL bán</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Doanh thu hàng</th>
                  <th className="w-40 px-4 py-3 font-medium">Tỉ trọng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.topProducts.map((p, index) => (
                  <tr key={p.productId ?? p.name}>
                    <td className="px-4 py-3 text-muted tabular-nums">{index + 1}</td>
                    <td className="px-4 py-3 font-medium">
                      {p.productId ? (
                        <Link href={`/admin/san-pham/${p.productId}`} className="hover:text-primary">
                          {p.name}
                        </Link>
                      ) : (
                        p.name
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.quantity}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                      {formatPrice(p.revenue)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-primary/10">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${goodsRevenue ? (p.revenue / goodsRevenue) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-xs text-muted tabular-nums">
                          {share(p.revenue, goodsRevenue)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-xs text-muted">
          Tỉ trọng tính trên tổng tiền hàng ({formatPrice(goodsRevenue)}, không gồm phí giao).
        </p>
      </section>

      <section className="break-inside-avoid">
        <h3 className={SECTION_TITLE}>Sắp hết hàng (tồn ≤ {report.lowStockThreshold})</h3>
        {report.lowStock.length === 0 ? (
          <p className="rounded-lg border border-line py-12 text-center text-muted">
            Không có sản phẩm nào sắp hết hàng.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[480px] text-sm print:min-w-0">
              <thead className="bg-shell text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Sản phẩm</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Tồn kho</th>
                  <th className="px-4 py-3 print:hidden" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {report.lowStock.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${
                        p.stock <= 3 ? 'font-medium text-sale' : ''
                      }`}
                    >
                      {p.stock === 0 ? 'Hết hàng' : p.stock}
                    </td>
                    <td className="px-4 py-3 text-right print:hidden">
                      <Link
                        href={`/admin/san-pham/${p.id}`}
                        className="rounded-md border border-line px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
                      >
                        Sửa
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs leading-relaxed text-muted">
        Doanh thu là tổng tiền các đơn không bị huỷ đặt trong kỳ, đã gồm phí giao hàng — cùng cách
        tính với trang Tổng quan. Kỳ trước là khoảng thời gian liền trước có cùng số ngày. Ngày giờ
        tính theo giờ Việt Nam. Tồn kho là số hiện tại, không phụ thuộc kỳ đang xem.
      </p>
    </div>
  )
}
