import sql from '../utils/db.js';

/**
 * @api {get} /api/fetch-history 获取历史分析记录列表
 * @apiGroup Data
 * @apiParam {String} phoneNumber 手机号
 */
export default async function handler(req: any, res: any) {
    // Add CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

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
            return res.status(200).json([]); // Return empty array instead of 404 for new users
        }
        const userId = users[0].id;

        const history = await sql`
            SELECT TO_CHAR(log_date, 'YYYY-MM-DD') as date, (macros->>'calories')::int as calories
            FROM qingshu_analysis
            WHERE user_id = ${userId}
            ORDER BY log_date DESC
            LIMIT 30
        `;

        res.status(200).json(history);
    } catch (error: any) {
        console.error("Fetch History Detailed Error:", error);
        res.status(500).json({
            error: 'Fetch failed',
            details: error.message
        });
    }
}
