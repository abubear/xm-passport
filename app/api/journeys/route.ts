import { NextResponse } from 'next/server';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const token = getAuthToken();
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const journeys = await query('SELECT * FROM collection_journeys');
    const userCards = await query('SELECT card_code FROM cards WHERE owner_id = $1', [payload.id]) as { card_code: string }[];
    const userCardCodes = new Set(userCards.map((c: any) => c.card_code));
    const userJourneys = await query('SELECT * FROM user_journeys WHERE user_id = $1', [payload.id]);

    const enriched = (journeys as any[]).map((j: any) => {
      const required: string[] = JSON.parse(j.required_items || '[]');
      const collected = required.filter((c: string) => userCardCodes.has(c));
      const uj = (userJourneys as any[]).find((uj: any) => uj.journey_id === j.id);
      return {
        ...j,
        required_items: required,
        collected,
        progress: Math.round((collected.length / required.length) * 100),
        completed: uj?.completed === 1,
      };
    });

    return NextResponse.json({ journeys: enriched });
  } catch (err) {
    console.error('Journeys error:', err);
    return NextResponse.json({ error: 'Failed to fetch journeys' }, { status: 500 });
  }
}
