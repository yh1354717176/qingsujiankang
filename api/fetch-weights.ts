import sql from '../utils/db.js';

/**
 * @api {get} /api/fetch-weights 获取体重历史
 * @apiGroup Weight
 * @apiParam {String} phoneNumber 手机号
 * @apiParam {Number} limit 获取条数 (默认 30)
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

    const { phoneNumber, limit = 30 } = req.query;

    if (!phoneNumber) {
        return res.status(400).json({ error: 'Missing phoneNumber' });
    }

    try {
        const users = await sql`SELECT id FROM qingshu_users WHERE phone_number = ${phoneNumber}`;
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = users[0].id;

        const weights = await sql`
            SELECT 
                TO_CHAR(log_date, 'YYYY-MM-DD') as date,
                weight
            FROM qingshu_weight_logs 
            WHERE user_id = ${userId}
            ORDER BY log_date ASC
            LIMIT ${limit}
        `;

        res.status(200).json(weights);
    } catch (error: any) {
        console.error("Fetch Weights Error:", error);
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
}
