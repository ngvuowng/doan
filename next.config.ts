import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Ghim thư mục gốc của dự án. Không có dòng này, Turbopack đi ngược lên thư mục cha
  // và cảnh báo vì thấy package-lock.json lạ nằm ngoài repo.
  turbopack: { root: import.meta.dirname },
}

export default nextConfig
