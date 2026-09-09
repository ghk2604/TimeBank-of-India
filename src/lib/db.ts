import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'timebank.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT,
      avatar TEXT,
      bio TEXT,
      city TEXT,
      state TEXT,
      languages TEXT, -- JSON array
      verification_status TEXT DEFAULT 'VERIFIED',
      reputation_score INTEGER DEFAULT 75,
      trust_level TEXT DEFAULT 'Active Learner',
      learning_streak INTEGER DEFAULT 3,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      balance REAL DEFAULT 2.0,
      borrowing_limit REAL DEFAULT -1.0,
      total_earned REAL DEFAULT 0.0,
      total_spent REAL DEFAULT 0.0,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS user_skills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      type TEXT NOT NULL, -- 'TEACHING' or 'LEARNING'
      experience_level TEXT,
      teaching_level TEXT,
      languages TEXT,
      status TEXT DEFAULT 'ACTIVE',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skill_proofs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      assessment_score REAL DEFAULT 0,
      practical_task_status TEXT DEFAULT 'COMPLETED',
      portfolio_url TEXT,
      verification_status TEXT DEFAULT 'VERIFIED',
      created_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skill_readiness (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      assessment_score REAL DEFAULT 0,
      practical_score REAL DEFAULT 0,
      learning_experience_score REAL DEFAULT 0,
      teaching_feedback_score REAL DEFAULT 0,
      final_score REAL DEFAULT 0,
      readiness_tier TEXT DEFAULT 'Ready',
      updated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_paths (
      id TEXT PRIMARY KEY,
      skill_id TEXT,
      path_name TEXT NOT NULL,
      description TEXT,
      target_role TEXT
    );

    CREATE TABLE IF NOT EXISTS learning_path_steps (
      id TEXT PRIMARY KEY,
      learning_path_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      prerequisites TEXT,
      FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
      FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS learning_requests (
      id TEXT PRIMARY KEY,
      learner_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      learning_goal TEXT NOT NULL,
      expected_outcome TEXT,
      preferred_date TEXT NOT NULL,
      preferred_time TEXT NOT NULL,
      duration INTEGER NOT NULL,
      credit_cost REAL NOT NULL,
      status TEXT DEFAULT 'PENDING',
      response_deadline TEXT NOT NULL,
      created_at TEXT,
      FOREIGN KEY (learner_id) REFERENCES users(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id),
      FOREIGN KEY (skill_id) REFERENCES skills(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      learner_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      learning_goal TEXT NOT NULL,
      expected_outcome TEXT,
      start_time TEXT,
      end_time TEXT,
      duration INTEGER NOT NULL,
      credit_amount REAL NOT NULL,
      status TEXT DEFAULT 'SCHEDULED',
      learner_confirmation INTEGER DEFAULT 0,
      teacher_confirmation INTEGER DEFAULT 0,
      outcome_status TEXT,
      teacher_outcome TEXT,
      meeting_link TEXT,
      session_notes TEXT,
      cancelled_by TEXT,
      cancellation_reason TEXT,
      cancellation_time TEXT,
      actual_duration INTEGER,
      cancellation_deduction REAL,
      created_at TEXT,
      FOREIGN KEY (learner_id) REFERENCES users(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id),
      FOREIGN KEY (skill_id) REFERENCES skills(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      transaction_id TEXT UNIQUE NOT NULL,
      session_id TEXT,
      teacher_id TEXT,
      learner_id TEXT,
      credit_amount REAL NOT NULL,
      transaction_type TEXT NOT NULL,
      status TEXT DEFAULT 'COMPLETED',
      description TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      reviewed_user_id TEXT NOT NULL,
      rating REAL NOT NULL,
      knowledge_rating REAL,
      teaching_rating REAL,
      communication_rating REAL,
      punctuality_rating REAL,
      review TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      raised_by TEXT NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'PENDING',
      resolution TEXT,
      created_at TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      reported_user_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS learning_activities (
      id TEXT PRIMARY KEY,
      skill_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      quiz_required INTEGER DEFAULT 1,
      practical_task_required INTEGER DEFAULT 1,
      minimum_score INTEGER DEFAULT 70,
      credit_reward REAL DEFAULT 0.25,
      FOREIGN KEY (skill_id) REFERENCES skills(id)
    );

    CREATE TABLE IF NOT EXISTS access_keys (
      id TEXT PRIMARY KEY,
      user_name TEXT NOT NULL,
      email TEXT NOT NULL,
      institution TEXT,
      purpose TEXT NOT NULL,
      key_code TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'APPROVED',
      starter_credits REAL DEFAULT 1.0,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS otps (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      otp_code TEXT NOT NULL,
      type TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      verified INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meet_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      from_user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_meet_signals ON meet_signals (session_id, created_at);
  `);

  // Ensure cancellation columns exist on sessions table
  try {
    const tableInfo = db.prepare(`PRAGMA table_info(sessions)`).all() as any[];
    const columnNames = new Set(tableInfo.map(c => c.name));
    if (!columnNames.has('cancelled_by')) {
      db.prepare(`ALTER TABLE sessions ADD COLUMN cancelled_by TEXT`).run();
    }
    if (!columnNames.has('cancellation_reason')) {
      db.prepare(`ALTER TABLE sessions ADD COLUMN cancellation_reason TEXT`).run();
    }
    if (!columnNames.has('cancellation_time')) {
      db.prepare(`ALTER TABLE sessions ADD COLUMN cancellation_time TEXT`).run();
    }
    if (!columnNames.has('actual_duration')) {
      db.prepare(`ALTER TABLE sessions ADD COLUMN actual_duration INTEGER`).run();
    }
    if (!columnNames.has('cancellation_deduction')) {
      db.prepare(`ALTER TABLE sessions ADD COLUMN cancellation_deduction REAL`).run();
    }
  } catch (err) {
    console.error('Migration error for sessions columns:', err);
  }

  seedInitialData();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT count(*) as cnt FROM users').get() as { cnt: number };
  if (userCount.cnt > 0) return;

  const now = new Date().toISOString();

  // 1. Insert Skills (Strictly skill & knowledge based, NO gardening or physical services)
  const insertSkill = db.prepare(`
    INSERT OR IGNORE INTO skills (id, name, category, description, icon) VALUES (?, ?, ?, ?, ?)
  `);

  const skills = [
    { id: 'skill-1', name: 'Python Programming', category: 'TECHNOLOGY', description: 'Syntax, functions, OOP, data structures, and algorithmic problem solving.', icon: 'Terminal' },
    { id: 'skill-2', name: 'UI/UX Design', category: 'CREATIVE', description: 'Wireframing, Figma prototyping, typography, and human-centered design systems.', icon: 'Palette' },
    { id: 'skill-3', name: 'Web Development (React & Next.js)', category: 'TECHNOLOGY', description: 'Modern frontend engineering with React components, hooks, state, and server actions.', icon: 'Code' },
    { id: 'skill-4', name: 'Mathematics (Calculus & Linear Algebra)', category: 'EDUCATION', description: 'Foundational mathematics for computing, machine learning, and higher academics.', icon: 'Calculator' },
    { id: 'skill-5', name: 'Machine Learning Fundamentals', category: 'TECHNOLOGY', description: 'Supervised & unsupervised learning, model training, evaluation, and Scikit-Learn.', icon: 'Cpu' },
    { id: 'skill-6', name: 'English Communication & Public Speaking', category: 'PROFESSIONAL', description: 'Fluency, voice modulation, impromptu speaking, corporate presentations, and interviews.', icon: 'Mic' },
    { id: 'skill-7', name: 'Data Structures & Algorithms', category: 'TECHNOLOGY', description: 'Arrays, Trees, Graphs, Dynamic Programming, and technical interview mastery.', icon: 'Layers' },
    { id: 'skill-8', name: 'Physics (Mechanics & Electromagnetism)', category: 'EDUCATION', description: 'Core principles of classical physics, problem solving for IIT-JEE/NEET.', icon: 'Atom' },
    { id: 'skill-9', name: 'Telugu Language Mastery', category: 'LANGUAGES', description: 'Spoken fluency, formal literature, script reading, and cultural nuances.', icon: 'Languages' },
    { id: 'skill-10', name: 'Hindi Professional Communication', category: 'LANGUAGES', description: 'Conversational confidence, professional etiquette, and vocabulary development.', icon: 'BookOpen' },
  ];

  for (const s of skills) {
    insertSkill.run(s.id, s.name, s.category, s.description, s.icon);
  }

  // 2. Insert Users

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, full_name, username, email, phone, password_hash, avatar, bio, city, state, languages, verification_status, reputation_score, trust_level, learning_streak, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertWallet = db.prepare(`
    INSERT OR IGNORE INTO wallets (id, user_id, balance, borrowing_limit, total_earned, total_spent, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const users = [
    {
      id: 'user-1788931038705',
      fullName: 'Hari Krishna',
      username: 'harikrishna',
      email: 'harikrishna26888@gmail.com',
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
      bio: 'Verified Instructor passionate about Telugu literature, spoken fluency, and software development.',
      city: 'Hyderabad',
      state: 'Telangana',
      languages: JSON.stringify(['English', 'Telugu']),
      verification: 'VERIFIED',
      reputation: 95,
      trust: 'Verified Instructor',
      streak: 15,
      wallet: { balance: 5.0, borrowingLimit: -3.0, earned: 15.0, spent: 5.0 }
    },
    {
      id: 'user-1788935861236',
      fullName: 'saicharan',
      username: 'sai',
      email: 'pullakanandamsaicharan5838@gmail.com',
      phone: '+91 98111 22334',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
      bio: 'Active learner and developer exploring Python and UI/UX design in exchange for time credits.',
      city: 'Bengaluru',
      state: 'Karnataka',
      languages: JSON.stringify(['English', 'Telugu']),
      verification: 'VERIFIED',
      reputation: 90,
      trust: 'Active Learner',
      streak: 8,
      wallet: { balance: 5.0, borrowingLimit: -3.0, earned: 10.0, spent: 5.0 }
    }
  ];

  for (const u of users) {
    insertUser.run(
      u.id, u.fullName, u.username, u.email, u.phone, 'India@123', u.avatar, u.bio,
      u.city, u.state, u.languages, u.verification, u.reputation, u.trust,
      u.streak, now, now
    );

    insertWallet.run(
      `wallet-${u.id}`, u.id, u.wallet.balance, u.wallet.borrowingLimit,
      u.wallet.earned, u.wallet.spent, now, now
    );
  }

  // 3. User Skills (Teaching & Learning)
  const insertUserSkill = db.prepare(`
    INSERT OR IGNORE INTO user_skills (id, user_id, skill_id, type, experience_level, teaching_level, languages, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
  `);

  // Rahul teaches Python & Web Dev; wants to learn UI/UX & Public Speaking
  insertUserSkill.run('us-1', 'user-1', 'skill-1', 'TEACHING', 'Expert', 'Intermediate learners', JSON.stringify(['English', 'Hindi', 'Telugu']));
  insertUserSkill.run('us-2', 'user-1', 'skill-3', 'TEACHING', 'Advanced', 'Beginner learners', JSON.stringify(['English', 'Telugu']));
  insertUserSkill.run('us-3', 'user-1', 'skill-2', 'LEARNING', 'Beginner', null, JSON.stringify(['English']));
  insertUserSkill.run('us-4', 'user-1', 'skill-6', 'LEARNING', 'Intermediate', null, JSON.stringify(['English', 'Hindi']));

  // Priya teaches UI/UX & Creative; wants to learn Python & ML
  insertUserSkill.run('us-5', 'user-2', 'skill-2', 'TEACHING', 'Expert', 'Advanced learners', JSON.stringify(['English', 'Hindi']));
  insertUserSkill.run('us-6', 'user-2', 'skill-1', 'LEARNING', 'Beginner', null, JSON.stringify(['English']));
  insertUserSkill.run('us-7', 'user-2', 'skill-5', 'LEARNING', 'Beginner', null, JSON.stringify(['English']));

  // Anjali teaches Math & English; wants to learn Python
  insertUserSkill.run('us-8', 'user-3', 'skill-4', 'TEACHING', 'Advanced', 'Beginner learners', JSON.stringify(['English', 'Telugu']));
  insertUserSkill.run('us-9', 'user-3', 'skill-6', 'TEACHING', 'Advanced', 'Intermediate learners', JSON.stringify(['English']));
  insertUserSkill.run('us-10', 'user-3', 'skill-1', 'LEARNING', 'Intermediate', null, JSON.stringify(['English', 'Telugu']));

  // Vikram teaches Web Dev; wants to learn ML
  insertUserSkill.run('us-11', 'user-4', 'skill-3', 'TEACHING', 'Intermediate', 'Beginner learners', JSON.stringify(['English', 'Hindi']));
  insertUserSkill.run('us-12', 'user-4', 'skill-5', 'LEARNING', 'Beginner', null, JSON.stringify(['English']));

  // Dr. Neha teaches Physics & ML
  insertUserSkill.run('us-13', 'user-5', 'skill-8', 'TEACHING', 'Expert', 'Advanced learners', JSON.stringify(['English', 'Hindi']));
  insertUserSkill.run('us-14', 'user-5', 'skill-5', 'TEACHING', 'Expert', 'Intermediate learners', JSON.stringify(['English']));

  // 4. Skill Proofs & Readiness Scores
  const insertProof = db.prepare(`
    INSERT OR IGNORE INTO skill_proofs (id, user_id, skill_id, assessment_score, practical_task_status, portfolio_url, verification_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReadiness = db.prepare(`
    INSERT OR IGNORE INTO skill_readiness (id, user_id, skill_id, assessment_score, practical_score, learning_experience_score, teaching_feedback_score, final_score, readiness_tier, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Rahul - Python Readiness: 88
  insertProof.run('sp-1', 'user-1', 'skill-1', 92, 'COMPLETED', 'https://github.com/rahulkumar/python-algorithms', 'VERIFIED', now);
  insertReadiness.run('sr-1', 'user-1', 'skill-1', 92, 88, 85, 87, 88, 'Highly Ready', now);

  // Priya - UI/UX Readiness: 94
  insertProof.run('sp-2', 'user-2', 'skill-2', 96, 'COMPLETED', 'https://figma.com/@priyadesign', 'VERIFIED', now);
  insertReadiness.run('sr-2', 'user-2', 'skill-2', 96, 95, 90, 95, 94, 'Highly Ready', now);

  // Anjali - Mathematics: 82
  insertProof.run('sp-3', 'user-3', 'skill-4', 85, 'COMPLETED', 'https://anjalirao.in/math-notes', 'VERIFIED', now);
  insertReadiness.run('sr-3', 'user-3', 'skill-4', 85, 80, 80, 83, 82, 'Ready', now);

  // Vikram - Web Dev: 68
  insertProof.run('sp-4', 'user-4', 'skill-3', 72, 'COMPLETED', 'https://github.com/vikramdev', 'VERIFIED', now);
  insertReadiness.run('sr-4', 'user-4', 'skill-3', 72, 70, 65, 65, 68, 'Ready', now);

  // 5. Learning Paths & Steps
  const insertPath = db.prepare(`
    INSERT OR IGNORE INTO learning_paths (id, skill_id, path_name, description, target_role) VALUES (?, ?, ?, ?, ?)
  `);
  const insertStep = db.prepare(`
    INSERT OR IGNORE INTO learning_path_steps (id, learning_path_id, skill_id, step_order, prerequisites) VALUES (?, ?, ?, ?, ?)
  `);

  insertPath.run('lp-1', 'skill-3', 'Full Stack Web Developer Path', 'Master modern web applications from HTML fundamentals to production Next.js and backend APIs.', 'Full Stack Software Engineer');
  insertStep.run('lps-1', 'lp-1', 'skill-1', 1, 'Basic Computer Literacy');
  insertStep.run('lps-2', 'lp-1', 'skill-3', 2, 'Python or Basic JavaScript Syntax');
  insertStep.run('lps-3', 'lp-1', 'skill-2', 3, 'HTML/CSS Fundamentals');
  insertStep.run('lps-4', 'lp-1', 'skill-7', 4, 'React Component Lifecycle & State');

  insertPath.run('lp-2', 'skill-5', 'AI & Machine Learning Specialist', 'From calculus foundations to production predictive modeling and neural networks.', 'Machine Learning Engineer');
  insertStep.run('lps-5', 'lp-2', 'skill-1', 1, 'None');
  insertStep.run('lps-6', 'lp-2', 'skill-4', 2, 'Python Fundamentals');
  insertStep.run('lps-7', 'lp-2', 'skill-5', 3, 'Calculus & Linear Algebra');

  // 6. Learning Requests & 24-Hour Expiry Rule Demo
  const insertRequest = db.prepare(`
    INSERT OR IGNORE INTO learning_requests (id, learner_id, teacher_id, skill_id, learning_goal, expected_outcome, preferred_date, preferred_time, duration, credit_cost, status, response_deadline, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Pending request with 24-hour countdown for Rahul from Vikram
  const deadline = new Date(Date.now() + 21 * 3600 * 1000 + 35 * 60 * 1000).toISOString(); // ~21 hours remaining
  insertRequest.run(
    'req-1', 'user-4', 'user-1', 'skill-1',
    'Understand Python Decorators and Generators for data pipelines.',
    'Build 2 custom decorators and a memory-efficient generator function.',
    'Tomorrow', '6:00 PM - 7:00 PM', 60, 1.0, 'PENDING', deadline, now
  );

  // 7. Completed Sessions with Atomic Transactions (Knowledge Lineage)
  const insertSession = db.prepare(`
    INSERT OR IGNORE INTO sessions (id, request_id, learner_id, teacher_id, skill_id, learning_goal, expected_outcome, start_time, end_time, duration, credit_amount, status, learner_confirmation, teacher_confirmation, outcome_status, teacher_outcome, meeting_link, session_notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTx = db.prepare(`
    INSERT OR IGNORE INTO transactions (id, transaction_id, session_id, teacher_id, learner_id, credit_amount, transaction_type, status, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Session 1: Rahul teaches Python to Priya (1 hour = 1.0 credit)
  const session1Time = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
  insertSession.run(
    'ses-1', 'req-old-1', 'user-2', 'user-1', 'skill-1',
    'Master Object-Oriented Programming in Python',
    'Define class hierarchies, inheritance, and encapsulation.',
    session1Time, session1Time, 60, 1.0, 'CONFIRMED', 1, 1, 'GOAL_ACHIEVED', 'SUCCESSFUL',
    'https://timebankindia.in/room/ses-1', 'Priya wrote a complete banking domain model with high precision.', session1Time
  );
  insertTx.run(
    'tx-1', 'TX-IND-90218-01', 'ses-1', 'user-1', 'user-2', 1.0, 'SESSION_PAYMENT', 'COMPLETED',
    'Teaching Python Programming to Priya Sharma (60 mins)', session1Time
  );

  // Session 2: Priya teaches UI/UX to Rahul (1 hour = 1.0 credit)
  const session2Time = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
  insertSession.run(
    'ses-2', 'req-old-2', 'user-1', 'user-2', 'skill-2',
    'Design System Tokens & Auto-layout in Figma',
    'Build a responsive navbar and dashboard layout component.',
    session2Time, session2Time, 60, 1.0, 'CONFIRMED', 1, 1, 'GOAL_ACHIEVED', 'SUCCESSFUL',
    'https://timebankindia.in/room/ses-2', 'Rahul mastered Figma components and constraints flawlessly.', session2Time
  );
  insertTx.run(
    'tx-2', 'TX-IND-90218-02', 'ses-2', 'user-2', 'user-1', 1.0, 'SESSION_PAYMENT', 'COMPLETED',
    'Teaching UI/UX Design to Rahul Kumar (60 mins)', session2Time
  );

  // Session 3: Rahul teaches Python to Anjali (45 mins = 0.75 credit)
  const session3Time = new Date(Date.now() - 1 * 86400 * 1000).toISOString();
  insertSession.run(
    'ses-3', 'req-old-3', 'user-3', 'user-1', 'skill-1',
    'Python Data Structures for Mathematical Modeling',
    'Understand lists, dicts, tuples, and comprehension for numerical series.',
    session3Time, session3Time, 45, 0.75, 'CONFIRMED', 1, 1, 'GOAL_ACHIEVED', 'SUCCESSFUL',
    'https://timebankindia.in/room/ses-3', 'Anjali demonstrated exceptional algorithmic problem-solving.', session3Time
  );
  insertTx.run(
    'tx-3', 'TX-IND-90218-03', 'ses-3', 'user-1', 'user-3', 0.75, 'SESSION_PAYMENT', 'COMPLETED',
    'Teaching Python Programming to Anjali Rao (45 mins)', session3Time
  );

  // 8. Reviews
  const insertReview = db.prepare(`
    INSERT OR IGNORE INTO reviews (id, session_id, reviewer_id, reviewed_user_id, rating, knowledge_rating, teaching_rating, communication_rating, punctuality_rating, review, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertReview.run(
    'rev-1', 'ses-1', 'user-2', 'user-1', 5.0, 5.0, 5.0, 5.0, 5.0,
    'Rahul is a world-class Python mentor! He explained OOP concepts using relatable Indian railway reservation examples. Extremely patient and insightful.', session1Time
  );
  insertReview.run(
    'rev-2', 'ses-2', 'user-1', 'user-2', 5.0, 5.0, 5.0, 5.0, 5.0,
    'Priya made Figma feel effortless. The auto-layout exercise gave me instant confidence to build real product UI.', session2Time
  );
  insertReview.run(
    'rev-3', 'ses-3', 'user-3', 'user-1', 4.8, 5.0, 4.8, 4.8, 5.0,
    'Superb mathematical alignment with Python. Will definitely book another session for advanced algorithms!', session3Time
  );

  // 9. Notifications
  const insertNotif = db.prepare(`
    INSERT OR IGNORE INTO notifications (id, user_id, title, message, type, is_read, link, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertNotif.run(
    'notif-1', 'user-1', 'New Learning Request (21h left to respond)',
    'Vikram Patel requested a 60-min session on Python Decorators. Review and respond within 24 hours.',
    'REQUEST', 0, '/dashboard', now
  );
  insertNotif.run(
    'notif-2', 'user-1', '+1.0 Time Credit Received',
    'Priya Sharma confirmed session completion for Python OOP. 1.0 Time Credit added to your Time Wallet.',
    'CREDIT', 1, '/wallet', session1Time
  );
  insertNotif.run(
    'notif-3', 'user-4', 'Credit Recovery Opportunity',
    'Your Time Credit balance is -1.0. Teach Web Development to recover credits and boost your trust tier!',
    'CREDIT', 0, '/wallet', now
  );

  // 10. Messages
  const insertMsg = db.prepare(`
    INSERT OR IGNORE INTO messages (id, sender_id, receiver_id, content, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertMsg.run('msg-1', 'user-4', 'user-1', 'Namaste Rahul Ji! Looking forward to learning Python decorators tomorrow if you accept.', 1, now);
  insertMsg.run('msg-2', 'user-1', 'user-4', 'Namaste Vikram! Yes, I saw your request. Have your VS Code setup ready with Python 3.11+.', 1, now);
}

// Ensure DB is initialized on module load
initDB();

export default db;
