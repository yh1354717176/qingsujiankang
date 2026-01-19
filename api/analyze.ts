import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DayLog, MealType } from "../types";

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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { log } = req.body as { log: DayLog };

    if (!log) {
        return res.status(400).json({ error: 'Missing log data' });
    }

    // Construct a readable string of the meals
    let mealString = "Here is what I ate today:\n";
    let hasFood = false;

    Object.values(MealType).forEach((type) => {
        const items = log[type];
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
            model: "gemini-1.5-pro",
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

        res.status(200).json(JSON.parse(text));
    } catch (error: any) {
        console.error("Gemini Analysis Error:", error);
        res.status(500).json({ error: error.message || 'AI analysis failed' });
    }
}
