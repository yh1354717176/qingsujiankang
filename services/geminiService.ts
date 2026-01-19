import { DayLog, AnalysisResult } from "../types";

export const analyzeMeals = async (log: DayLog): Promise<AnalysisResult> => {
  try {
    const response = await fetch('https://qingsu.yazhu.cyou/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ log }),
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