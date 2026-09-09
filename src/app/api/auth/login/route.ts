import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier, password } = body; // email or username

    if (!identifier) {
      return NextResponse.json({ error: 'Email or username is required' }, { status: 400 });
    }

    // Special Admin Shortcut
    if (identifier.toLowerCase() === 'admin' || identifier.toLowerCase() === 'admin@timebankindia.in') {
      return NextResponse.json({
        success: true,
        user: {
          id: 'admin',
          fullName: 'Platform Admin 🇮🇳',
          username: 'admin',
          email: 'admin@timebankindia.in',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces',
          balance: 999.0,
          borrowingLimit: -10.0,
          role: 'ADMIN',
          unreadNotifications: 3
        }
      });
    }

    // Find in users table
    const user = db.prepare(`
      SELECT u.*, w.balance, w.borrowing_limit
      FROM users u
      LEFT JOIN wallets w ON u.id = w.user_id
      WHERE u.email = ? OR u.username = ?
    `).get(identifier, identifier) as any;

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email or username' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
        city: user.city,
        state: user.state,
        balance: user.balance !== null ? user.balance : 2.0,
        borrowingLimit: user.borrowing_limit !== null ? user.borrowing_limit : -1.0,
        role: user.id === 'user-1' || user.id === 'user-2' ? 'TEACHER' : 'LEARNER',
        reputationScore: user.reputation_score,
        trustLevel: user.trust_level,
        unreadNotifications: 1
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
