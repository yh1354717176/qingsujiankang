import sql from '../utils/db.js';

/**
 * @api {post} /api/sync-weight 同步体重记录
 * @apiGroup Weight
 * @apiParam {String} phoneNumber 手机号
 * @apiParam {String} logDate 日期 (YYYY-MM-DD)
 * @apiParam {Number} weight 体重 (kg)
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

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { phoneNumber, logDate, weight } = req.body || {};

    if (!phoneNumber || !logDate || weight === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const users = await sql`SELECT id FROM qingshu_users WHERE phone_number = ${phoneNumber}`;
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = users[0].id;

        const result = await sql`
            INSERT INTO qingshu_weight_logs (user_id, log_date, weight, updated_at)
            VALUES (${userId}, ${logDate}, ${weight}, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, log_date)
            DO UPDATE SET
                weight = EXCLUDED.weight,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        res.status(200).json(result[0] || { success: true });
    } catch (error: any) {
        console.error("Sync Weight Error:", error);
        res.status(500).json({ error: 'Sync failed', details: error.message });
    }
}
