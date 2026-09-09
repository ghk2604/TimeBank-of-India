import { NextResponse } from 'next/server';
import { findSkillSwapOpportunities } from '@/lib/matching';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const swaps = findSkillSwapOpportunities(userId);
    return NextResponse.json({ swaps });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
