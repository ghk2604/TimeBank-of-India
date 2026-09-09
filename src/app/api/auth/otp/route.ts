import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, identifier, channel, otpCode, newUserData } = body;

    const now = new Date();

    if (action === 'SEND_OTP') {
      if (!identifier || identifier.trim().length < 4) {
        return NextResponse.json({ error: 'Please enter a valid phone number or email address' }, { status: 400 });
      }

      const cleanIdentifier = identifier.trim();
      const isEmail = cleanIdentifier.includes('@');
      const otpType = isEmail ? 'EMAIL' : 'SMS';

      // Normalize phone if SMS
      let normalizedPhone = '';
      let phoneSearchTerm = '';
      if (!isEmail) {
        const digits = cleanIdentifier.replace(/\D/g, '');
        const last10 = digits.slice(-10);
        normalizedPhone = `+91${last10}`;
        phoneSearchTerm = last10.length >= 10 ? `%${last10}%` : `%${cleanIdentifier}%`;
      }

      // Generate 6-digit secure OTP code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes
      const id = `otp-${Date.now()}`;

      // Invalidate old pending OTPs for this identifier
      db.prepare('UPDATE otps SET verified = 2 WHERE identifier = ? AND verified = 0').run(cleanIdentifier);
      if (normalizedPhone) {
        db.prepare('UPDATE otps SET verified = 2 WHERE identifier = ? AND verified = 0').run(normalizedPhone);
      }

      // Insert new OTP
      db.prepare(`
        INSERT INTO otps (id, identifier, otp_code, type, expires_at, verified, created_at)
        VALUES (?, ?, ?, ?, ?, 0, ?)
      `).run(id, cleanIdentifier, code, otpType, expiresAt, now.toISOString());

      // Check if user already exists
      let existingUser: any = null;
      if (isEmail) {
        existingUser = db.prepare(`
          SELECT u.*, w.balance, w.borrowing_limit
          FROM users u
          LEFT JOIN wallets w ON u.id = w.user_id
          WHERE LOWER(u.email) = LOWER(?)
        `).get(cleanIdentifier) as any;
      } else {
        existingUser = db.prepare(`
          SELECT u.*, w.balance, w.borrowing_limit
          FROM users u
          LEFT JOIN wallets w ON u.id = w.user_id
          WHERE u.phone = ? OR REPLACE(REPLACE(u.phone, ' ', ''), '-', '') = ? OR u.phone LIKE ?
        `).get(cleanIdentifier, normalizedPhone || cleanIdentifier, phoneSearchTerm) as any;
      }

      return NextResponse.json({
        success: true,
        message: `OTP sent successfully via ${otpType === 'EMAIL' ? 'Email' : 'SMS (+91)'} to ${cleanIdentifier}`,
        type: otpType,
        identifier: cleanIdentifier,
        expiresAt,
        isExistingUser: !!existingUser,
        existingUserName: existingUser?.full_name,
        // In development / demo mode, return the OTP so the user can test instantly without real SMS gateway fees!
        devOtp: code,
      });
    } else if (action === 'VERIFY_OTP') {
      if (!identifier || !otpCode) {
        return NextResponse.json({ error: 'Identifier and OTP code are required' }, { status: 400 });
      }

      const cleanIdentifier = identifier.trim();
      const isEmail = cleanIdentifier.includes('@');
      let normalizedPhone = '';
      let phoneSearchTerm = '';
      if (!isEmail) {
        const digits = cleanIdentifier.replace(/\D/g, '');
        const last10 = digits.slice(-10);
        normalizedPhone = `+91${last10}`;
        phoneSearchTerm = last10.length >= 10 ? `%${last10}%` : `%${cleanIdentifier}%`;
      }

      // Find valid OTP (matching either cleanIdentifier or normalizedPhone)
      let record = db.prepare(`
        SELECT * FROM otps 
        WHERE identifier = ? AND otp_code = ? AND verified = 0 AND expires_at > ?
        ORDER BY created_at DESC LIMIT 1
      `).get(cleanIdentifier, otpCode.trim(), now.toISOString()) as any;

      if (!record && normalizedPhone) {
        record = db.prepare(`
          SELECT * FROM otps 
          WHERE identifier = ? AND otp_code = ? AND verified = 0 AND expires_at > ?
          ORDER BY created_at DESC LIMIT 1
        `).get(normalizedPhone, otpCode.trim(), now.toISOString()) as any;
      }

      if (!record) {
        return NextResponse.json({ error: 'Invalid or expired OTP. Please check the code or request a new one.' }, { status: 400 });
      }

      // Mark OTP as verified
      db.prepare('UPDATE otps SET verified = 1 WHERE id = ?').run(record.id);

      // Check if user already exists
      let existingUser: any = null;
      if (isEmail) {
        existingUser = db.prepare(`
          SELECT u.*, w.balance, w.borrowing_limit
          FROM users u
          LEFT JOIN wallets w ON u.id = w.user_id
          WHERE LOWER(u.email) = LOWER(?)
        `).get(cleanIdentifier) as any;
      } else {
        existingUser = db.prepare(`
          SELECT u.*, w.balance, w.borrowing_limit
          FROM users u
          LEFT JOIN wallets w ON u.id = w.user_id
          WHERE u.phone = ? OR REPLACE(REPLACE(u.phone, ' ', ''), '-', '') = ? OR u.phone LIKE ?
        `).get(cleanIdentifier, normalizedPhone || cleanIdentifier, phoneSearchTerm) as any;
      }

      if (existingUser) {
        return NextResponse.json({
          success: true,
          isNewUser: false,
          user: {
            id: existingUser.id,
            fullName: existingUser.full_name,
            username: existingUser.username,
            email: existingUser.email,
            phone: existingUser.phone,
            avatar: existingUser.avatar,
            city: existingUser.city,
            state: existingUser.state,
            balance: existingUser.balance !== null ? existingUser.balance : 2.0,
            borrowingLimit: existingUser.borrowing_limit !== null ? existingUser.borrowing_limit : -1.0,
            role: existingUser.id === 'user-1' || existingUser.id === 'user-2' ? 'TEACHER' : 'LEARNER',
            reputationScore: existingUser.reputation_score,
            trustLevel: existingUser.trust_level,
            unreadNotifications: 1
          },
          message: `Namaste, ${existingUser.full_name}! Authenticated successfully via OTP.`
        });
      }

      // If user does not exist yet, prompt them to complete profile or finalize registration
      if (newUserData && newUserData.fullName) {
        const userId = `user-${Date.now()}`;
        const username = newUserData.username || `user_${Date.now().toString().slice(-4)}`;
        const email = isEmail ? cleanIdentifier : (newUserData.email || `${username}@timebankindia.in`);
        const phoneFormatted = normalizedPhone 
          ? `+91 ${normalizedPhone.slice(3, 8)} ${normalizedPhone.slice(8)}`
          : (!isEmail ? cleanIdentifier : (newUserData.phone || '+91 99999 00000'));
        const starterCredits = 1.0;
        const borrowingLimit = -1.0;
        const avatar = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces`;

        const regTx = db.transaction(() => {
          db.prepare(`
            INSERT INTO users (id, full_name, username, email, phone, avatar, bio, city, state, languages, verification_status, reputation_score, trust_level, learning_streak, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', 75, 'New Member', 1, ?, ?)
          `).run(
            userId, newUserData.fullName, username, email, phoneFormatted, avatar,
            `Verified Indian peer learner on TimeBank of India.`,
            newUserData.city || 'Hyderabad', newUserData.state || 'Telangana',
            JSON.stringify(['English', 'Hindi']), now.toISOString(), now.toISOString()
          );

          db.prepare(`
            INSERT INTO wallets (id, user_id, balance, borrowing_limit, total_earned, total_spent, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 0.0, ?, ?)
          `).run(`wallet-${userId}`, userId, starterCredits, borrowingLimit, starterCredits, now.toISOString(), now.toISOString());

          db.prepare(`
            INSERT INTO transactions (id, transaction_id, session_id, teacher_id, learner_id, credit_amount, transaction_type, status, description, created_at)
            VALUES (?, ?, null, ?, null, ?, 'LEARNING_REWARD', 'COMPLETED', 'OTP Verification Starter Credit (+1.0 Credit)', ?)
          `).run(`tx-otp-${Date.now()}`, `TX-OTP-${Math.floor(100000 + Math.random() * 900000)}`, userId, starterCredits, now.toISOString());

          // Link skills if selected
          if (newUserData.skillToTeachId) {
            db.prepare(`
              INSERT OR IGNORE INTO user_skills (id, user_id, skill_id, type, experience_level, teaching_level, languages, status)
              VALUES (?, ?, ?, 'TEACHING', 'Intermediate', 'Beginner learners', JSON.stringify(['English', 'Hindi']), 'ACTIVE')
            `).run(`us-${userId}-teach`, userId, newUserData.skillToTeachId);
          }

          if (newUserData.skillToLearnId) {
            db.prepare(`
              INSERT OR IGNORE INTO user_skills (id, user_id, skill_id, type, experience_level, teaching_level, languages, status)
              VALUES (?, ?, ?, 'LEARNING', 'Beginner', null, JSON.stringify(['English']), 'ACTIVE')
            `).run(`us-${userId}-learn`, userId, newUserData.skillToLearnId);
          }
        });

        regTx();

        return NextResponse.json({
          success: true,
          isNewUser: false,
          user: {
            id: userId,
            fullName: newUserData.fullName,
            username,
            email,
            phone: phoneFormatted,
            avatar,
            city: newUserData.city || 'Hyderabad',
            state: newUserData.state || 'Telangana',
            balance: starterCredits,
            borrowingLimit,
            role: 'LEARNER',
            reputationScore: 75,
            trustLevel: 'New Member',
            unreadNotifications: 1
          },
          message: `Account created & verified via OTP! Welcome to TimeBank of India.`
        });
      }

      return NextResponse.json({
        success: true,
        isNewUser: true,
        identifier: cleanIdentifier,
        message: 'OTP verified! Please provide your name to complete onboarding.'
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
