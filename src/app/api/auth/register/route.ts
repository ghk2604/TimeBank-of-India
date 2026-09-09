import { NextResponse } from 'next/server';
import db, { checkpointDB } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      fullName, 
      username, 
      email, 
      phone, 
      password, 
      city, 
      state, 
      languages, 
      skillToTeachId, 
      skillToLearnId, 
      accessKey 
    } = body;

    const cleanFullName = (fullName || '').trim();
    const cleanUsername = (username || '').trim().toLowerCase().replace(/\s+/g, '');
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim() || '+91 99999 00000';
    const cleanPassword = (password || '').trim();
    const cleanCity = (city || '').trim() || 'Hyderabad';
    const cleanState = (state || '').trim() || 'Telangana';

    if (!cleanFullName || !cleanUsername || !cleanEmail) {
      return NextResponse.json({ error: 'Full name, username, and email are required' }, { status: 400 });
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return NextResponse.json({ error: 'Password is mandatory and must be at least 6 characters long' }, { status: 400 });
    }

    // Check if user exists (case-insensitive check)
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?').get(cleanEmail, cleanUsername);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email or username already exists' }, { status: 400 });
    }

    // Check optional access key
    let starterCredits = 1.0;
    let trustLevel = 'New Member';
    let borrowingLimit = -1.0;
    let verificationStatus = 'VERIFIED';

    if (accessKey && accessKey.trim()) {
      const keyRecord = db.prepare('SELECT * FROM access_keys WHERE key_code = ? AND status = "APPROVED"').get(accessKey.trim().toUpperCase()) as any;
      if (keyRecord) {
        starterCredits += keyRecord.starter_credits || 1.0;
        trustLevel = 'Verified Member';
        borrowingLimit = -2.0;
      }
    }

    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const userId = `user-${Date.now()}-${randomSuffix}`;
    const now = new Date().toISOString();
    const avatar = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces`;

    const registerTx = db.transaction(() => {
      // 1. Create user with mandatory password_hash
      db.prepare(`
        INSERT INTO users (id, full_name, username, email, phone, password_hash, avatar, bio, city, state, languages, verification_status, reputation_score, trust_level, learning_streak, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 75, ?, 1, ?, ?)
      `).run(
        userId, cleanFullName, cleanUsername, cleanEmail, cleanPhone, cleanPassword, avatar,
        `Eager learner & educator on TimeBank of India from ${cleanCity}.`,
        cleanCity, cleanState, JSON.stringify(languages || ['English', 'Hindi']),
        verificationStatus, trustLevel, now, now
      );

      // 2. Create wallet with starter credits & borrowing limit
      db.prepare(`
        INSERT INTO wallets (id, user_id, balance, borrowing_limit, total_earned, total_spent, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 0.0, ?, ?)
      `).run(`wallet-${userId}`, userId, starterCredits, borrowingLimit, starterCredits, now, now);

      // 3. Create initial transaction record
      db.prepare(`
        INSERT INTO transactions (id, transaction_id, session_id, teacher_id, learner_id, credit_amount, transaction_type, status, description, created_at)
        VALUES (?, ?, null, ?, null, ?, 'LEARNING_REWARD', 'COMPLETED', ?, ?)
      `).run(
        `tx-welcome-${Date.now()}-${randomSuffix}`,
        `TX-WELCOME-${Math.floor(100000 + Math.random() * 900000)}`,
        userId, starterCredits,
        accessKey ? `Welcome Invitation Key Bonus (+${starterCredits} Credits)` : `New Learner Starter Credit (+${starterCredits} Credit)`,
        now
      );

      // 4. Attach skills if provided
      if (skillToTeachId) {
        db.prepare(`
          INSERT INTO user_skills (id, user_id, skill_id, type, experience_level, teaching_level, languages, status)
          VALUES (?, ?, ?, 'TEACHING', 'Intermediate', 'Beginner learners', ?, 'ACTIVE')
        `).run(`us-t-${Date.now()}-${randomSuffix}`, userId, skillToTeachId, JSON.stringify(languages || ['English']));

        // Also create baseline readiness entry so user appears in marketplace searches
        db.prepare(`
          INSERT OR IGNORE INTO skill_readiness (id, user_id, skill_id, assessment_score, practical_score, learning_experience_score, teaching_feedback_score, final_score, readiness_tier, updated_at)
          VALUES (?, ?, ?, 80, 75, 75, 80, 78, 'Ready to Teach', ?)
        `).run(`sr-${Date.now()}-${randomSuffix}`, userId, skillToTeachId, now);
      }

      if (skillToLearnId) {
        db.prepare(`
          INSERT INTO user_skills (id, user_id, skill_id, type, experience_level, languages, status)
          VALUES (?, ?, ?, 'LEARNING', 'Beginner', ?, 'ACTIVE')
        `).run(`us-l-${Date.now()}-${randomSuffix}`, userId, skillToLearnId, JSON.stringify(languages || ['English']));
      }

      // 5. Welcome notification
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
        VALUES (?, ?, 'Welcome to TimeBank of India 🇮🇳', ?, 'CREDIT', 0, '/wallet', ?)
      `).run(
        `notif-wel-${Date.now()}-${randomSuffix}`,
        userId,
        `Your account has been activated with ${starterCredits.toFixed(2)} Time Credits and borrowing limit ${borrowingLimit.toFixed(2)}. Start learning or teaching today!`,
        now
      );
    });

    registerTx();

    // Force flush SQLite WAL pages to the physical database file on disk immediately
    checkpointDB();

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        fullName: cleanFullName,
        username: cleanUsername,
        email: cleanEmail,
        phone: cleanPhone,
        avatar,
        city: cleanCity,
        state: cleanState,
        balance: starterCredits,
        borrowingLimit,
        role: skillToTeachId ? 'TEACHER' : 'LEARNER',
        reputationScore: 75,
        trustLevel,
        unreadNotifications: 1
      },
      message: `Account created successfully! ${starterCredits} Time Credits granted.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

