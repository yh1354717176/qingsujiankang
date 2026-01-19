import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error("CRITICAL ERROR: DATABASE_URL is not defined in environment variables.");
}

const sql = neon(databaseUrl || '');

export default sql;
