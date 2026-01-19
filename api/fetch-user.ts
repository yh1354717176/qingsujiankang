import sql from '../utils/db.js';

/**
 * @api {get} /api/fetch-user 获取用户信息
 * @apiGroup User
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
        const user = await sql`
            SELECT phone_number as "phoneNumber", name, gender, avatar 
            FROM qingshu_users 
            WHERE phone_number = ${phoneNumber}
        `;

        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json(user[0]);
    } catch (error: any) {
        console.error("Fetch User Error:", error);
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
}
