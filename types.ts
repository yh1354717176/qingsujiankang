export enum MealType {
  BREAKFAST = '早餐',
  LUNCH = '午餐',
  DINNER = '晚餐',
  SNACK = '加餐'
}

export interface FoodItem {
  id: string;
  name: string;
  description?: string; // e.g., "1 bowl", "200g"
  images?: string[]; // Array of Base64 strings
}

export interface DayLog {
  [MealType.BREAKFAST]: FoodItem[];
  [MealType.LUNCH]: FoodItem[];
  [MealType.DINNER]: FoodItem[];
  [MealType.SNACK]: FoodItem[];
}

export interface MacroData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealFeedback {
  breakfast: string;
  lunch: string;
  dinner: string;
  snack: string;
}

export interface AnalysisResult {
  macros: MacroData;
  feedback: string;
  mealFeedback: MealFeedback;
  plan: string;
}

export interface UserProfile {
  name: string;
  phoneNumber: string;
  gender: 'male' | 'female';
  avatar: string; // Base64 string
}

export type Tab = 'feed' | 'tracker' | 'analysis' | 'profile';