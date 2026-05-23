const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      'X-Client-Type': 'web',
      'X-App-Platform': 'pwa',
      ...(options.headers as Record<string, string> || {}),
    },
  });

  const text = await response.text();
  const result = text.trim() ? JSON.parse(text) : null;

  if (response.ok) {
    return { ...result, data: result?.data || result || { success: true }, status: response.status };
  }
  if (response.status === 401) throw { unauthorized: true, status: 401 };
  throw new Error(result?.message || `API Error: ${response.status}`);
};
