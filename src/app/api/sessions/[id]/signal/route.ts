import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const { type, fromUserId, payload } = await req.json();

    if (!type || !fromUserId) {
      return NextResponse.json({ error: 'Missing type or fromUserId' }, { status: 400 });
    }

    const now = Date.now();
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

    // Insert new signal
    db.prepare(`
      INSERT INTO meet_signals (session_id, from_user_id, type, payload, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(sessionId, fromUserId, type, payloadStr, now);

    // Clean up signals older than 5 minutes for performance
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    db.prepare(`DELETE FROM meet_signals WHERE created_at < ?`).run(fiveMinutesAgo);

    return NextResponse.json({ success: true, timestamp: now });
  } catch (error: any) {
    console.error('Signal POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    const { searchParams } = new URL(req.url);
    const since = parseInt(searchParams.get('since') || '0', 10);
    const excludeUserId = searchParams.get('excludeUserId') || '';

    const signals = db.prepare(`
      SELECT id, session_id, from_user_id, type, payload, created_at
      FROM meet_signals
      WHERE session_id = ? 
        AND created_at > ?
        AND (from_user_id != ? OR ? = '')
      ORDER BY created_at ASC
    `).all(sessionId, since, excludeUserId, excludeUserId) as any[];

    const parsedSignals = signals.map(sig => {
      let data = sig.payload;
      try {
        data = JSON.parse(sig.payload);
      } catch (e) {}
      return {
        id: sig.id,
        type: sig.type,
        fromUserId: sig.from_user_id,
        payload: data,
        createdAt: sig.created_at,
      };
    });

    return NextResponse.json({ signals: parsedSignals });
  } catch (error: any) {
    console.error('Signal GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
