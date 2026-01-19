import { GoogleGenAI, Type, Schema } from "@google/genai";
import sql from "../utils/db.js";

// Inline types to avoid Vercel module resolution issues
enum MealType {
    BREAKFAST = '早餐',
    LUNCH = '午餐',
    DINNER = '晚餐',
    SNACK = '加餐'
}

interface FoodItem {
    id: string;
    name: string;
    description?: string;
    images?: string[];
}

interface DayLog {
    [MealType.BREAKFAST]: FoodItem[];
    [MealType.LUNCH]: FoodItem[];
    [MealType.DINNER]: FoodItem[];
    [MealType.SNACK]: FoodItem[];
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || "" });

const analysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        macros: {
            type: Type.OBJECT,
            properties: {
                calories: { type: Type.NUMBER, description: "Estimated total calories for the day" },
                protein: { type: Type.NUMBER, description: "Estimated protein in grams" },
                carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams" },
                fat: { type: Type.NUMBER, description: "Estimated fat in grams" },
            },
            required: ["calories", "protein", "carbs", "fat"],
        },
        feedback: {
            type: Type.STRING,
            description: "Overall daily analysis of eating habits in Chinese.",
        },
        mealFeedback: {
            type: Type.OBJECT,
            description: "Specific critique and nutritional feedback for each meal type in Chinese. If a meal was skipped, mention the impact.",
            properties: {
                breakfast: { type: Type.STRING },
                lunch: { type: Type.STRING },
                dinner: { type: Type.STRING },
                snack: { type: Type.STRING }
            },
            required: ["breakfast", "lunch", "dinner", "snack"]
        },
        plan: {
            type: Type.STRING,
            description: "A specific, actionable diet plan for tomorrow to help with weight loss. Use Markdown. In Chinese.",
        },
    },
    required: ["macros", "feedback", "mealFeedback", "plan"],
};

export default async function handler(req: any, res: any) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { log, phoneNumber, logDate } = (req.body || {}) as { log: DayLog, phoneNumber?: string, logDate?: string };

    if (!log) {
        return res.status(400).json({ error: 'Missing log data' });
    }

    // Construct a readable string of the meals
    let mealString = "Here is what I ate today:\n";
    let hasFood = false;

    Object.values(MealType).forEach((type) => {
        const items = log[type] || [];
        if (items.length > 0) {
            hasFood = true;
            mealString += `- ${type}: ${items.map(i => `${i.name} (${i.description || ''})`).join(", ")}\n`;
        } else {
            mealString += `- ${type}: (Skipped/Empty)\n`;
        }
    });

    if (!hasFood) {
        return res.status(400).json({ error: "请至少记录一项食物来进行分析。" });
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro", // 使用更稳健的 1.5 Pro 或根据环境切换至 gemini-3-pro
            contents: `You are a professional nutritionist and weight loss coach. 
      Analyze the following daily food log. 
      Estimate the nutritional values conservatively.
      Provide output in simplified Chinese (zh-CN).
      
      ${mealString}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
                systemInstruction: "You are a strict but helpful diet coach. Your goal is to help the user lose weight healthily. Provide specific feedback for every meal logged, and advice for skipped meals."
            },
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        const result = JSON.parse(text);

        // 如果提供了手机号和日期，则持久化到数据库
        if (phoneNumber && logDate) {
            try {
                if (!process.env.DATABASE_URL) {
                    throw new Error("DATABASE_URL is not configured on the server");
                }
                const users = await sql`SELECT id FROM qingshu_users WHERE phone_number = ${phoneNumber}`;
                if (users.length > 0) {
                    const userId = users[0].id;
                    await sql`
                        INSERT INTO qingshu_analysis (user_id, log_date, macros, feedback, meal_feedback, plan)
                        VALUES (${userId}, ${logDate}, ${JSON.stringify(result.macros)}, ${result.feedback}, ${JSON.stringify(result.mealFeedback)}, ${result.plan})
                        ON CONFLICT (user_id, log_date)
                        DO UPDATE SET
                            macros = EXCLUDED.macros,
                            feedback = EXCLUDED.feedback,
                            meal_feedback = EXCLUDED.meal_feedback,
                            plan = EXCLUDED.plan
                    `;
                }
            } catch (dbError: any) {
                console.error("DB Persistence Error:", dbError);
                // 即使数据库失败，也返回 AI 结果，但不消失错误详情
                result._dbError = dbError.message;
            }
        }

        res.status(200).json(result);
    } catch (error: any) {
        console.error("Gemini Analysis Detailed Error:", error);
        res.status(500).json({
            error: 'AI analysis failed',
            details: error.message,
            hint: "Check if GEMINI_API_KEY and DATABASE_URL are set in your deployment environment."
        });
    }
}
