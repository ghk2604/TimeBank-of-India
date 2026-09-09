import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getJitsiRoomName, getJitsiDomain, JITSI_TOOLBAR_BUTTONS } from '@/lib/jitsi';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Retrieve session and participant details
    const session = db.prepare(`
      SELECT 
        s.*, 
        sk.name as skill_name,
        u_t.full_name as teacher_name,
        u_t.avatar as teacher_avatar,
        u_l.full_name as learner_name,
        u_l.avatar as learner_avatar
      FROM sessions s
      JOIN skills sk ON s.skill_id = sk.id
      JOIN users u_t ON s.teacher_id = u_t.id
      JOIN users u_l ON s.learner_id = u_l.id
      WHERE s.id = ?
    `).get(sessionId) as any;

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check authorization: Must be teacher, learner, or admin
    if (userId && session.teacher_id !== userId && session.learner_id !== userId) {
      const user = db.prepare(`SELECT username FROM users WHERE id = ?`).get(userId) as any;
      if (!user || user.username !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'You are not authorized to access this meeting room' },
          { status: 403 }
        );
      }
    }

    const roomName = getJitsiRoomName(sessionId);
    const domain = getJitsiDomain();

    return NextResponse.json(
      {
        success: true,
        sessionId,
        roomName,
        domain,
        meetingLink: `https://${domain}/${roomName}`,
        skillName: session.skill_name,
        teacherId: session.teacher_id,
        teacherName: session.teacher_name,
        learnerId: session.learner_id,
        learnerName: session.learner_name,
        duration: session.duration,
        status: session.status,
        toolbarButtons: JITSI_TOOLBAR_BUTTONS,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching meeting room config:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
