import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;

    if (userId === 'admin') {
      return NextResponse.json({
        user: {
          id: 'admin',
          full_name: 'Platform Administrator',
          username: 'admin',
          role: 'ADMIN',
          city: 'New Delhi',
          state: 'National Capital Region',
        },
        wallet: { balance: 999.0, borrowing_limit: -10.0, total_earned: 0, total_spent: 0 },
        unreadNotifications: 3,
      });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

    const teachingSkills = db.prepare(`
      SELECT us.*, s.name as skill_name, s.category, s.icon, sr.final_score, sr.readiness_tier
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      LEFT JOIN skill_readiness sr ON (sr.user_id = us.user_id AND sr.skill_id = us.skill_id)
      WHERE us.user_id = ? AND us.type = 'TEACHING'
    `).all(userId);

    const learningSkills = db.prepare(`
      SELECT us.*, s.name as skill_name, s.category, s.icon
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = ? AND us.type = 'LEARNING'
    `).all(userId);

    const unreadCount = db.prepare(`
      SELECT count(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0
    `).get(userId) as { cnt: number };

    return NextResponse.json({
      user: {
        ...user,
        languages: JSON.parse(user.languages || '[]'),
      },
      wallet,
      teachingSkills,
      learningSkills,
      unreadNotifications: unreadCount?.cnt || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
