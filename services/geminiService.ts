import { DayLog, AnalysisResult, UserProfile } from "../types";

const BASE_URL = 'https://qingsu.yazhu.cyou';

/**
 * @description 发送记录给 AI 进行分析并持久化
 */
export const analyzeMeals = async (log: DayLog, user?: UserProfile | null, date?: string): Promise<AnalysisResult> => {
  try {
    const response = await fetch(`${BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        log,
        phoneNumber: user?.phoneNumber,
        logDate: date
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        // 如果服务器返回的不是 JSON（比如 Vercel 的崩溃页面）
        throw new Error(`服务器内部错误 (500)\n\n原因: ${errorText.substring(0, 100)}...\n\n排查建议: 请检查云端项目的 Environment Variables 是否已正确配置 DATABASE_URL。`);
      }

      const detailedError = errorData.details ? `\n详情: ${errorData.details}` : "";
      const hint = errorData.hint ? `\n提示: ${errorData.hint}` : "";
      throw new Error((errorData.error || "请求失败") + detailedError + hint);
    }

    const data = await response.json();
    return data as AnalysisResult;
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

/**
 * @description 同步用户信息到云端
 */
export const syncUser = async (user: UserProfile) => {
  const response = await fetch(`${BASE_URL}/api/sync-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.error || `同步用户失败: ${response.status}`);
    } catch (e) {
      throw new Error(`服务器同步失败 (500)\n\n原因: ${errorText.substring(0, 100)}...`);
    }
  }
  return response.json();
};

/**
 * @description 同步单项餐食记录到云端
 */
export const syncMeal = async (phoneNumber: string, logDate: string, mealType: string, foodItems: any[]) => {
  const response = await fetch(`${BASE_URL}/api/sync-meal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, logDate, mealType, foodItems }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.error || `同步餐食失败: ${response.status}`);
    } catch (e) {
      throw new Error(`服务器餐食同步失败 (500)\n\n原因: ${errorText.substring(0, 100)}...`);
    }
  }
  return response.json();
};

/**
 * @description 获取某日的所有云端数据
 */
export const fetchDayData = async (phoneNumber: string, date: string) => {
  const params = new URLSearchParams({ phoneNumber, date });
  const response = await fetch(`${BASE_URL}/api/fetch-day?${params}`);
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.error || `获取数据失败: ${response.status}`);
    } catch (e) {
      throw new Error(`服务器数据拉取失败 (500)`);
    }
  }
  return response.json();
};

/**
 * @description 获取用户的历史分析报告列表
 */
export const fetchHistory = async (phoneNumber: string) => {
  const params = new URLSearchParams({ phoneNumber });
  const response = await fetch(`${BASE_URL}/api/fetch-history?${params}`);
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.error || `获取历史失败: ${response.status}`);
    } catch (e) {
      throw new Error(`服务器历史拉取失败 (500)`);
    }
  }
  return response.json();
};

/**
 * @description 获取社区动态列表
 */
export const fetchFeed = async () => {
  const response = await fetch(`${BASE_URL}/api/fetch-feed`);
  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorData = JSON.parse(errorText);
      throw new Error(errorData.error || `获取社区失败: ${response.status}`);
    } catch (e) {
      throw new Error(`服务器社区拉取失败 (500)`);
    }
  }
  return response.json();
};