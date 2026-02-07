import { getAccessToken } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/api";

export type ApiError = {
  status: number;
  message: string;
};

export const apiFetch = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAccessToken();

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {})
  };

  // Only set Content-Type for requests with a body
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    // Prevent browser caching for polling requests
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message ?? response.statusText;
    throw { status: response.status, message } as ApiError;
  }

  return response.json();
};

export const uploadImage = async (file: File) => {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE}/uploads/images`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.message ?? response.statusText;
    throw { status: response.status, message } as ApiError;
  }

  return response.json() as Promise<{
    image: { id: string; storagePath: string };
    previewUrl: string;
  }>;
};
