const API_BASE = "/api";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string | unknown;
  message?: string;
  status?: number;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, error: data.error || `خطأ HTTP: ${response.status}`, status: response.status };
    }

    const data = await response.json();
    return { success: true, ...data };
  } catch (error: any) {
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
  // Public endpoint for customers
  getAllPublic: () => fetchApi<Watch[]>("/watches"),
  
  // Admin endpoints
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
  
  logout: () =>
    fetchApi<{ message: string }>("/admin/auth/logout", {
      method: "POST",
    }),
  
  logoutAll: () =>
    fetchApi<{ message: string }>("/admin/auth/logout-all", {
      method: "POST",
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
        headers: {
          ...getAuthHeaders(),
        },
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
