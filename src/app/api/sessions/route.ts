import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const sessions = db.prepare(`
      SELECT s.*,
             l.full_name as learner_name, l.avatar as learner_avatar,
             t.full_name as teacher_name, t.avatar as teacher_avatar,
             sk.name as skill_name, sk.category as skill_category
      FROM sessions s
      JOIN users l ON s.learner_id = l.id
      JOIN users t ON s.teacher_id = t.id
      JOIN skills sk ON s.skill_id = sk.id
      WHERE s.learner_id = ? OR s.teacher_id = ?
      ORDER BY s.created_at DESC
    `).all(userId, userId);

    return NextResponse.json({ sessions }, { headers: NO_CACHE_HEADERS });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
