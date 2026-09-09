import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const userStats = db.prepare(`
      SELECT 
        (SELECT count(*) FROM users) as total_users,
        (SELECT count(DISTINCT user_id) FROM user_skills WHERE type = 'TEACHING') as total_teachers,
        (SELECT count(DISTINCT user_id) FROM user_skills WHERE type = 'LEARNING') as total_learners,
        (SELECT count(*) FROM sessions) as total_sessions,
        (SELECT count(*) FROM sessions WHERE status = 'CONFIRMED') as completed_sessions,
        (SELECT count(*) FROM disputes WHERE status = 'PENDING') as pending_disputes,
        (SELECT count(*) FROM transactions) as total_transactions,
        (SELECT COALESCE(SUM(credit_amount), 0) FROM transactions) as total_credits_circulated
    `).get() as any;

    const recentTransactions = db.prepare(`
      SELECT t.*, 
             tch.full_name as teacher_name,
             lrn.full_name as learner_name
      FROM transactions t
      LEFT JOIN users tch ON t.teacher_id = tch.id
      LEFT JOIN users lrn ON t.learner_id = lrn.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `).all();

    const popularSkills = db.prepare(`
      SELECT s.name, s.category,
             (SELECT count(*) FROM user_skills WHERE skill_id = s.id AND type = 'LEARNING') as learners_seeking,
             (SELECT count(*) FROM user_skills WHERE skill_id = s.id AND type = 'TEACHING') as teachers_available,
             (SELECT count(*) FROM sessions WHERE skill_id = s.id AND status = 'CONFIRMED') as sessions_held
      FROM skills s
      ORDER BY sessions_held DESC
      LIMIT 6
    `).all();

    const pendingDisputes = db.prepare(`
      SELECT d.*, s.learning_goal, s.credit_amount,
             u.full_name as raised_by_name,
             l.full_name as learner_name,
             t.full_name as teacher_name
      FROM disputes d
      JOIN sessions s ON d.session_id = s.id
      JOIN users u ON d.raised_by = u.id
      JOIN users l ON s.learner_id = l.id
      JOIN users t ON s.teacher_id = t.id
      WHERE d.status = 'PENDING'
    `).all();

    return NextResponse.json({
      stats: userStats,
      recentTransactions,
      popularSkills,
      pendingDisputes
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
