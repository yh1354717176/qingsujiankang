import sql from '../utils/db';

/**
 * @api {get} /api/fetch-history 获取历史分析记录列表
 * @apiGroup Data
 * @apiParam {String} phoneNumber 手机号
 */
export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { phoneNumber } = req.query;

    if (!phoneNumber) {
        return res.status(400).json({ error: 'Missing phone number' });
    }

    try {
        const users = await sql`SELECT id FROM qingshu_users WHERE phone_number = ${phoneNumber}`;
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = users[0].id;

        const history = await sql`
            SELECT log_date as date, (macros->>'calories')::int as calories
            FROM qingshu_analysis
            WHERE user_id = ${userId}
            ORDER BY log_date DESC
            LIMIT 30
        `;

        res.status(200).json(history);
    } catch (error: any) {
        console.error("Fetch History Error:", error);
        res.status(500).json({ error: error.message || 'Fetch failed' });
    }
}
