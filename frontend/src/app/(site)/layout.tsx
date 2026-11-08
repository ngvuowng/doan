import { SiteChrome } from '@/components/site/SiteChrome'

/**
 * Mọi trang của site (trừ đăng nhập/đăng ký ở nhóm `(auth)`) đi qua layout này để có header,
 * footer và trợ lý ảo. Thư mục `(site)` chỉ để gom nhóm, không xuất hiện trong URL.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>
}
