import sql from '../utils/db';

/**
 * @api {get} /api/fetch-day 获取单日全量数据
 * @apiGroup Data
 * @apiParam {String} phoneNumber 手机号
 * @apiParam {String} date 日期 (YYYY-MM-DD)
 */
export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { phoneNumber, date } = req.query;

    if (!phoneNumber || !date) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        const users = await sql`SELECT id FROM qingshu_users WHERE phone_number = ${phoneNumber}`;
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = users[0].id;

        // 获取该日所有餐食记录
        const segments = await sql`
            SELECT meal_type, food_items 
            FROM qingshu_meal_logs 
            WHERE user_id = ${userId} AND log_date = ${date}
        `;

        // 获取该日分析结果
        const analysis = await sql`
            SELECT macros, feedback, meal_feedback, plan 
            FROM qingshu_analysis 
            WHERE user_id = ${userId} AND log_date = ${date}
        `;

        res.status(200).json({
            segments,
            analysis: analysis[0] || null
        });
    } catch (error: any) {
        console.error("Fetch Day Error:", error);
        res.status(500).json({ error: error.message || 'Fetch failed' });
    }
}
