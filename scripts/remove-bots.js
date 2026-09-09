const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'timebank.db');
const db = new Database(dbPath);

db.pragma('foreign_keys = OFF');

const botIds = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-test-1788930884833'];

const cleanup = db.transaction(() => {
  for (const bid of botIds) {
    db.prepare('DELETE FROM reviews WHERE reviewer_id = ? OR reviewed_user_id = ?').run(bid, bid);
    db.prepare('DELETE FROM disputes WHERE raised_by = ?').run(bid);
    db.prepare('DELETE FROM transactions WHERE teacher_id = ? OR learner_id = ?').run(bid, bid);
    db.prepare('DELETE FROM skill_proofs WHERE user_id = ?').run(bid);
    db.prepare('DELETE FROM skill_readiness WHERE user_id = ?').run(bid);
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(bid);
    db.prepare('DELETE FROM user_skills WHERE user_id = ?').run(bid);
    db.prepare('DELETE FROM wallets WHERE user_id = ?').run(bid);
    db.prepare('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?').run(bid, bid);
    db.prepare('DELETE FROM reports WHERE reporter_id = ? OR reported_user_id = ?').run(bid, bid);
    db.prepare('DELETE FROM meet_signals WHERE from_user_id = ?').run(bid);
    db.prepare("DELETE FROM learning_requests WHERE (teacher_id = ? OR learner_id = ?) AND id != 'req-1788935883313'").run(bid, bid);
    db.prepare("DELETE FROM sessions WHERE (teacher_id = ? OR learner_id = ?) AND id != 'ses-1788934884101'").run(bid, bid);
    db.prepare('DELETE FROM users WHERE id = ?').run(bid);
  }

  // Point ses-1788934884101 cleanly to Hari Krishna (teacher) and saicharan (learner)
  db.prepare(`
    UPDATE sessions 
    SET teacher_id = 'user-1788931038705', 
        learner_id = 'user-1788935861236', 
        status = 'SCHEDULED',
        meeting_link = 'https://meet.jit.si/TBI_Meet_ses1788934884101_SecureExchange'
    WHERE id = 'ses-1788934884101'
  `).run();

  // Ensure req-1788935883313 is between Hari Krishna & Saicharan
  db.prepare(`
    UPDATE learning_requests
    SET teacher_id = 'user-1788931038705', 
        learner_id = 'user-1788935861236', 
        status = 'PENDING'
    WHERE id = 'req-1788935883313'
  `).run();

  const now = new Date().toISOString();

  // Wallets
  db.prepare(`
    INSERT OR REPLACE INTO wallets (id, user_id, balance, borrowing_limit, total_earned, total_spent, created_at, updated_at)
    VALUES ('wallet-harikrishna', 'user-1788931038705', 5.0, -3.0, 5.0, 0.0, ?, ?)
  `).run(now, now);

  db.prepare(`
    INSERT OR REPLACE INTO wallets (id, user_id, balance, borrowing_limit, total_earned, total_spent, created_at, updated_at)
    VALUES ('wallet-saicharan', 'user-1788935861236', 5.0, -3.0, 5.0, 0.0, ?, ?)
  `).run(now, now);

  // User skills
  const insSkill = db.prepare(`
    INSERT OR REPLACE INTO user_skills (id, user_id, skill_id, type, experience_level, teaching_level, languages, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
  `);

  // Hari Krishna skills
  insSkill.run('us-hk-1', 'user-1788931038705', 'skill-9', 'TEACHING', 'Expert', 'All levels', JSON.stringify(['Telugu', 'English']));
  insSkill.run('us-hk-2', 'user-1788931038705', 'skill-3', 'TEACHING', 'Advanced', 'Intermediate', JSON.stringify(['English', 'Telugu']));
  insSkill.run('us-hk-3', 'user-1788931038705', 'skill-1', 'LEARNING', 'Beginner', null, JSON.stringify(['English']));

  // Saicharan skills
  insSkill.run('us-sc-1', 'user-1788935861236', 'skill-1', 'TEACHING', 'Expert', 'All levels', JSON.stringify(['English', 'Telugu']));
  insSkill.run('us-sc-2', 'user-1788935861236', 'skill-2', 'TEACHING', 'Advanced', 'Beginner', JSON.stringify(['English']));
  insSkill.run('us-sc-3', 'user-1788935861236', 'skill-9', 'LEARNING', 'Intermediate', null, JSON.stringify(['Telugu']));
});

cleanup();
db.pragma('foreign_keys = ON');

console.log('Cleanup complete!');
console.log('Remaining users in database:');
console.log(db.prepare('SELECT id, full_name, username, email FROM users').all());
console.log('Active sessions:');
console.log(db.prepare('SELECT id, teacher_id, learner_id, skill_id, status FROM sessions').all());
console.log('Active requests:');
console.log(db.prepare('SELECT id, teacher_id, learner_id, skill_id, status FROM learning_requests').all());
