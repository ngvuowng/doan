/**
 * Bộ icon SVG nội tuyến — tránh thêm thư viện icon chỉ để dùng vài hình.
 * Tất cả dùng `currentColor` nên đổi màu bằng class text-* của Tailwind.
 */
type IconProps = { className?: string }

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
}

export const SearchIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const CartIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.55L21 8H6" />
    <circle cx="10" cy="20" r="1.4" />
    <circle cx="18" cy="20" r="1.4" />
  </svg>
)

export const UserIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
)

export const MenuIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
)

export const XIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const ChevronDownIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const ChevronLeftIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m15 6-6 6 6 6" />
  </svg>
)

export const ChevronRightIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m9 6 6 6-6 6" />
  </svg>
)

export const PhoneIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 4h4l2 5-2.5 1.5a12 12 0 0 0 6 6L15 14l5 2v4a1.5 1.5 0 0 1-1.7 1.5A17 17 0 0 1 2.5 5.7 1.5 1.5 0 0 1 4 4Z" />
  </svg>
)

export const MapPinIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </svg>
)

export const MailIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
)

export const FacebookIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.29-.04-1.28-.13-2.43-.13-2.4 0-4.05 1.47-4.05 4.17V9.9H7.5V13h2.72v8h3.28Z" />
  </svg>
)

export const CheckIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
)

export const TrashIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
  </svg>
)

export const TruckIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7z" />
    <circle cx="7" cy="18.5" r="1.6" />
    <circle cx="17.5" cy="18.5" r="1.6" />
  </svg>
)

export const LeafIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 20c0-8 5-13 16-14 0 10-5 15-13 15H4Z" />
    <path d="M4 20c3-6 7-9 12-11" />
  </svg>
)

export const ShieldIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 3l7 3v5.5c0 4.5-3 8-7 9.5-4-1.5-7-5-7-9.5V6l7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

export const HeadsetIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
    <path d="M4 13h3v5H5.5A1.5 1.5 0 0 1 4 16.5V13ZM20 13h-3v5h1.5a1.5 1.5 0 0 0 1.5-1.5V13Z" />
    <path d="M20 18v.5a2.5 2.5 0 0 1-2.5 2.5H13" />
  </svg>
)

export const ChatIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M21 12a8 8 0 0 1-8 8H7l-4 3 1.2-4.3A8 8 0 1 1 21 12Z" />
    <path d="M8.5 11h7M8.5 14.5h4" />
  </svg>
)

export const SendIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M4 11.5 20.5 4l-7 16.5-2.2-6.8L4 11.5Z" />
  </svg>
)
