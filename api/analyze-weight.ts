import { GoogleGenAI, Type, Schema } from "@google/genai";
import sql from "../utils/db.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || "" });

const weightAnalysisSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A summary of the weight trend and progress in Chinese.",
        },
        status: {
            type: Type.STRING,
            description: "Current weight loss status (e.g., 'Progressing', 'Stagnant', 'Rebounding') in Chinese.",
        },
        advice: {
            type: Type.STRING,
            description: "Actionable advice based on the weight trend in Chinese.",
        },
    },
    required: ["summary", "status", "advice"],
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

    const { weights, phoneNumber } = req.body || {};

    if (!weights || !Array.isArray(weights) || weights.length < 2) {
        return res.status(400).json({ error: "需至少两条体重记录才能进行分析。" });
    }

    // 构造体重趋势描述
    const weightTrendStr = weights.map((w: any) => `${w.date}: ${w.weight}kg`).join("\n");

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash", // 使用性价比高的模型
            contents: `You are a professional fitness and weight loss consultant. 
      Analyze the following weight trend data. 
      Identify if the user is losing weight, maintaining, or gaining.
      Provide motivating and scientific feedback.
      Output in simplified Chinese (zh-CN).
      
      ${weightTrendStr}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: weightAnalysisSchema,
                systemInstruction: "You are a professional weight loss coach focusing on data-driven insights. Be encouraging but honest about the trends."
            },
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        const result = JSON.parse(text);

        res.status(200).json(result);
    } catch (error: any) {
        console.error("Weight Analysis Error:", error);
        res.status(500).json({
            error: 'AI analysis failed',
            details: error.message
        });
    }
}
