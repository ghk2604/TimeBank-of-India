import { NextResponse } from 'next/server';
import { getKnowledgeImpact } from '@/lib/matching';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const impact = getKnowledgeImpact(userId);
    return NextResponse.json({ impact });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
