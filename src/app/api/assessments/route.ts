import { NextResponse } from 'next/server';
import db from '@/lib/db';

const SKILL_QUIZZES: Record<string, any> = {
  'skill-1': {
    skillId: 'skill-1',
    skillName: 'Python Programming',
    questions: [
      {
        id: 'py-1',
        question: 'What is the time complexity of looking up a key in a standard Python dictionary on average?',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
        correctIndex: 0,
        explanation: 'Python dictionaries are implemented using hash tables with average O(1) time complexity.'
      },
      {
        id: 'py-2',
        question: 'Which keyword creates a generator function in Python?',
        options: ['return', 'yield', 'async', 'generator'],
        correctIndex: 1,
        explanation: 'The yield statement suspends function execution and yields a value, turning it into a generator.'
      },
      {
        id: 'py-3',
        question: 'What does the *args parameter allow in a Python function definition?',
        options: [
          'Pass a variable number of keyword arguments',
          'Pass a variable number of non-keyword positional arguments',
          'Force keyword-only arguments',
          'Import external modules'
        ],
        correctIndex: 1,
        explanation: '*args receives excess positional arguments as a tuple.'
      },
      {
        id: 'py-4',
        question: 'How do you create a shallow copy vs deep copy in Python?',
        options: [
          'copy.copy() for shallow, copy.deepcopy() for deep',
          'Using the assignment operator (=)',
          'Only with list slicing [:]',
          'Python does not support deep copies'
        ],
        correctIndex: 0,
        explanation: 'copy.copy() copies references, while copy.deepcopy() recursively clones nested objects.'
      }
    ]
  },
  'skill-2': {
    skillId: 'skill-2',
    skillName: 'UI/UX Design',
    questions: [
      {
        id: 'ux-1',
        question: 'What does Hick’s Law state regarding user experience?',
        options: [
          'The time it takes to make a decision increases with the number and complexity of choices',
          'Users spend most of their time on other websites',
          'Touch targets must be at least 48x48 pixels',
          'Users read in an F-shaped pattern'
        ],
        correctIndex: 0,
        explanation: 'Hick’s Law describes the cognitive load: more choices lead to longer decision times.'
      },
      {
        id: 'ux-2',
        question: 'In Figma, what feature allows dynamic responsive resizing of card components?',
        options: ['Auto-layout', 'Vector Pen', 'Smart Animate', 'Boolean Groups'],
        correctIndex: 0,
        explanation: 'Auto-layout creates responsive buttons, lists, and containers that adapt to content.'
      },
      {
        id: 'ux-3',
        question: 'What is the recommended minimum contrast ratio for normal text under WCAG AA standards?',
        options: ['3:1', '4.5:1', '7:1', '2:1'],
        correctIndex: 1,
        explanation: 'WCAG 2.1 Level AA requires a contrast ratio of at least 4.5:1 for normal body text.'
      }
    ]
  },
  'skill-3': {
    skillId: 'skill-3',
    skillName: 'Web Development (React & Next.js)',
    questions: [
      {
        id: 'react-1',
        question: 'What is the primary benefit of React Server Components in Next.js App Router?',
        options: [
          'Zero client-side JavaScript bundle for server-rendered code and direct backend data access',
          'Automatic CSS injection',
          'Replacing all client hooks',
          'Eliminating HTML completely'
        ],
        correctIndex: 0,
        explanation: 'RSC executes on the server, streaming HTML with zero client JavaScript overhead for those components.'
      },
      {
        id: 'react-2',
        question: 'When should the useEffect dependency array be omitted?',
        options: [
          'When you want the effect to run after every single render',
          'Only on mount',
          'To prevent memory leaks',
          'It should never be omitted'
        ],
        correctIndex: 0,
        explanation: 'Omitting the array causes the effect to run on initial mount and every subsequent re-render.'
      }
    ]
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const skillId = searchParams.get('skillId') || 'skill-1';
  const quiz = SKILL_QUIZZES[skillId] || SKILL_QUIZZES['skill-1'];
  return NextResponse.json({ quiz });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, skillId, answers, practicalUrl } = body;

    const quiz = SKILL_QUIZZES[skillId] || SKILL_QUIZZES['skill-1'];
    let correct = 0;

    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];
      if (answers[q.id] === q.correctIndex) {
        correct++;
      }
    }

    const assessmentScore = Math.round((correct / quiz.questions.length) * 100);
    const passed = assessmentScore >= 70;
    const practicalScore = practicalUrl ? 88 : 70;
    const now = new Date().toISOString();

    // 1. Update or Insert Skill Proof
    const existingProof = db.prepare('SELECT id FROM skill_proofs WHERE user_id = ? AND skill_id = ?').get(userId, skillId);
    if (existingProof) {
      db.prepare(`
        UPDATE skill_proofs 
        SET assessment_score = ?, practical_task_status = 'COMPLETED', portfolio_url = ?, verification_status = ?, created_at = ?
        WHERE user_id = ? AND skill_id = ?
      `).run(assessmentScore, practicalUrl || null, passed ? 'VERIFIED' : 'PENDING', now, userId, skillId);
    } else {
      db.prepare(`
        INSERT INTO skill_proofs (id, user_id, skill_id, assessment_score, practical_task_status, portfolio_url, verification_status, created_at)
        VALUES (?, ?, ?, ?, 'COMPLETED', ?, ?, ?)
      `).run(`sp-${Date.now()}`, userId, skillId, assessmentScore, practicalUrl || null, passed ? 'VERIFIED' : 'PENDING', now);
    }

    // 2. Recalculate Skill Readiness Score (Section 30)
    // Formula: 30% Assessment + 25% Practical + 20% Learning Exp + 25% Teaching Feedback
    const learningExp = 80;
    const teachingFeedback = 85;
    const finalScore = Math.round(
      (0.30 * assessmentScore) +
      (0.25 * practicalScore) +
      (0.20 * learningExp) +
      (0.25 * teachingFeedback)
    );

    let readinessTier = 'Developing';
    if (finalScore >= 85) readinessTier = 'Highly Ready';
    else if (finalScore >= 66) readinessTier = 'Ready';
    else if (finalScore < 40) readinessTier = 'Low Readiness';

    const existingReadiness = db.prepare('SELECT id FROM skill_readiness WHERE user_id = ? AND skill_id = ?').get(userId, skillId);
    if (existingReadiness) {
      db.prepare(`
        UPDATE skill_readiness 
        SET assessment_score = ?, practical_score = ?, learning_experience_score = ?, teaching_feedback_score = ?, final_score = ?, readiness_tier = ?, updated_at = ?
        WHERE user_id = ? AND skill_id = ?
      `).run(assessmentScore, practicalScore, learningExp, teachingFeedback, finalScore, readinessTier, now, userId, skillId);
    } else {
      db.prepare(`
        INSERT INTO skill_readiness (id, user_id, skill_id, assessment_score, practical_score, learning_experience_score, teaching_feedback_score, final_score, readiness_tier, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(`sr-${Date.now()}`, userId, skillId, assessmentScore, practicalScore, learningExp, teachingFeedback, finalScore, readinessTier, now);
    }

    // 3. Reward small verified learning reward (+0.25 Credit, Section 8 Method B)
    let creditBonus = 0;
    if (passed) {
      creditBonus = 0.25;
      db.prepare(`
        UPDATE wallets 
        SET balance = balance + ?, total_earned = total_earned + ?, updated_at = ?
        WHERE user_id = ?
      `).run(creditBonus, creditBonus, now, userId);

      db.prepare(`
        INSERT INTO transactions (id, transaction_id, session_id, teacher_id, learner_id, credit_amount, transaction_type, status, description, created_at)
        VALUES (?, ?, null, ?, null, ?, 'LEARNING_REWARD', 'COMPLETED', ?, ?)
      `).run(
        `tx-bonus-${Date.now()}`,
        `TX-REWARD-${Date.now().toString().slice(-6)}`,
        userId,
        creditBonus,
        `Verified Skill Assessment Passed (+0.25 Credit) - ${quiz.skillName}`,
        now
      );
    }

    return NextResponse.json({
      success: true,
      assessmentScore,
      passed,
      finalReadinessScore: finalScore,
      readinessTier,
      creditBonus,
      message: passed
        ? `Assessment Passed with ${assessmentScore}%! Readiness Score updated to ${finalScore}/100 (${readinessTier}). +${creditBonus} Credit rewarded!`
        : `Assessment Score: ${assessmentScore}%. Review the prerequisites and attempt again to achieve certification.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
