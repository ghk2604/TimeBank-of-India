import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, reviewerId, reviewedUserId, rating, knowledgeRating, teachingRating, communicationRating, punctualityRating, review } = body;

    if (!sessionId || !reviewerId || !reviewedUserId || !rating) {
      return NextResponse.json({ error: 'Missing required review fields' }, { status: 400 });
    }

    const reviewId = `rev-${Date.now()}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO reviews (id, session_id, reviewer_id, reviewed_user_id, rating, knowledge_rating, teaching_rating, communication_rating, punctuality_rating, review, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reviewId, sessionId, reviewerId, reviewedUserId, rating,
      knowledgeRating || rating, teachingRating || rating, communicationRating || rating, punctualityRating || rating,
      review || 'Great learning exchange session!', now
    );

    // Update user's reputation score dynamically
    const avgScore = db.prepare('SELECT AVG(rating) as avg_r FROM reviews WHERE reviewed_user_id = ?').get(reviewedUserId) as any;
    if (avgScore && avgScore.avg_r) {
      const newReputation = Math.min(100, Math.round(Number(avgScore.avg_r) * 20));
      db.prepare('UPDATE users SET reputation_score = ? WHERE id = ?').run(newReputation, reviewedUserId);
    }

    return NextResponse.json({ success: true, message: 'Review submitted successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
