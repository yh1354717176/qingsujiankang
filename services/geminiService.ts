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
      const errorData = await response.json();
      throw new Error(errorData.error || `请求失败: ${response.status}`);
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
  return fetch(`${BASE_URL}/api/sync-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  }).then(res => res.json());
};

/**
 * @description 同步单项餐食记录到云端
 */
export const syncMeal = async (phoneNumber: string, logDate: string, mealType: string, foodItems: any[]) => {
  return fetch(`${BASE_URL}/api/sync-meal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, logDate, mealType, foodItems }),
  }).then(res => res.json());
};

/**
 * @description 获取某日的所有云端数据
 */
export const fetchDayData = async (phoneNumber: string, date: string) => {
  const params = new URLSearchParams({ phoneNumber, date });
  return fetch(`${BASE_URL}/api/fetch-day?${params}`).then(res => res.json());
};

/**
 * @description 获取用户的历史分析报告列表
 */
export const fetchHistory = async (phoneNumber: string) => {
  const params = new URLSearchParams({ phoneNumber });
  return fetch(`${BASE_URL}/api/fetch-history?${params}`).then(res => res.json());
};