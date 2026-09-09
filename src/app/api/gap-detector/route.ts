import { NextResponse } from 'next/server';
import { GAP_DETECTOR_TRACKS } from '@/lib/matching';
import db from '@/lib/db';

export async function GET() {
  return NextResponse.json({ tracks: GAP_DETECTOR_TRACKS });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { trackId, answers } = body; // answers: { [qId: string]: boolean }

    const track = GAP_DETECTOR_TRACKS.find(t => t.id === trackId);
    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    const identifiedGaps: string[] = [];
    let correctCount = 0;

    for (const q of track.questions) {
      if (answers[q.id] === true) {
        correctCount++;
      } else {
        identifiedGaps.push(q.skillPrereq);
      }
    }

    const totalQuestions = track.questions.length;
    const proficiencyPercentage = Math.round((correctCount / totalQuestions) * 100);

    let evaluatedLevel = 'Beginner';
    let startingSkill = track.questions[0].skillPrereq;

    if (proficiencyPercentage >= 80) {
      evaluatedLevel = 'Advanced Ready';
      startingSkill = track.targetSkill;
    } else if (proficiencyPercentage >= 50) {
      evaluatedLevel = 'Intermediate Developing';
      startingSkill = identifiedGaps[0] || track.targetSkill;
    } else {
      evaluatedLevel = 'Foundational Beginner';
      startingSkill = identifiedGaps[0] || track.questions[0].skillPrereq;
    }

    // Find recommended teachers in DB for the starting skill
    const recommendedTeachers = db.prepare(`
      SELECT u.id, u.full_name, u.avatar, u.city, u.reputation_score, u.trust_level,
             s.name as skill_name,
             (SELECT AVG(rating) FROM reviews WHERE reviewed_user_id = u.id) as avg_rating
      FROM users u
      JOIN user_skills us ON us.user_id = u.id AND us.type = 'TEACHING'
      JOIN skills s ON us.skill_id = s.id
      WHERE s.name LIKE ? OR s.name LIKE ?
      LIMIT 3
    `).all(`%${startingSkill.split(' ')[0]}%`, `%${track.targetSkill.split(' ')[0]}%`);

    return NextResponse.json({
      trackTitle: track.title,
      targetSkill: track.targetSkill,
      proficiencyPercentage,
      evaluatedLevel,
      identifiedGaps,
      startingSkill,
      recommendedTeachers,
      advice: identifiedGaps.length === 0
        ? `You have a rock-solid foundation! You are ready to dive directly into ${track.targetSkill}.`
        : `We recommend mastering ${startingSkill} first to build confident muscle memory before tackling ${track.targetSkill}.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
