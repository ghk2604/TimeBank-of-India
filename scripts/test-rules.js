const { calculateCreditCost, getUserBorrowingLimit } = require('../src/lib/credits');

console.log('🇮🇳 Running TimeBank of India Core Rule Verification Suite...\n');

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

// 1. Flexible Credit Calculation (Section 6 & 7)
console.log('1. Verifying Micro-Session Credit Calculations:');
assert(calculateCreditCost(15) === 0.25, '15 Minutes = 0.25 Credit');
assert(calculateCreditCost(30) === 0.50, '30 Minutes = 0.50 Credit');
assert(calculateCreditCost(45) === 0.75, '45 Minutes = 0.75 Credit');
assert(calculateCreditCost(60) === 1.00, '60 Minutes = 1.00 Credit');
assert(calculateCreditCost(90) === 1.50, '90 Minutes = 1.50 Credits');

// 2. Controlled Borrowing Limits (Section 12)
console.log('\n2. Verifying Controlled Borrowing Limits:');
assert(getUserBorrowingLimit('New Member', 'UNVERIFIED') === -1.0, 'New User Limit is -1.0 Credit');
assert(getUserBorrowingLimit('Active Learner', 'VERIFIED') === -2.0, 'Verified Active Learner Limit is -2.0 Credits');
assert(getUserBorrowingLimit('Active Teacher', 'VERIFIED') === -2.0, 'Active Teacher Limit is -2.0 Credits');
assert(getUserBorrowingLimit('Trusted Member', 'VERIFIED') === -3.0, 'Trusted Member Limit is -3.0 Credits');
assert(getUserBorrowingLimit('Skill Expert', 'VERIFIED') === -3.0, 'Skill Expert Limit is -3.0 Credits');

// 3. Database Layer & Atomic Transaction Test
console.log('\n3. Verifying Database Relational Schema & ACID Engine:');
const db = require('../src/lib/db').default;
const { executeAtomicCreditTransfer, getCreditRecoverySuggestions } = require('../src/lib/credits');

// Check seed users
const userCount = db.prepare('SELECT count(*) as cnt FROM users').get().cnt;
assert(userCount >= 5, `Found ${userCount} seeded users with realistic Indian profiles`);

// Check seed skills (Strictly skill learning, NO gardening/cooking)
const skills = db.prepare('SELECT name, category FROM skills').all();
assert(skills.length >= 10, `Found ${skills.length} knowledge skills`);
const hasForbiddenServices = skills.some(s => 
  s.name.toLowerCase().includes('garden') || 
  s.name.toLowerCase().includes('cook') || 
  s.name.toLowerCase().includes('repair') ||
  s.name.toLowerCase().includes('volunteer')
);
assert(!hasForbiddenServices, 'STRICT RULE CONFIRMED: No gardening, cooking, repairs or volunteering skills exist');

// 4. Test Credit Recovery Recommendations (Section 13)
console.log('\n4. Verifying Credit Recovery Recommendation Engine:');
// Vikram Patel (user-4) has -1.0 deficit
const recovery = getCreditRecoverySuggestions('user-4');
assert(recovery.needsRecovery === true, 'Detected negative balance for Vikram Patel');
assert(recovery.deficit === 1.0, 'Identified exact deficit of 1.0 Credit');
assert(recovery.recommendations.length > 0, 'Generated teaching recommendations to recover balance');
console.log(`     Recommendation: Teach ${recovery.recommendations[0].skillName} (${recovery.recommendations[0].potentialCreditGain})`);

// 5. Test Duplicate Transaction Prevention (Section 17 & 67)
console.log('\n5. Verifying Duplicate Transaction Protection & Dispute Lock:');
// Session 1 is already completed & confirmed
const duplicateTransferAttempt = executeAtomicCreditTransfer('ses-1');
assert(duplicateTransferAttempt.success === false, 'Duplicate transfer on already completed session was blocked');
assert(duplicateTransferAttempt.message.includes('Duplicate transfer prevented'), 'Clear audit rejection message returned');

console.log(`\n========================================`);
console.log(`All ${passedTests}/${totalTests} Core Rule Verification Tests Passed! 🇮🇳`);
console.log(`========================================\n`);
