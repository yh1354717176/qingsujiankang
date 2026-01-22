import sql from '../utils/db.js';

/**
 * @api {get} /api/fetch-feed 获取社区动态
 * @apiGroup Data
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

    try {
        // 从 qingshu_analysis 中获取最近的动态作为社区内容
        // 这里只是一个演示逻辑，实际可能需要专门的 qingshu_posts 表
        const posts = await sql`
            SELECT 
                a.id,
                u.name as "userName",
                u.avatar,
                TO_CHAR(a.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD HH24:MI') as time,
                a.feedback as content,
                '' as "mealType",
                (a.macros->>'calories')::int as calories,
                0 as likes,
                COALESCE(
                    (
                        SELECT json_agg(img.value)
                        FROM (
                            SELECT json_array_elements(ml.food_items::json) as item
                            FROM qingshu_meal_logs ml
                            WHERE ml.user_id = a.user_id AND ml.log_date = a.log_date
                        ) items,
                        json_array_elements(items.item->'images') img
                        WHERE items.item->'images' IS NOT NULL AND img.value IS NOT NULL
                    ),
                    '[]'::json
                ) as images,
                a.plan as "aiAnalysis",
                a.meal_feedback as "mealFeedback"
            FROM qingshu_analysis a
            JOIN qingshu_users u ON a.user_id = u.id
            ORDER BY a.updated_at DESC
            LIMIT 20
        `;

        res.status(200).json(posts);
    } catch (error: any) {
        console.error("Fetch Feed Error:", error);
        res.status(500).json({ error: error.message || 'Fetch failed' });
    }
}
