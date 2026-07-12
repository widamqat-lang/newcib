const API_BASE = "/api";

// Request timeout in milliseconds
const FETCH_TIMEOUT_MS = 15000;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string | unknown;
  message?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.error || `خطأ HTTP: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, ...data };
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error("API Error: Request timeout");
      return { success: false, error: "انتهت مهلة الطلب - يرجى المحاولة مرة أخرى" };
    }
    
    console.error("API Error:", error);
    return { success: false, error: "فشل في الاتصال بالخادم" };
  }
}

// ==================== WATCHES API ====================

export interface Watch {
  id: number;
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  colorId: string;
  colorName: string;
  colorHex?: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export const watchesApi = {
  getAll: () => fetchApi<Watch[]>("/admin/watches"),

  get: (id: number) => fetchApi<Watch>(`/admin/watches/${id}`),

  create: (data: Partial<Watch>) =>
    fetchApi<Watch>("/admin/watches", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Watch>) =>
    fetchApi<Watch>(`/admin/watches/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<{ message: string }>(`/admin/watches/${id}`, {
      method: "DELETE",
    }),

  toggle: (id: number) =>
    fetchApi<Watch>(`/admin/watches/${id}/toggle`, {
      method: "PATCH",
    }),

  seed: () => fetchApi<{ message: string }>("/admin/watches/seed", {
    method: "POST",
  }),
};

// ==================== DEVICES API ====================

export interface Device {
  id: number;
  deviceId: string;
  deviceName: string;
  deviceType?: string;
  lastIp?: string;
  lastUsedAt?: Date;
  createdAt: Date;
}

export const devicesApi = {
  getAll: () => fetchApi<Device[]>("/admin/devices"),

  register: (data: { deviceId: string; deviceName: string; deviceType?: string; lastIp?: string }) =>
    fetchApi<Device>("/admin/devices", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    fetchApi<{ message: string }>(`/admin/devices/${id}`, {
      method: "DELETE",
    }),

  deleteAll: () =>
    fetchApi<{ message: string }>("/admin/devices", {
      method: "DELETE",
    }),

  seed: () => fetchApi<{ message: string }>("/admin/devices/seed", {
    method: "POST",
  }),
};

// ==================== AUTH API ====================

export const authApi = {
  changePassword: (currentPassword: string, newPassword: string) =>
    fetchApi<{ message: string }>("/admin/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ==================== UPLOAD API ====================

export interface UploadResponse {
  url: string;
  filename: string;
  originalName: string;
  size: number;
}

export const uploadApi = {
  uploadImage: async (file: File): Promise<ApiResponse<UploadResponse>> => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API_BASE}/upload/image`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Upload Error:", error);
      return { success: false, error: "فشل في رفع الصورة" };
    }
  },
};
