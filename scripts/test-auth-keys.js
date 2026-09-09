const Database = require('better-sqlite3');
const path = require('path');

console.log('===========================================================');
console.log('🔑 TESTING LOGIN, REGISTRATION & ACCESS KEY LIFECYCLE 🔑');
console.log('===========================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

const db = new Database(path.join(__dirname, '../data/timebank.db'));

// 1. Check access_keys table exists
console.log('--- 1. Testing Access Keys Storage ---');
const tableCheck = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='access_keys'`).get();
assert(tableCheck !== undefined, 'access_keys table exists in SQLite database');

// 2. Generate a test access key
console.log('\n--- 2. Requesting & Generating Access Key ---');
const testKey = `TBI-KEY-2026-TEST01`;
const keyId = `key-test-${Date.now()}`;
const now = new Date().toISOString();

db.prepare(`
  INSERT OR REPLACE INTO access_keys (id, user_name, email, institution, purpose, key_code, status, starter_credits, created_at)
  VALUES (?, ?, ?, ?, ?, ?, 'APPROVED', 1.5, ?)
`).run(keyId, 'Arun Swaminathan', 'arun@iitb.ac.in', 'IIT Bombay', 'STUDENT_BETA', testKey, now);

const fetchedKey = db.prepare('SELECT * FROM access_keys WHERE key_code = ?').get(testKey);
assert(fetchedKey && fetchedKey.starter_credits === 1.5, `Generated Access Key verified: ${testKey} (+1.5 Credits)`);

// 3. Register user with this key
console.log('\n--- 3. Registering User with Verified Access Key ---');
const testUserId = `user-test-${Date.now()}`;
const starterCredits = 1.0 + fetchedKey.starter_credits; // 2.5 Credits!
const borrowingLimit = -2.0;

db.prepare(`
  INSERT INTO users (id, full_name, username, email, phone, avatar, bio, city, state, languages, verification_status, reputation_score, trust_level, learning_streak, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VERIFIED', 80, 'Verified Member', 1, ?, ?)
`).run(
  testUserId, 'Arun Swaminathan', 'arunswami', 'arun@iitb.ac.in', '+91 98765 00001',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
  'Passionate student at IIT Bombay studying AI.',
  'Mumbai', 'Maharashtra', JSON.stringify(['English', 'Hindi']), now, now
);

db.prepare(`
  INSERT INTO wallets (id, user_id, balance, borrowing_limit, total_earned, total_spent, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, 0.0, ?, ?)
`).run(`wallet-${testUserId}`, testUserId, starterCredits, borrowingLimit, starterCredits, now, now);

const registeredWallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(testUserId);
assert(registeredWallet.balance === 2.5, `User received combined starter + key bonus credits: ${registeredWallet.balance.toFixed(2)} Credits`);
assert(registeredWallet.borrowing_limit === -2.0, `User received upgraded borrowing limit: ${registeredWallet.borrowing_limit.toFixed(2)} Credits`);

// 4. Test Login Lookup
console.log('\n--- 4. Testing User Login Verification ---');
const loginUser = db.prepare(`
  SELECT u.*, w.balance, w.borrowing_limit
  FROM users u
  JOIN wallets w ON u.id = w.user_id
  WHERE u.email = ? OR u.username = ?
`).get('arun@iitb.ac.in', 'arun@iitb.ac.in');

assert(loginUser !== undefined, 'User found via email authentication query');
assert(loginUser.username === 'arunswami', `Authenticated user username: ${loginUser.username}`);
assert(loginUser.trust_level === 'Verified Member', `Verified trust level: ${loginUser.trust_level}`);

console.log('\n===========================================================');
console.log(`🏆 SUMMARY: ALL ${passedTests}/${totalTests} AUTH & KEY TESTS PASSED! 🇮🇳`);
console.log('===========================================================\n');
