import 'server-only'
import { getSessionToken } from '@/lib/session'

/**
 * Lớp gọi backend FastAPI. Thay cho `prisma` ở bản trước — mọi truy vấn dữ liệu
 * của frontend đều đi qua đây.
 *
 * Chỉ chạy phía máy chủ (Server Component / Server Action) nên biến môi trường
 * không cần tiền tố NEXT_PUBLIC_ và token không bao giờ lộ ra trình duyệt.
 */
const API_URL = process.env.API_URL ?? 'http://127.0.0.1:8000'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    options?: { cause?: unknown },
  ) {
    super(detail, options)
    this.name = 'ApiError'
  }
}

type Query = Record<string, string | number | boolean | null | undefined>

type RequestOptions = {
  query?: Query
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Gắn header Authorization từ cookie phiên. */
  auth?: boolean
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(path, API_URL)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

/**
 * Lấy thông báo lỗi từ thân phản hồi. FastAPI trả `detail` là chuỗi cho
 * `HTTPException`, nhưng là *mảng* lỗi khi Pydantic tự kiểm tra dữ liệu ở biên
 * API. Bỏ qua nhánh mảng thì mọi lỗi nhập liệu đều hiện thành "Lỗi API (HTTP 422)".
 */
function readDetail(data: unknown): string | null {
  const detail = (data as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map((issue) => (issue as { msg?: unknown } | null)?.msg)
      .filter((msg): msg is string => typeof msg === 'string')
    // `msg` của Pydantic là tiếng Anh; thêm phần dẫn tiếng Việt cho khớp giao diện.
    if (messages.length > 0) return `Dữ liệu không hợp lệ: ${messages.join('; ')}`
  }
  return null
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.auth) {
    const token = await getSessionToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      // Dữ liệu thay đổi được từ trang quản trị nên không cache; giống hệt cách
      // bản Prisma trước đây truy vấn thẳng CSDL mỗi lần render.
      cache: 'no-store',
    })
  } catch (cause) {
    // `fetch` chỉ ném TypeError khi thật sự không kết nối được. Các lỗi khác là
    // tín hiệu điều khiển nội bộ của Next (DYNAMIC_SERVER_USAGE, NEXT_REDIRECT,
    // NEXT_NOT_FOUND...) nên phải ném tiếp, nuốt là hỏng luồng render.
    if (!(cause instanceof TypeError)) throw cause
    // Giữ lại lỗi gốc để còn biết là sai địa chỉ, backend chưa chạy hay lỗi mạng.
    throw new ApiError(503, 'Không kết nối được tới máy chủ API.', { cause })
  }

  if (response.status === 204) return undefined as T
  if (!response.ok) {
    const detail = await response
      .json()
      .then(readDetail)
      .catch(() => null)
    throw new ApiError(response.status, detail ?? `Lỗi API (HTTP ${response.status})`)
  }

  return response.json() as Promise<T>
}

/** Dùng cho các lời gọi "tìm theo slug": không tìm thấy thì trả null thay vì ném lỗi. */
async function findOrNull<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
  try {
    return await request<T>(path, options)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

// ---------- Kiểu dữ liệu API trả về ----------

export type Category = {
  id: string
  slug: string
  name: string
  kind: string
  subtitle: string | null
  position: number
}

export type CategoryWithCount = Category & { productCount: number; postCount: number }

export type ProductCard = {
  id: string
  slug: string
  name: string
  price: number
  salePrice: number | null
  image: string
  hoverImage: string | null
  updatedAt: string
}

export type Product = ProductCard & {
  shortDescription: string
  description: string
  stock: number
  createdAt: string
  categories: Category[]
}

export type ProductDetail = Product & { related: ProductCard[] }

export type ProductPage = {
  items: ProductCard[]
  total: number
  page: number
  pageSize: number | null
}

export type PostCard = {
  id: string
  slug: string
  title: string
  excerpt: string
  image: string
  publishedAt: string
}

export type Post = PostCard & { content: string; categories: Category[] }

export type SessionUser = { id: string; email: string; name: string; role: string }

export type Profile = SessionUser & { phone: string | null; address: string | null }

export type OrderItem = {
  id: string
  orderId: string
  productId: string | null
  name: string
  price: number
  quantity: number
  image: string
}

export type Order = {
  id: string
  code: string
  userId: string | null
  customerName: string
  email: string
  phone: string
  address: string
  note: string | null
  paymentMethod: string
  status: string
  total: number
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  itemCount: number
}

export type ContactMessage = {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  handled: boolean
  createdAt: string
}

export type AdminStats = {
  productCount: number
  orderCount: number
  postCount: number
  pendingContactCount: number
  revenue: number
  recentOrders: Order[]
}

export type ProductInput = {
  name: string
  slug: string
  price: number
  salePrice: number | null
  stock: number
  image: string
  shortDescription: string
  description: string
  categoryIds: string[]
}

export type OrderInput = {
  customerName: string
  email: string
  phone: string
  address: string
  note?: string
  paymentMethod: string
  items: { productId: string; quantity: number }[]
}

export type ContactInput = {
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
}

// ---------- Các nhóm endpoint ----------

export const api = {
  products: {
    list: (query: Query = {}) => request<ProductPage>('/api/products', { query }),
    get: (slug: string) => findOrNull<ProductDetail>(`/api/products/${slug}`),
  },

  categories: {
    list: (kind?: 'product' | 'post') =>
      request<CategoryWithCount[]>('/api/categories', { query: { kind } }),
    get: (slug: string, kind?: 'product' | 'post') =>
      findOrNull<Category>(`/api/categories/${slug}`, { query: { kind } }),
  },

  posts: {
    list: (query: Query = {}) => request<PostCard[]>('/api/posts', { query }),
    get: (slug: string) => findOrNull<Post>(`/api/posts/${slug}`),
  },

  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: SessionUser }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      }),
    register: (name: string, email: string, password: string) =>
      request<{ token: string; user: SessionUser }>('/api/auth/register', {
        method: 'POST',
        body: { name, email, password },
      }),
    me: () => request<Profile>('/api/auth/me', { auth: true }),
    updateProfile: (body: { name: string; phone: string | null; address: string | null }) =>
      request<Profile>('/api/auth/me', { method: 'PATCH', body, auth: true }),
  },

  orders: {
    create: (body: OrderInput) =>
      request<Order>('/api/orders', { method: 'POST', body, auth: true }),
    mine: () => request<Order[]>('/api/orders', { auth: true }),
    get: (code: string) => findOrNull<Order>(`/api/orders/${code}`),
  },

  contact: {
    create: (body: ContactInput) =>
      request<unknown>('/api/contact', { method: 'POST', body }),
  },

  admin: {
    stats: () => request<AdminStats>('/api/admin/stats', { auth: true }),
    products: () => request<Product[]>('/api/admin/products', { auth: true }),
    product: (id: string) => findOrNull<Product>(`/api/admin/products/${id}`, { auth: true }),
    createProduct: (body: ProductInput) =>
      request<Product>('/api/admin/products', { method: 'POST', body, auth: true }),
    updateProduct: (id: string, body: ProductInput) =>
      request<Product>(`/api/admin/products/${id}`, { method: 'PUT', body, auth: true }),
    deleteProduct: (id: string) =>
      request<void>(`/api/admin/products/${id}`, { method: 'DELETE', auth: true }),
    orders: () => request<Order[]>('/api/admin/orders', { auth: true }),
    updateOrderStatus: (id: string, status: string) =>
      request<Order>(`/api/admin/orders/${id}`, { method: 'PATCH', body: { status }, auth: true }),
    posts: () => request<Post[]>('/api/admin/posts', { auth: true }),
    contacts: () => request<ContactMessage[]>('/api/admin/contacts', { auth: true }),
    toggleContact: (id: string) =>
      request<ContactMessage>(`/api/admin/contacts/${id}`, { method: 'PATCH', auth: true }),
  },
}
