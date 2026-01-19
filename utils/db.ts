import { neon } from '@neondatabase/serverless';

/**
 * @description 获取数据库连接实例
 * 增加防御性编程，防止环境变量缺失导致函数崩溃
 */
const getSql = () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error("环境变量 DATABASE_URL 未定义，请检查云端配置面板！");
        // 返回一个模拟的函数，在调用时再报错，避免顶层崩溃
        return ((strings: any, ...values: any[]) => {
            throw new Error("数据库连接失败：环境变量 DATABASE_URL 未定义。");
        }) as any;
    }

    try {
        return neon(databaseUrl);
    } catch (err) {
        console.error("初始化 Neon 驱动失败:", err);
        return ((strings: any, ...values: any[]) => {
            throw new Error("数据库驱动初始化失败。");
        }) as any;
    }
};

const sql = getSql();

export default sql;
