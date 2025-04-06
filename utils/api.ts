/**
 * 前端API请求工具
 * 用于处理统一的API响应格式
 */

/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/**
 * 处理API响应
 * @param response Fetch响应
 * @returns 处理后的API响应
 */
export async function handleApiResponse<T = any>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    throw new Error(`HTTP 错误: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  // 检查响应格式是否正确
  if (!data || typeof data !== 'object' || !('code' in data)) {
    throw new Error('无效的API响应格式');
  }
  
  return data as ApiResponse<T>;
}

/**
 * 获取API响应数据
 * @param url API URL
 * @param options Fetch选项
 * @returns API响应数据
 */
export async function fetchApi<T = any>(
  url: string, 
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options);
  const apiResponse = await handleApiResponse<T>(response);
  
  if (apiResponse.code !== 200) {
    throw new Error(apiResponse.message || '请求失败');
  }
  
  return apiResponse.data;
}

/**
 * 发送GET请求
 * @param url API URL
 * @param params 查询参数
 * @returns API响应数据
 */
export async function apiGet<T = any>(url: string, params?: Record<string, any>): Promise<T> {
  // 构建URL查询参数
  const queryParams = params 
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([_, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)])
      ).toString()
    : '';
  
  return fetchApi<T>(`${url}${queryParams}`);
}

/**
 * 发送POST请求
 * @param url API URL
 * @param data 请求数据
 * @returns API响应数据
 */
export async function apiPost<T = any>(url: string, data?: any): Promise<T> {
  return fetchApi<T>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  });
}

/**
 * 发送PUT请求
 * @param url API URL
 * @param data 请求数据
 * @returns API响应数据
 */
export async function apiPut<T = any>(url: string, data?: any): Promise<T> {
  return fetchApi<T>(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  });
}

/**
 * 发送DELETE请求
 * @param url API URL
 * @returns API响应数据
 */
export async function apiDelete<T = any>(url: string): Promise<T> {
  return fetchApi<T>(url, {
    method: 'DELETE'
  });
} 