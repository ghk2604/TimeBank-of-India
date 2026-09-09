import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = `
      SELECT s.*,
             (SELECT count(*) FROM user_skills WHERE skill_id = s.id AND type = 'TEACHING') as teacher_count,
             (SELECT count(*) FROM sessions WHERE skill_id = s.id AND status = 'CONFIRMED') as completed_sessions
      FROM skills s
      WHERE 1=1
    `;
    const params: any[] = [];

    if (category && category !== 'ALL') {
      query += ` AND s.category = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (s.name LIKE ? OR s.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY teacher_count DESC`;

    const skills = db.prepare(query).all(...params) as any[];

    // Fetch instructors for each skill
    const skillsWithInstructors = skills.map(skill => {
      const instructors = db.prepare(`
        SELECT u.id, u.full_name, u.avatar, u.city, u.state, u.languages, u.reputation_score, u.trust_level,
               us.experience_level, us.teaching_level,
               sr.final_score, sr.readiness_tier,
               (SELECT AVG(rating) FROM reviews WHERE reviewed_user_id = u.id) as avg_rating
        FROM user_skills us
        JOIN users u ON us.user_id = u.id
        LEFT JOIN skill_readiness sr ON (sr.user_id = u.id AND sr.skill_id = us.skill_id)
        WHERE us.skill_id = ? AND us.type = 'TEACHING'
      `).all(skill.id) as any[];

      return {
        ...skill,
        instructors: instructors.map(inst => ({
          ...inst,
          languages: JSON.parse(inst.languages || '[]'),
          avg_rating: inst.avg_rating ? Number(inst.avg_rating.toFixed(1)) : 5.0,
        })),
      };
    });

    return NextResponse.json({ skills: skillsWithInstructors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
