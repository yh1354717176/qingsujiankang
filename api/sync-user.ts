import sql from '../utils/db';

/**
 * @api {post} /api/sync-user 同步用户信息
 * @apiGroup User
 * @apiParam {String} phoneNumber 手机号
 * @apiParam {String} name 姓名
 * @apiParam {String} gender 性别
 * @apiParam {String} avatar 头像
 */
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { phoneNumber, name, gender, avatar } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ error: 'Missing phone number' });
    }

    try {
        const result = await sql`
            INSERT INTO qingshu_users (phone_number, name, gender, avatar, updated_at)
            VALUES (${phoneNumber}, ${name}, ${gender}, ${avatar}, CURRENT_TIMESTAMP)
            ON CONFLICT (phone_number)
            DO UPDATE SET
                name = EXCLUDED.name,
                gender = EXCLUDED.gender,
                avatar = EXCLUDED.avatar,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;
        res.status(200).json(result[0]);
    } catch (error: any) {
        console.error("Sync User Error:", error);
        res.status(500).json({ error: error.message || 'Sync failed' });
    }
}
