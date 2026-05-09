const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface Product {
  id: number
  name: string
  description: string | null
  price: number
  genre: string
  current_version: string
  release_year: number
  image_url: string | null
  created_at: string
}

export interface Comment {
  id: number
  product_id: number
  author: string
  content: string
  created_at: string
}

export interface AuditEvent {
  id: string
  type: string
  product_id: number | null
  timestamp: string
  details: Record<string, unknown>
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init)
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  health: () => request<{ status: string }>('/health'),

  listProducts: () => request<Product[]>('/products'),
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  createProduct: (data: Omit<Product, 'id' | 'image_url' | 'created_at'>) =>
    request<Product>('/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  uploadImage: (id: number, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return request<{ image_url: string }>(`/products/${id}/image`, {
      method: 'POST',
      body: fd,
    })
  },

  listComments: (productId: number) =>
    request<Comment[]>(`/products/${productId}/comments`),
  addComment: (productId: number, author: string, content: string) =>
    request<Comment>(`/products/${productId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, content }),
    }),

  listAuditEvents: () => request<AuditEvent[]>('/audit/events'),
}
