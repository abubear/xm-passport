import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, any> = {};
  
  // Check env vars
  results.hasPostgresUrl = !!process.env.POSTGRES_URL;
  results.hasPostgresUrlNonPooling = !!process.env.POSTGRES_URL_NON_POOLING;
  results.hasDatabaseUrl = !!process.env.DATABASE_URL;
  results.pgUrlPrefix = process.env.POSTGRES_URL?.substring(0, 20) || 'none';
  
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      max: 1,
      connectionTimeoutMillis: 5000,
      ssl: { rejectUnauthorized: false },
    });
    const client = await pool.connect();
    const res = await client.query('SELECT 1 as connected');
    results.queryResult = res.rows;
    client.release();
    await pool.end();
    results.status = 'ok';
  } catch (err: any) {
    results.status = 'error';
    results.error = err?.message || String(err);
    results.errorCode = err?.code || 'none';
  }
  
  return NextResponse.json(results);
}
