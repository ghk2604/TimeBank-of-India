import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const keys = db.prepare('SELECT * FROM access_keys ORDER BY created_at DESC LIMIT 20').all();
    return NextResponse.json({ keys });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userName, email, institution, purpose } = body;

    if (!userName || !email) {
      return NextResponse.json({ error: 'Name and email are required to request an access key' }, { status: 400 });
    }

    // Check if user already requested
    const existing = db.prepare('SELECT * FROM access_keys WHERE email = ?').get(email) as any;
    if (existing) {
      return NextResponse.json({
        success: true,
        isExisting: true,
        keyCode: existing.key_code,
        message: `An active access key already exists for this email: ${existing.key_code}`,
        key: existing
      });
    }

    // Generate unique Indian TimeBank access key
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const keyCode = `TBI-KEY-2026-${randomSuffix}`;
    const id = `key-${Date.now()}`;
    const now = new Date().toISOString();
    const starterCredits = purpose === 'MENTOR_EARLY_ACCESS' ? 2.0 : 1.5;

    db.prepare(`
      INSERT INTO access_keys (id, user_name, email, institution, purpose, key_code, status, starter_credits, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'APPROVED', ?, ?)
    `).run(
      id,
      userName,
      email,
      institution || 'Independent Indian Learner / Educator',
      purpose || 'STUDENT_BETA',
      keyCode,
      starterCredits,
      now
    );

    return NextResponse.json({
      success: true,
      keyCode,
      starterCredits,
      message: `Access Key generated successfully! Use this key during registration to claim +${starterCredits} bonus Time Credits and an upgraded trust limit.`,
      key: {
        id,
        userName,
        email,
        institution,
        purpose,
        keyCode,
        status: 'APPROVED',
        starterCredits,
        createdAt: now
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
