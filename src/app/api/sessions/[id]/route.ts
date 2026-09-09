import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { executeAtomicCreditTransfer } from '@/lib/credits';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const session = db.prepare(`
      SELECT s.*,
             l.full_name as learner_name, l.avatar as learner_avatar, l.city as learner_city,
             t.full_name as teacher_name, t.avatar as teacher_avatar, t.city as teacher_city,
             sk.name as skill_name, sk.category as skill_category
      FROM sessions s
      JOIN users l ON s.learner_id = l.id
      JOIN users t ON s.teacher_id = t.id
      JOIN skills sk ON s.skill_id = sk.id
      WHERE s.id = ?
    `).get(sessionId) as any;

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const reviews = db.prepare(`
      SELECT r.*, u.full_name as reviewer_name, u.avatar as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.session_id = ?
    `).all(sessionId);

    const dispute = db.prepare(`
      SELECT * FROM disputes WHERE session_id = ? AND status = 'PENDING'
    `).get(sessionId);

    return NextResponse.json({ session, reviews, dispute });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const body = await request.json();
    const { action, outcomeStatus, teacherOutcome, notes } = body;

    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as any;
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (action === 'TEACHER_COMPLETE') {
      db.prepare(`
        UPDATE sessions 
        SET teacher_confirmation = 1,
            teacher_outcome = ?,
            session_notes = COALESCE(?, session_notes),
            status = CASE WHEN learner_confirmation = 1 THEN 'CONFIRMED' ELSE 'COMPLETED' END
        WHERE id = ?
      `).run(teacherOutcome || 'SUCCESSFUL', notes || null, sessionId);

      // If learner has already confirmed, trigger transfer
      if (session.learner_confirmation === 1) {
        const transferResult = executeAtomicCreditTransfer(sessionId);
        return NextResponse.json({
          success: true,
          message: 'Teacher marked complete. Both confirmed, credits transferred.',
          transferResult,
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Teacher marked session as completed. Awaiting learner confirmation to transfer credits.',
      });
    } else if (action === 'LEARNER_CONFIRM') {
      db.prepare(`
        UPDATE sessions 
        SET learner_confirmation = 1,
            outcome_status = ?,
            status = 'COMPLETED'
        WHERE id = ?
      `).run(outcomeStatus || 'GOAL_ACHIEVED', sessionId);

      // Trigger atomic credit transfer (Section 18-20, 71)
      const transferResult = executeAtomicCreditTransfer(sessionId);

      return NextResponse.json({
        success: true,
        message: 'Learner confirmed session outcome.',
        transferResult,
      });
    } else {
      return NextResponse.json({ error: 'Invalid session action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
