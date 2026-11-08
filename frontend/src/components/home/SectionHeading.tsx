import { SprigIcon } from '@/components/site/icons'

type Props = {
  /** Dòng phụ đề vàng in hoa phía trên tiêu đề. */
  eyebrow?: string
  title: React.ReactNode
  description?: string | null
  align?: 'center' | 'left'
  /** Đặt trên nền tối: tiêu đề trắng, phụ đề vàng sáng. */
  onDark?: boolean
  className?: string
}

/**
 * Tiêu đề khối dùng chung ở trang chủ: phụ đề vàng có hai nhánh lá hai bên, rồi tiêu đề serif.
 * Tiêu đề luôn là `h2.section-title` (kiểm thử e2e đọc theo selector này).
 */
export function SectionHeading({ eyebrow, title, description, align = 'center', onDark, className = '' }: Props) {
  const centered = align === 'center'
  return (
    <header className={`${centered ? 'text-center' : ''} ${className}`}>
      {eyebrow && (
        <p className={`eyebrow mb-2 ${onDark ? 'text-primary-light' : ''}`}>
          <SprigIcon className="h-3 w-7 text-accent" />
          {eyebrow}
          {centered && <SprigIcon flip className="h-3 w-7 text-accent" />}
        </p>
      )}
      <h2 className={`section-title ${onDark ? 'text-white' : ''}`}>{title}</h2>
      {description && (
        <p className={`mt-3 text-sm leading-6 ${centered ? 'mx-auto max-w-2xl' : ''} ${onDark ? 'text-white/70' : 'text-muted'}`}>
          {description}
        </p>
      )}
    </header>
  )
}
