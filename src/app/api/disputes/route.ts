import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { executeAtomicCreditTransfer } from '@/lib/credits';

export async function GET() {
  try {
    const disputes = db.prepare(`
      SELECT d.*, s.learning_goal, s.credit_amount, s.status as session_status,
             u.full_name as raised_by_name,
             l.full_name as learner_name,
             t.full_name as teacher_name
      FROM disputes d
      JOIN sessions s ON d.session_id = s.id
      JOIN users u ON d.raised_by = u.id
      JOIN users l ON s.learner_id = l.id
      JOIN users t ON s.teacher_id = t.id
      ORDER BY d.created_at DESC
    `).all();

    return NextResponse.json({ disputes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, raisedBy, reason, description } = body;

    if (!sessionId || !raisedBy || !reason) {
      return NextResponse.json({ error: 'Missing required dispute fields' }, { status: 400 });
    }

    const disputeId = `disp-${Date.now()}`;
    const now = new Date().toISOString();

    const createDisputeTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO disputes (id, session_id, raised_by, reason, description, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
      `).run(disputeId, sessionId, raisedBy, reason, description || 'Dispute raised by user regarding session outcomes.', now);

      // Lock session status to DISPUTED (Pauses credit transfer - Section 65)
      db.prepare(`UPDATE sessions SET status = 'DISPUTED' WHERE id = ?`).run(sessionId);

      // Notify admin / user
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
        VALUES (?, ?, ?, ?, 'DISPUTE', 0, '/admin', ?)
      `).run(
        `notif-${Date.now()}`,
        raisedBy,
        'Dispute Case Filed',
        `Dispute case ${disputeId} logged. Credit transfer has been paused while under administrator review.`,
        now
      );
    });

    createDisputeTx();

    return NextResponse.json({
      success: true,
      message: 'Dispute filed successfully. Credit transfer paused.',
      disputeId
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { disputeId, resolutionAction, resolutionNotes } = body; // 'REFUND' | 'TRANSFER' | 'DISMISS'

    const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(disputeId) as any;
    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (resolutionAction === 'TRANSFER') {
      // Resolve dispute by transferring credits to teacher
      db.prepare(`
        UPDATE disputes SET status = 'RESOLVED', resolution = ? WHERE id = ?
      `).run(`Resolved by Admin: ${resolutionNotes || 'Credits released to teacher after verification.'}`, disputeId);

      db.prepare(`UPDATE sessions SET status = 'COMPLETED', teacher_confirmation = 1, learner_confirmation = 1 WHERE id = ?`).run(dispute.session_id);

      const transferResult = executeAtomicCreditTransfer(dispute.session_id);
      return NextResponse.json({
        success: true,
        message: 'Dispute resolved: Credits transferred to teacher.',
        transferResult
      });
    } else if (resolutionAction === 'REFUND') {
      // Cancel transaction, refund learner, zero credits to teacher
      db.prepare(`
        UPDATE disputes SET status = 'RESOLVED', resolution = ? WHERE id = ?
      `).run(`Resolved by Admin: ${resolutionNotes || 'Session cancelled and credits protected for learner.'}`, disputeId);

      db.prepare(`UPDATE sessions SET status = 'CANCELLED' WHERE id = ?`).run(dispute.session_id);

      return NextResponse.json({
        success: true,
        message: 'Dispute resolved: Session cancelled without credit transfer.'
      });
    } else {
      db.prepare(`
        UPDATE disputes SET status = 'DISMISSED', resolution = ? WHERE id = ?
      `).run(`Dismissed by Admin: ${resolutionNotes || 'Claim dismissed.'}`, disputeId);

      return NextResponse.json({
        success: true,
        message: 'Dispute dismissed.'
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
