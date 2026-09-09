import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { checkAndExpireRequests, calculateCreditCost } from '@/lib/credits';

export async function GET(request: Request) {
  try {
    // Run automated 24-hour expiry check
    checkAndExpireRequests();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const requests = db.prepare(`
      SELECT r.*,
             l.full_name as learner_name, l.avatar as learner_avatar,
             t.full_name as teacher_name, t.avatar as teacher_avatar,
             s.name as skill_name, s.category as skill_category
      FROM learning_requests r
      JOIN users l ON r.learner_id = l.id
      JOIN users t ON r.teacher_id = t.id
      JOIN skills s ON r.skill_id = s.id
      WHERE r.learner_id = ? OR r.teacher_id = ?
      ORDER BY r.created_at DESC
    `).all(userId, userId);

    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { learnerId, teacherId, skillId, learningGoal, expectedOutcome, preferredDate, preferredTime, duration } = body;

    if (!learnerId || !teacherId || !skillId || !learningGoal || !duration) {
      return NextResponse.json({ error: 'Missing required request parameters' }, { status: 400 });
    }

    const creditCost = calculateCreditCost(Number(duration));
    const now = new Date();
    const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // exactly 24 hours
    const reqId = `req-${Date.now()}`;

    // Note: Per Section 9 & 42, credits are NOT deducted upon booking request creation!
    db.prepare(`
      INSERT INTO learning_requests (id, learner_id, teacher_id, skill_id, learning_goal, expected_outcome, preferred_date, preferred_time, duration, credit_cost, status, response_deadline, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?)
    `).run(
      reqId, learnerId, teacherId, skillId, learningGoal, expectedOutcome || 'Understand core fundamentals and apply concepts.',
      preferredDate || 'Tomorrow', preferredTime || '6:00 PM - 7:00 PM', duration, creditCost, deadline, now.toISOString()
    );

    // Notify teacher
    const learner = db.prepare('SELECT full_name FROM users WHERE id = ?').get(learnerId) as any;
    const skill = db.prepare('SELECT name FROM skills WHERE id = ?').get(skillId) as any;

    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
      VALUES (?, ?, ?, ?, 'REQUEST', 0, '/dashboard', ?)
    `).run(
      `notif-${Date.now()}`,
      teacherId,
      'New Learning Request (24h Window)',
      `${learner?.full_name} has requested a ${duration}-min session for "${skill?.name}". Please accept or decline within 24 hours.`,
      now.toISOString()
    );

    return NextResponse.json({
      success: true,
      requestId: reqId,
      message: 'Learning request submitted successfully. Teacher has 24 hours to respond.',
      responseDeadline: deadline,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { requestId, action } = body; // action: 'ACCEPT' | 'REJECT'

    const req = db.prepare(`
      SELECT r.*, s.name as skill_name, l.full_name as learner_name, t.full_name as teacher_name
      FROM learning_requests r
      JOIN skills s ON r.skill_id = s.id
      JOIN users l ON r.learner_id = l.id
      JOIN users t ON r.teacher_id = t.id
      WHERE r.id = ?
    `).get(requestId) as any;

    if (!req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (req.status !== 'PENDING') {
      return NextResponse.json({ error: `Request cannot be modified: current status is ${req.status}` }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === 'ACCEPT') {
      const sessionId = `ses-${Date.now()}`;
      const meetingLink = `https://timebankindia.in/room/${sessionId}`;

      const acceptTx = db.transaction(() => {
        db.prepare(`UPDATE learning_requests SET status = 'ACCEPTED' WHERE id = ?`).run(requestId);

        db.prepare(`
          INSERT INTO sessions (id, request_id, learner_id, teacher_id, skill_id, learning_goal, expected_outcome, start_time, end_time, duration, credit_amount, status, learner_confirmation, teacher_confirmation, meeting_link, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SCHEDULED', 0, 0, ?, ?)
        `).run(
          sessionId, requestId, req.learner_id, req.teacher_id, req.skill_id,
          req.learning_goal, req.expected_outcome, req.preferred_date + ' ' + req.preferred_time,
          req.preferred_date + ' ' + req.preferred_time, req.duration, req.credit_cost,
          meetingLink, now
        );

        // Notify learner
        db.prepare(`
          INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
          VALUES (?, ?, ?, ?, 'SESSION', 0, '/sessions', ?)
        `).run(
          `notif-${Date.now()}`,
          req.learner_id,
          'Learning Request Accepted! 🎓',
          `Teacher ${req.teacher_name} has accepted your session on "${req.skill_name}". Your Learning Goal Contract is active!`,
          now
        );
      });

      acceptTx();

      return NextResponse.json({
        success: true,
        message: 'Request accepted and session scheduled.',
        sessionId,
      });
    } else if (action === 'REJECT') {
      db.prepare(`UPDATE learning_requests SET status = 'REJECTED' WHERE id = ?`).run(requestId);

      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
        VALUES (?, ?, ?, ?, 'REQUEST', 0, '/marketplace', ?)
      `).run(
        `notif-${Date.now()}`,
        req.learner_id,
        'Learning Request Declined',
        `Teacher ${req.teacher_name} is currently unavailable for "${req.skill_name}". You can explore other verified teachers anytime. Zero credits were debited.`,
        now
      );

      return NextResponse.json({
        success: true,
        message: 'Request declined. Learner notified.',
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
