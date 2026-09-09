import db from './db';

export function calculateCreditCost(durationMinutes: number): number {
  // 15m = 0.25, 30m = 0.50, 45m = 0.75, 60m = 1.00, 90m = 1.50
  return Math.round((durationMinutes / 60) * 100) / 100;
}

export function getUserBorrowingLimit(trustLevel: string, verificationStatus: string): number {
  if (trustLevel === 'Skill Expert' || trustLevel === 'Trusted Member') {
    return -3.0;
  }
  if (verificationStatus === 'VERIFIED' || trustLevel === 'Active Teacher' || trustLevel === 'Active Learner') {
    return -2.0;
  }
  return -1.0;
}

export interface TransferResult {
  success: boolean;
  message: string;
  transactionId?: string;
  learnerNewBalance?: number;
  teacherNewBalance?: number;
}

/**
 * Atomic Credit Transfer (Sections 18-20 & 71)
 * Transfers Time Credits from Learner to Teacher after session completion and confirmation.
 * Guarantees ACID atomicity with SQLite transaction and rollback on dispute or limit violation.
 */
export function executeAtomicCreditTransfer(sessionId: string): TransferResult {
  // 1. Fetch session details
  const session = db.prepare(`
    SELECT s.*, 
           l.full_name as learner_name,
           t.full_name as teacher_name,
           lw.balance as learner_balance,
           lw.borrowing_limit as learner_limit,
           tw.balance as teacher_balance,
           sk.name as skill_name
    FROM sessions s
    JOIN users l ON s.learner_id = l.id
    JOIN users t ON s.teacher_id = t.id
    JOIN wallets lw ON s.learner_id = lw.user_id
    JOIN wallets tw ON s.teacher_id = tw.user_id
    JOIN skills sk ON s.skill_id = sk.id
    WHERE s.id = ?
  `).get(sessionId) as any;

  if (!session) {
    return { success: false, message: 'Session not found.' };
  }

  // 2. Check for active dispute
  const dispute = db.prepare(`
    SELECT id FROM disputes WHERE session_id = ? AND status = 'PENDING'
  `).get(sessionId);

  if (dispute) {
    return { success: false, message: 'Credit transfer paused: An active dispute is pending resolution by administrators.' };
  }

  // 3. Duplicate transaction prevention (Sections 17 & 67)
  const existingTx = db.prepare(`
    SELECT transaction_id FROM transactions WHERE session_id = ?
  `).get(sessionId) as any;

  if (existingTx) {
    return { 
      success: false, 
      message: `Transaction already finalized for this session (Tx ID: ${existingTx.transaction_id}). Duplicate transfer prevented.` 
    };
  }

  // 4. Validate confirmations
  if (!session.learner_confirmation || !session.teacher_confirmation) {
    return { 
      success: false, 
      message: 'Both learner and teacher must confirm session completion before Time Credits can be transferred.' 
    };
  }

  const creditAmount = session.credit_amount;
  const learnerNewBalance = session.learner_balance - creditAmount;

  // 5. Borrowing limit validation (Section 73)
  if (learnerNewBalance < session.learner_limit) {
    return { 
      success: false, 
      message: `Transaction rejected: Learner balance (${session.learner_balance.toFixed(2)}) minus cost (${creditAmount.toFixed(2)}) would exceed borrowing limit (${session.learner_limit.toFixed(2)}).` 
    };
  }

  // 6. Execute Atomic SQLite Transaction
  const transferTx = db.transaction(() => {
    const txUniqueId = `TX-IND-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    // Deduct learner wallet
    db.prepare(`
      UPDATE wallets 
      SET balance = balance - ?, total_spent = total_spent + ?, updated_at = ?
      WHERE user_id = ?
    `).run(creditAmount, creditAmount, now, session.learner_id);

    // Credit teacher wallet
    db.prepare(`
      UPDATE wallets 
      SET balance = balance + ?, total_earned = total_earned + ?, updated_at = ?
      WHERE user_id = ?
    `).run(creditAmount, creditAmount, now, session.teacher_id);

    // Create immutable audit transaction record (Credits never expire)
    db.prepare(`
      INSERT INTO transactions (id, transaction_id, session_id, teacher_id, learner_id, credit_amount, transaction_type, status, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'SESSION_PAYMENT', 'COMPLETED', ?, ?)
    `).run(
      `tx-${Date.now()}`,
      txUniqueId,
      sessionId,
      session.teacher_id,
      session.learner_id,
      creditAmount,
      `Teaching ${session.skill_name} (${session.duration} mins) - Learner: ${session.learner_name}`,
      now
    );

    // Update session status to CONFIRMED
    db.prepare(`
      UPDATE sessions 
      SET status = 'CONFIRMED'
      WHERE id = ?
    `).run(sessionId);

    // Send notifications to both participants
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
      VALUES (?, ?, ?, ?, 'CREDIT', 0, '/wallet', ?)
    `).run(
      `notif-${Date.now()}-1`,
      session.teacher_id,
      `+${creditAmount.toFixed(2)} Time Credits Earned`,
      `Session on "${session.skill_name}" with ${session.learner_name} confirmed! +${creditAmount.toFixed(2)} Credits deposited into your Time Wallet.`,
      now
    );

    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
      VALUES (?, ?, ?, ?, 'CREDIT', 0, '/wallet', ?)
    `).run(
      `notif-${Date.now()}-2`,
      session.learner_id,
      `-${creditAmount.toFixed(2)} Time Credits Deducted`,
      `Session on "${session.skill_name}" confirmed. -${creditAmount.toFixed(2)} Credits processed. Keep learning & growing!`,
      now
    );

    return txUniqueId;
  });

  try {
    const txUniqueId = transferTx();
    return {
      success: true,
      message: `Time Credits transferred successfully (${creditAmount.toFixed(2)} Credits).`,
      transactionId: txUniqueId,
      learnerNewBalance: session.learner_balance - creditAmount,
      teacherNewBalance: session.teacher_balance + creditAmount
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Credit transfer failed and was cleanly rolled back: ${error.message}`
    };
  }
}

/**
 * 24-Hour Booking Expiry Scanner (Sections 41 & 72)
 * Scans pending requests and marks any older than 24 hours as EXPIRED.
 */
export function checkAndExpireRequests(): number {
  const now = new Date().toISOString();
  
  const expiredRequests = db.prepare(`
    SELECT r.*, l.full_name as learner_name, t.full_name as teacher_name, s.name as skill_name
    FROM learning_requests r
    JOIN users l ON r.learner_id = l.id
    JOIN users t ON r.teacher_id = t.id
    JOIN skills s ON r.skill_id = s.id
    WHERE r.status = 'PENDING' AND r.response_deadline <= ?
  `).all(now) as any[];

  if (expiredRequests.length === 0) return 0;

  const expireTx = db.transaction(() => {
    for (const req of expiredRequests) {
      db.prepare(`UPDATE learning_requests SET status = 'EXPIRED' WHERE id = ?`).run(req.id);

      // Notify learner
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
        VALUES (?, ?, ?, ?, 'EXPIRY', 0, '/marketplace', ?)
      `).run(
        `notif-exp-${Date.now()}-${req.id}`,
        req.learner_id,
        'Learning Request Expired (24h Window)',
        `Your request to learn ${req.skill_name} from ${req.teacher_name} expired as no response was received within 24 hours. Zero credits deducted. Explore other teachers now!`,
        now
      );
    }
  });

  expireTx();
  return expiredRequests.length;
}

/**
 * Credit Recovery Recommendation System (Section 13)
 * For users with negative balance, suggests verified skills they can teach to recover credits.
 */
export function getCreditRecoverySuggestions(userId: string) {
  const wallet = db.prepare('SELECT balance, borrowing_limit FROM wallets WHERE user_id = ?').get(userId) as any;
  if (!wallet || wallet.balance >= 0) {
    return { needsRecovery: false, deficit: 0, recommendations: [] };
  }

  const deficit = Math.abs(wallet.balance);

  // Find user's teaching skills with readiness scores
  const teachingSkills = db.prepare(`
    SELECT us.*, s.name as skill_name, s.category, sr.final_score, sr.readiness_tier
    FROM user_skills us
    JOIN skills s ON us.skill_id = s.id
    LEFT JOIN skill_readiness sr ON (sr.user_id = us.user_id AND sr.skill_id = us.skill_id)
    WHERE us.user_id = ? AND us.type = 'TEACHING'
    ORDER BY sr.final_score DESC
  `).all(userId) as any[];

  // For each skill, find waiting requests or potential learners in the platform
  const recommendations = teachingSkills.map(ts => {
    const potentialEarnings = Math.min(1.0, deficit);
    return {
      skillId: ts.skill_id,
      skillName: ts.skill_name,
      category: ts.category,
      experienceLevel: ts.experience_level,
      readinessScore: ts.final_score || 70,
      readinessTier: ts.readiness_tier || 'Ready',
      recommendedSession: '1 Hour Teaching Session',
      potentialCreditGain: `+${potentialEarnings.toFixed(2)} Credit`,
      recoveryGoal: `Conduct 1 session to recover ${potentialEarnings.toFixed(2)} Credit towards your ${deficit.toFixed(2)} deficit.`
    };
  });

  return {
    needsRecovery: true,
    deficit,
    recommendations
  };
}

export interface CancellationResult {
  success: boolean;
  message: string;
  transactionId?: string;
  actualMinutesTaught?: number;
  cancelledMinutes?: number;
  proratedCreditsTaught?: number;
  cancellationDeduction?: number;
  cancellingRole?: 'TEACHER' | 'LEARNER';
  cancellingUserNewBalance?: number;
  counterpartyNewBalance?: number;
}

/**
 * Mid-Session Cancellation and Prorated Credit Adjustment
 * Deducts credits from the user who initiates session cancellation.
 * If 60 min session is cancelled after 15 min of teaching:
 * - 15 mins taught: 0.25 Time Credits (prorated)
 * - 45 mins cancelled: 0.75 Time Credits (cancelled slot)
 * Credits corresponding to the cancelled time are deducted from the cancelling party's wallet.
 */
export function executeSessionCancellation(
  sessionId: string,
  cancellingUserId: string,
  actualMinutesTaught: number,
  cancellationReason: string
): CancellationResult {
  const session = db.prepare(`
    SELECT s.*, 
           l.full_name as learner_name,
           t.full_name as teacher_name,
           lw.balance as learner_balance,
           lw.borrowing_limit as learner_limit,
           tw.balance as teacher_balance,
           sk.name as skill_name
    FROM sessions s
    JOIN users l ON s.learner_id = l.id
    JOIN users t ON s.teacher_id = t.id
    JOIN wallets lw ON s.learner_id = lw.user_id
    JOIN wallets tw ON s.teacher_id = tw.user_id
    JOIN skills sk ON s.skill_id = sk.id
    WHERE s.id = ?
  `).get(sessionId) as any;

  if (!session) {
    return { success: false, message: 'Session not found.' };
  }

  if (session.status === 'CANCELLED') {
    return { success: false, message: 'Session is already cancelled.' };
  }

  if (session.status === 'CONFIRMED') {
    return { success: false, message: 'Session has already been confirmed and completed. Cannot cancel.' };
  }

  const isTeacher = cancellingUserId === session.teacher_id;
  const isLearner = cancellingUserId === session.learner_id;

  if (!isTeacher && !isLearner) {
    return { success: false, message: 'Only session participants can cancel the session.' };
  }

  const totalDuration = Number(session.duration || 60);
  const safeMinutesTaught = Math.max(0, Math.min(totalDuration, Math.round(Number(actualMinutesTaught) || 0)));
  const cancelledMinutes = Math.max(0, totalDuration - safeMinutesTaught);

  // Prorated calculations (1 hr = 1.00 credit)
  const proratedCreditsTaught = Math.round((safeMinutesTaught / 60) * 100) / 100;
  const cancellationDeduction = Math.round((cancelledMinutes / 60) * 100) / 100;

  const cancelTx = db.transaction(() => {
    const txUniqueId = `TX-CNC-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    let cancellingUserNewBalance = 0;
    let counterpartyNewBalance = 0;

    if (isTeacher) {
      // TEACHER CANCELS MID-SESSION:
      // Teacher stopped early after teaching safeMinutesTaught (e.g. 15 min = 0.25 Cr).
      // Remaining cancelledMinutes (e.g. 45 min = 0.75 Cr) cancelled by Teacher.
      // Net deduction on Teacher who cancelled = cancellationDeduction - proratedCreditsTaught (e.g. 0.50 Cr deduction)
      // Learner pays proratedCreditsTaught (0.25 Cr) for teaching received, unfulfilled portion cancelled.
      const teacherNetPenalty = Math.max(0, cancellationDeduction - proratedCreditsTaught);

      db.prepare(`
        UPDATE wallets 
        SET balance = balance - ?, total_spent = total_spent + ?, updated_at = ?
        WHERE user_id = ?
      `).run(teacherNetPenalty, teacherNetPenalty, now, session.teacher_id);

      if (proratedCreditsTaught > 0) {
        db.prepare(`
          UPDATE wallets 
          SET balance = balance - ?, total_spent = total_spent + ?, updated_at = ?
          WHERE user_id = ?
        `).run(proratedCreditsTaught, proratedCreditsTaught, now, session.learner_id);
      }

      cancellingUserNewBalance = session.teacher_balance - teacherNetPenalty;
      counterpartyNewBalance = session.learner_balance - proratedCreditsTaught;

      // Immutable audit transaction
      db.prepare(`
        INSERT INTO transactions (id, transaction_id, session_id, teacher_id, learner_id, credit_amount, transaction_type, status, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'SESSION_CANCELLATION', 'COMPLETED', ?, ?)
      `).run(
        `tx-${Date.now()}`,
        txUniqueId,
        sessionId,
        session.teacher_id,
        session.learner_id,
        cancellationDeduction,
        `Session cancelled by Teacher after ${safeMinutesTaught}/${totalDuration} mins. Teacher penalized -${teacherNetPenalty.toFixed(2)} Time Credits for ${cancelledMinutes} mins unfulfilled slot. Reason: ${cancellationReason}`,
        now
      );

      // Realtime notifications
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
        VALUES (?, ?, ?, ?, 'SESSION', 0, '/wallet', ?)
      `).run(
        `notif-cnc-t-${Date.now()}`,
        session.teacher_id,
        `Session Cancelled - Credits Decreased (-${teacherNetPenalty.toFixed(2)} Cr)`,
        `You cancelled the session after ${safeMinutesTaught} mins. Credits decreased by ${teacherNetPenalty.toFixed(2)} Time Credits for the ${cancelledMinutes} mins unfulfilled time.`,
        now
      );

      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
        VALUES (?, ?, ?, ?, 'SESSION', 0, '/sessions', ?)
      `).run(
        `notif-cnc-l-${Date.now()}`,
        session.learner_id,
        `Session Cancelled Early by Teacher`,
        `Teacher ${session.teacher_name} cancelled after ${safeMinutesTaught} mins. Charged only ${proratedCreditsTaught.toFixed(2)} Cr for ${safeMinutesTaught} mins. Unfulfilled time cancelled. Reason: ${cancellationReason}`,
        now
      );

    } else {
      // LEARNER CANCELS MID-SESSION:
      // Learner stopped early after safeMinutesTaught (e.g. 15 min = 0.25 Cr).
      // Teacher blocked totalDuration. Learner cancelled remaining cancelledMinutes (e.g. 45 min = 0.75 Cr).
      // Total deduction on Learner who cancelled = proratedCreditsTaught + cancellationDeduction (1.00 Cr total deduction).
      // Teacher receives compensation for the booked hour.
      const totalLearnerDeduction = proratedCreditsTaught + cancellationDeduction;

      db.prepare(`
        UPDATE wallets 
        SET balance = balance - ?, total_spent = total_spent + ?, updated_at = ?
        WHERE user_id = ?
      `).run(totalLearnerDeduction, totalLearnerDeduction, now, session.learner_id);

      db.prepare(`
        UPDATE wallets 
        SET balance = balance + ?, total_earned = total_earned + ?, updated_at = ?
        WHERE user_id = ?
      `).run(totalLearnerDeduction, totalLearnerDeduction, now, session.teacher_id);

      cancellingUserNewBalance = session.learner_balance - totalLearnerDeduction;
      counterpartyNewBalance = session.teacher_balance + totalLearnerDeduction;

      // Immutable audit transaction
      db.prepare(`
        INSERT INTO transactions (id, transaction_id, session_id, teacher_id, learner_id, credit_amount, transaction_type, status, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'SESSION_CANCELLATION', 'COMPLETED', ?, ?)
      `).run(
        `tx-${Date.now()}`,
        txUniqueId,
        sessionId,
        session.teacher_id,
        session.learner_id,
        totalLearnerDeduction,
        `Session cancelled by Learner after ${safeMinutesTaught}/${totalDuration} mins. Learner deducted -${totalLearnerDeduction.toFixed(2)} Time Credits (${proratedCreditsTaught.toFixed(2)} Cr taught + ${cancellationDeduction.toFixed(2)} Cr for ${cancelledMinutes} mins cancelled). Reason: ${cancellationReason}`,
        now
      );

      // Realtime notifications
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
        VALUES (?, ?, ?, ?, 'SESSION', 0, '/wallet', ?)
      `).run(
        `notif-cnc-l-${Date.now()}`,
        session.learner_id,
        `Session Cancelled - Credits Decreased (-${totalLearnerDeduction.toFixed(2)} Cr)`,
        `You cancelled the session after ${safeMinutesTaught} mins. Credits decreased by ${totalLearnerDeduction.toFixed(2)} Time Credits (${proratedCreditsTaught.toFixed(2)} Cr for time taught + ${cancellationDeduction.toFixed(2)} Cr for ${cancelledMinutes} mins cancelled slot).`,
        now
      );

      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
        VALUES (?, ?, ?, ?, 'SESSION', 0, '/sessions', ?)
      `).run(
        `notif-cnc-t-${Date.now()}`,
        session.teacher_id,
        `Session Cancelled by Learner (Compensated +${totalLearnerDeduction.toFixed(2)} Cr)`,
        `Learner ${session.learner_name} cancelled after ${safeMinutesTaught} mins. You were compensated ${totalLearnerDeduction.toFixed(2)} Time Credits for your reserved time. Reason: ${cancellationReason}`,
        now
      );
    }

    // Update sessions table record
    db.prepare(`
      UPDATE sessions 
      SET status = 'CANCELLED',
          cancelled_by = ?,
          cancellation_reason = ?,
          cancellation_time = ?,
          actual_duration = ?,
          cancellation_deduction = ?
      WHERE id = ?
    `).run(
      cancellingUserId,
      cancellationReason || 'Session cancelled early',
      now,
      safeMinutesTaught,
      cancellationDeduction,
      sessionId
    );

    return {
      txUniqueId,
      cancellingUserNewBalance,
      counterpartyNewBalance,
    };
  });

  try {
    const res = cancelTx();
    return {
      success: true,
      message: `Session cancelled successfully. Credits decreased on cancelling user according to ${cancelledMinutes} mins cancelled time.`,
      transactionId: res.txUniqueId,
      actualMinutesTaught: safeMinutesTaught,
      cancelledMinutes,
      proratedCreditsTaught,
      cancellationDeduction,
      cancellingRole: isTeacher ? 'TEACHER' : 'LEARNER',
      cancellingUserNewBalance: res.cancellingUserNewBalance,
      counterpartyNewBalance: res.counterpartyNewBalance,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Cancellation failed and was rolled back: ${error.message}`
    };
  }
}
