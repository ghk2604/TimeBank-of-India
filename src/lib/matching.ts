import db from './db';

/**
 * Smart Skill Matching (Sections 34 & 74)
 * Calculates match percentage between a learner and a teacher based on:
 * - Skill match
 * - Learner & Teacher level compatibility
 * - Language match
 * - Teacher rating & reputation score
 */
export function calculateTeacherMatch(
  learnerId: string,
  teacherId: string,
  skillId: string,
  preferredLanguage?: string
): { score: number; reasons: string[] } {
  const teacher = db.prepare(`
    SELECT u.*, us.experience_level, us.teaching_level, us.languages as teacher_languages,
           (SELECT AVG(rating) FROM reviews WHERE reviewed_user_id = u.id) as avg_rating,
           (SELECT COUNT(*) FROM sessions WHERE teacher_id = u.id AND status = 'CONFIRMED') as completed_sessions
    FROM users u
    JOIN user_skills us ON us.user_id = u.id AND us.skill_id = ? AND us.type = 'TEACHING'
    WHERE u.id = ?
  `).get(skillId, teacherId) as any;

  if (!teacher) return { score: 0, reasons: [] };

  const learner = db.prepare(`
    SELECT u.*, us.experience_level as learner_level
    FROM users u
    LEFT JOIN user_skills us ON us.user_id = u.id AND us.skill_id = ? AND us.type = 'LEARNING'
    WHERE u.id = ?
  `).get(skillId, learnerId) as any;

  let totalScore = 50; // Base baseline for skill match
  const reasons: string[] = ['✓ Verified Skill Instructor'];

  // 1. Level Compatibility (up to +20)
  if (teacher.teaching_level?.toLowerCase().includes('beginner') && (!learner?.learner_level || learner.learner_level === 'Beginner')) {
    totalScore += 20;
    reasons.push('✓ Beginner Friendly & Patient Pedagogy');
  } else if (teacher.experience_level === 'Expert' || teacher.experience_level === 'Advanced') {
    totalScore += 18;
    reasons.push(`✓ ${teacher.experience_level} Depth & Architecture Insights`);
  } else {
    totalScore += 12;
  }

  // 2. Language Match (up to +15)
  const teacherLangs: string[] = JSON.parse(teacher.teacher_languages || teacher.languages || '[]');
  if (preferredLanguage && teacherLangs.includes(preferredLanguage)) {
    totalScore += 15;
    reasons.push(`✓ Fluent in ${preferredLanguage}`);
  } else if (teacherLangs.length > 1) {
    totalScore += 10;
    reasons.push(`✓ Multilingual: ${teacherLangs.join(', ')}`);
  }

  // 3. Reputation & Rating (up to +15)
  const rating = teacher.avg_rating ? Number(teacher.avg_rating) : 4.5;
  if (rating >= 4.8) {
    totalScore += 15;
    reasons.push(`✓ Exceptional ⭐ ${rating.toFixed(1)} Learner Rating`);
  } else if (rating >= 4.5) {
    totalScore += 10;
    reasons.push(`✓ Highly Rated ⭐ ${rating.toFixed(1)}`);
  }

  const finalScore = Math.min(99, Math.max(65, totalScore));
  return { score: finalScore, reasons };
}

/**
 * Skill Swap Detector (Section 36)
 * Finds mutual knowledge exchange pairs between users.
 * Example: Rahul teaches Python and wants UI/UX; Priya teaches UI/UX and wants Python -> PERFECT MATCH!
 */
export function findSkillSwapOpportunities(currentUserId: string) {
  // Find what current user teaches and wants to learn
  const myTeaching = db.prepare(`
    SELECT skill_id, s.name as skill_name FROM user_skills us
    JOIN skills s ON us.skill_id = s.id
    WHERE user_id = ? AND type = 'TEACHING'
  `).all(currentUserId) as any[];

  const myLearning = db.prepare(`
    SELECT skill_id, s.name as skill_name FROM user_skills us
    JOIN skills s ON us.skill_id = s.id
    WHERE user_id = ? AND type = 'LEARNING'
  `).all(currentUserId) as any[];

  const swapOpportunities: any[] = [];

  for (const teach of myTeaching) {
    for (const learn of myLearning) {
      // Find other users who teach what I want to learn AND want to learn what I teach
      const matches = db.prepare(`
        SELECT u.id as user_id, u.full_name, u.avatar, u.city, u.reputation_score, u.trust_level,
               st.name as teach_skill_name, sl.name as learn_skill_name
        FROM users u
        JOIN user_skills us_teach ON us_teach.user_id = u.id AND us_teach.skill_id = ? AND us_teach.type = 'TEACHING'
        JOIN user_skills us_learn ON us_learn.user_id = u.id AND us_learn.skill_id = ? AND us_learn.type = 'LEARNING'
        JOIN skills st ON st.id = ?
        JOIN skills sl ON sl.id = ?
        WHERE u.id != ?
      `).all(learn.skill_id, teach.skill_id, learn.skill_id, teach.skill_id, currentUserId) as any[];

      for (const m of matches) {
        swapOpportunities.push({
          otherUserId: m.user_id,
          otherUserName: m.full_name,
          otherUserAvatar: m.avatar,
          city: m.city,
          reputation: m.reputation_score,
          trustLevel: m.trust_level,
          youTeach: teach.skill_name,
          theyTeach: learn.skill_name,
          badge: 'PERFECT SKILL SWAP',
          description: `You teach ${teach.skill_name} ↔ ${m.full_name} teaches ${learn.skill_name}`
        });
      }
    }
  }

  return swapOpportunities;
}

/**
 * Knowledge Exchange Chain & Impact Tracker (Sections 37 & 59)
 * Calculates pedagogical lineage: Rahul taught Priya -> Priya taught Anjali.
 */
export function getKnowledgeImpact(userId: string) {
  // 1. Direct learners taught by this user
  const directSessions = db.prepare(`
    SELECT s.*, l.full_name as learner_name, l.avatar as learner_avatar, sk.name as skill_name
    FROM sessions s
    JOIN users l ON s.learner_id = l.id
    JOIN skills sk ON s.skill_id = sk.id
    WHERE s.teacher_id = ? AND s.status = 'CONFIRMED'
    ORDER BY s.created_at DESC
  `).all(userId) as any[];

  const directLearnersMap = new Map<string, any>();
  for (const s of directSessions) {
    if (!directLearnersMap.has(s.learner_id)) {
      directLearnersMap.set(s.learner_id, {
        learnerId: s.learner_id,
        learnerName: s.learner_name,
        learnerAvatar: s.learner_avatar,
        skill: s.skill_name,
        skillId: s.skill_id,
        date: s.created_at,
        secondaryLearners: [] as any[]
      });
    }
  }

  let extendedCount = 0;
  let learnersWhoBecameTeachers = 0;

  // 2. Track downstream sessions where direct learners taught someone else
  for (const [learnerId, info] of directLearnersMap.entries()) {
    const secondarySessions = db.prepare(`
      SELECT s.*, sub.full_name as sub_learner_name, sub.avatar as sub_avatar, sk.name as skill_name
      FROM sessions s
      JOIN users sub ON s.learner_id = sub.id
      JOIN skills sk ON s.skill_id = sk.id
      WHERE s.teacher_id = ? AND s.status = 'CONFIRMED'
    `).all(learnerId) as any[];

    if (secondarySessions.length > 0) {
      learnersWhoBecameTeachers++;
      for (const ss of secondarySessions) {
        extendedCount++;
        info.secondaryLearners.push({
          subLearnerName: ss.sub_learner_name,
          subAvatar: ss.sub_avatar,
          skill: ss.skill_name,
          date: ss.created_at
        });
      }
    }
  }

  // Aggregate teaching stats
  const teachingStats = db.prepare(`
    SELECT SUM(duration) as total_minutes, COUNT(DISTINCT skill_id) as skills_shared
    FROM sessions
    WHERE teacher_id = ? AND status = 'CONFIRMED'
  `).get(userId) as any;

  const totalTeachingHours = Math.round(((teachingStats?.total_minutes || 0) / 60) * 10) / 10;
  const directLearnersCount = directLearnersMap.size;
  const totalReach = directLearnersCount + extendedCount;

  return {
    userId,
    directLearnersCount,
    extendedReachCount: extendedCount,
    totalKnowledgeReach: totalReach,
    teachingHours: totalTeachingHours,
    skillsShared: teachingStats?.skills_shared || 0,
    learnersWhoBecameTeachers,
    chain: Array.from(directLearnersMap.values())
  };
}

/**
 * Knowledge Gap Detector (Section 33)
 * Provides diagnostic questionnaires for key domains to detect foundation gaps.
 */
export const GAP_DETECTOR_TRACKS = [
  {
    id: 'track-fullstack',
    title: 'Full Stack Web Development',
    category: 'TECHNOLOGY',
    targetSkill: 'Web Development (React & Next.js)',
    description: 'Assess your frontend and backend foundations before building production applications.',
    questions: [
      {
        id: 'q1',
        text: 'Do you know how HTML semantic tags (<main>, <article>, <nav>) improve accessibility and SEO?',
        skillPrereq: 'HTML & CSS',
        prereqSkillId: 'skill-3'
      },
      {
        id: 'q2',
        text: 'Can you confidently write JavaScript closures, Array methods (map/filter/reduce), and Promises / async-await?',
        skillPrereq: 'Modern JavaScript (ES6+)',
        prereqSkillId: 'skill-1'
      },
      {
        id: 'q3',
        text: 'Have you designed responsive user interfaces using CSS Flexbox, Grid, or Tailwind CSS utility classes?',
        skillPrereq: 'UI/UX Design Systems',
        prereqSkillId: 'skill-2'
      },
      {
        id: 'q4',
        text: 'Do you understand HTTP status codes, REST APIs, and how client-server data synchronization works?',
        skillPrereq: 'Web Fundamentals & APIs',
        prereqSkillId: 'skill-3'
      }
    ]
  },
  {
    id: 'track-ml',
    title: 'Machine Learning & Data Science',
    category: 'TECHNOLOGY',
    targetSkill: 'Machine Learning Fundamentals',
    description: 'Determine whether your mathematical foundations and Python coding are ready for ML modeling.',
    questions: [
      {
        id: 'q1',
        text: 'Are you comfortable writing Python functions, list comprehensions, and using packages like NumPy/Pandas?',
        skillPrereq: 'Python Programming',
        prereqSkillId: 'skill-1'
      },
      {
        id: 'q2',
        text: 'Do you understand derivatives, partial gradients, and matrix dot products from Linear Algebra?',
        skillPrereq: 'Mathematics (Calculus & Linear Algebra)',
        prereqSkillId: 'skill-4'
      },
      {
        id: 'q3',
        text: 'Do you know the difference between Supervised (Classification/Regression) and Unsupervised Learning?',
        skillPrereq: 'ML Conceptual Basics',
        prereqSkillId: 'skill-5'
      }
    ]
  },
  {
    id: 'track-comm',
    title: 'Professional Communication & Public Speaking',
    category: 'PROFESSIONAL',
    targetSkill: 'English Communication & Public Speaking',
    description: 'Evaluate your corporate presentation, impromptu articulation, and interview delivery skills.',
    questions: [
      {
        id: 'q1',
        text: 'Can you structure a 2-minute impromptu talk using the PREP framework (Point, Reason, Example, Point)?',
        skillPrereq: 'Speech Structuring',
        prereqSkillId: 'skill-6'
      },
      {
        id: 'q2',
        text: 'Do you feel confident speaking without filler words ("um", "like", "actually") in technical interviews?',
        skillPrereq: 'Fluency & Pacing',
        prereqSkillId: 'skill-6'
      }
    ]
  }
];
