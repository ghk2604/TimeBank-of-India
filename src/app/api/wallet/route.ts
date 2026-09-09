import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getCreditRecoverySuggestions } from '@/lib/credits';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (userId === 'admin') {
      const allTx = db.prepare(`
        SELECT t.*,
               tch.full_name as teacher_name,
               lrn.full_name as learner_name
        FROM transactions t
        LEFT JOIN users tch ON t.teacher_id = tch.id
        LEFT JOIN users lrn ON t.learner_id = lrn.id
        ORDER BY t.created_at DESC
      `).all();

      const stats = db.prepare(`
        SELECT count(*) as total_tx,
               SUM(credit_amount) as total_volume
        FROM transactions
      `).get() as any;

      return NextResponse.json({
        wallet: { balance: 999.0, borrowing_limit: -10.0, total_earned: stats?.total_volume || 0, total_spent: 0 },
        transactions: allTx,
        recovery: { needsRecovery: false, deficit: 0, recommendations: [] }
      });
    }

    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId) as any;
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const transactions = db.prepare(`
      SELECT t.*,
             tch.full_name as teacher_name,
             lrn.full_name as learner_name
      FROM transactions t
      LEFT JOIN users tch ON t.teacher_id = tch.id
      LEFT JOIN users lrn ON t.learner_id = lrn.id
      WHERE t.teacher_id = ? OR t.learner_id = ?
      ORDER BY t.created_at DESC
    `).all(userId, userId);

    const recovery = getCreditRecoverySuggestions(userId);

    // Calculate borrowed credits if balance is negative
    const borrowedCredits = wallet.balance < 0 ? Math.abs(wallet.balance) : 0;
    const availableCredits = wallet.balance;

    return NextResponse.json({
      wallet: {
        ...wallet,
        borrowedCredits,
        availableCredits
      },
      transactions,
      recovery
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
