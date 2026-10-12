'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { formatCompactPrice, formatPrice } from '@/lib/format'

/** Nhãn đã tính sẵn ở server; component chỉ nhận dữ liệu thuần. */
export type ChartPoint = { label: string; longLabel: string; revenue: number; orderCount: number }

// Cùng giá trị với --color-primary, --color-primary-dark, --color-line, --color-muted.
const BAR = '#669933'
const BAR_ACTIVE = '#557f2a'
const GRID = '#e6e6e6'
const TICK = { fill: '#777777', fontSize: 12 }
const CURSOR = { fill: 'rgba(102, 153, 51, 0.08)' }
const SYNC_ID = 'bao-cao'

function PointTooltip({ active, payload }: TooltipContentProps) {
  const point = payload?.[0]?.payload as ChartPoint | undefined
  if (!active || !point) return null
  return (
    <div className="rounded-md border border-line bg-white px-3 py-2 text-xs shadow-md">
      <p className="text-muted">{point.longLabel}</p>
      <p className="mt-1 text-sm font-bold text-ink">{formatPrice(point.revenue)}</p>
      <p className="text-muted">{point.orderCount.toLocaleString('vi-VN')} đơn hàng</p>
    </div>
  )
}

/**
 * Doanh thu và số đơn là hai thang đo khác nhau nên vẽ hai biểu đồ riêng thay vì một
 * biểu đồ hai trục. `syncId` làm hai biểu đồ cùng sáng cột khi rê chuột; chỉ biểu đồ
 * trên hiện tooltip (gồm cả hai số) để không có hai hộp giống nhau.
 *
 * Tắt animation: khi in, khung có thể đổi bề ngang khiến Recharts vẽ lại, và nếu có
 * animation thì cột mọc lại từ 0 đúng lúc trình duyệt chụp trang in.
 */
export function RevenueChart({ points }: { points: ChartPoint[] }) {
  return (
    <div className="space-y-6">
      <figure className="min-w-0">
        <figcaption className="mb-2 text-sm font-medium">Doanh thu</figcaption>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={points} syncId={SYNC_ID} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="label"
              tick={TICK}
              tickLine={false}
              axisLine={{ stroke: GRID }}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              tickFormatter={formatCompactPrice}
              tick={TICK}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip content={PointTooltip} cursor={CURSOR} />
            <Bar
              dataKey="revenue"
              name="Doanh thu"
              fill={BAR}
              activeBar={{ fill: BAR_ACTIVE }}
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </figure>

      <figure className="min-w-0">
        <figcaption className="mb-2 text-sm font-medium">Số đơn hàng</figcaption>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={points} syncId={SYNC_ID} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="label"
              tick={TICK}
              tickLine={false}
              axisLine={{ stroke: GRID }}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              allowDecimals={false}
              tick={TICK}
              tickLine={false}
              axisLine={false}
              width={56}
            />
            <Tooltip content={() => null} cursor={CURSOR} />
            <Bar
              dataKey="orderCount"
              name="Số đơn"
              fill={BAR}
              activeBar={{ fill: BAR_ACTIVE }}
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </figure>
    </div>
  )
}
