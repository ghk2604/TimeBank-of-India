export type Role = 'LEARNER' | 'TEACHER' | 'ADMIN';

export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type TeachingLevel = 'Beginner learners' | 'Intermediate learners' | 'Advanced learners';

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
export type SessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CONFIRMED' | 'DISPUTED';

export type LearnerOutcome = 'GOAL_ACHIEVED' | 'PARTIALLY_ACHIEVED' | 'NOT_ACHIEVED';
export type TeacherOutcome = 'SUCCESSFUL' | 'NEEDS_ANOTHER_SESSION' | 'INCOMPLETE';

export type ReadinessTier = 'Low Readiness' | 'Developing' | 'Ready' | 'Highly Ready';

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  avatar: string;
  bio: string;
  city: string;
  state: string;
  languages: string[];
  verificationStatus: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  reputationScore: number;
  trustLevel: 'New Member' | 'Active Learner' | 'Active Teacher' | 'Trusted Member' | 'Skill Expert';
  learningStreak: number;
  createdAt: string;
  role?: Role;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  borrowingLimit: number; // e.g. -1.0, -2.0, -3.0
  totalEarned: number;
  totalSpent: number;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  category: 'TECHNOLOGY' | 'EDUCATION' | 'CREATIVE' | 'PROFESSIONAL' | 'LANGUAGES';
  description: string;
  icon: string;
}

export interface UserSkill {
  id: string;
  userId: string;
  skillId: string;
  skillName?: string;
  skillCategory?: string;
  type: 'TEACHING' | 'LEARNING';
  experienceLevel: ExperienceLevel;
  teachingLevel?: TeachingLevel;
  languages: string[];
  status: string;
}

export interface SkillProof {
  id: string;
  userId: string;
  skillId: string;
  skillName?: string;
  assessmentScore: number;
  practicalTaskStatus: 'NOT_STARTED' | 'PENDING' | 'COMPLETED';
  portfolioUrl?: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export interface SkillReadiness {
  id: string;
  userId: string;
  skillId: string;
  skillName?: string;
  assessmentScore: number; // 30% weight
  practicalScore: number; // 25% weight
  learningExperienceScore: number; // 20% weight
  teachingFeedbackScore: number; // 25% weight
  finalScore: number; // 0-100
  readinessTier: ReadinessTier;
  updatedAt: string;
}

export interface LearningPath {
  id: string;
  skillId?: string;
  pathName: string;
  description: string;
  targetRole: string;
  steps?: LearningPathStep[];
}

export interface LearningPathStep {
  id: string;
  learningPathId: string;
  skillId: string;
  skillName?: string;
  stepOrder: number;
  prerequisites: string;
}

export interface LearningRequest {
  id: string;
  learnerId: string;
  learnerName?: string;
  learnerAvatar?: string;
  teacherId: string;
  teacherName?: string;
  teacherAvatar?: string;
  skillId: string;
  skillName?: string;
  learningGoal: string;
  expectedOutcome?: string;
  preferredDate: string;
  preferredTime: string;
  duration: number; // 15, 30, 45, 60, 90
  creditCost: number; // duration / 60
  status: RequestStatus;
  responseDeadline: string; // 24 hours from creation
  createdAt: string;
}

export interface Session {
  id: string;
  requestId?: string;
  learnerId: string;
  learnerName?: string;
  learnerAvatar?: string;
  teacherId: string;
  teacherName?: string;
  teacherAvatar?: string;
  skillId: string;
  skillName?: string;
  learningGoal: string;
  expectedOutcome: string;
  startTime: string;
  endTime: string;
  duration: number;
  creditAmount: number;
  status: SessionStatus;
  learnerConfirmation: boolean;
  teacherConfirmation: boolean;
  outcomeStatus?: LearnerOutcome;
  teacherOutcome?: TeacherOutcome;
  meetingLink?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  transactionId: string;
  sessionId?: string;
  teacherId?: string;
  teacherName?: string;
  learnerId?: string;
  learnerName?: string;
  creditAmount: number;
  transactionType: 'SESSION_PAYMENT' | 'LEARNING_REWARD' | 'REFERRAL_BONUS';
  status: 'COMPLETED' | 'REVERTED' | 'HELD';
  description: string;
  createdAt: string;
}

export interface Review {
  id: string;
  sessionId: string;
  reviewerId: string;
  reviewerName?: string;
  reviewerAvatar?: string;
  reviewedUserId: string;
  rating: number; // 1 to 5
  knowledgeRating?: number;
  teachingRating?: number;
  communicationRating?: number;
  punctualityRating?: number;
  review: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'REQUEST' | 'SESSION' | 'CREDIT' | 'EXPIRY' | 'DISPUTE' | 'ACHIEVEMENT';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  receiverId: string;
  receiverName?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Dispute {
  id: string;
  sessionId: string;
  sessionGoal?: string;
  raisedBy: string;
  raisedByName?: string;
  reason: string;
  description: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  resolution?: string;
  createdAt: string;
}

export interface KnowledgeImpact {
  userId: string;
  directLearnersCount: number;
  extendedReachCount: number;
  totalKnowledgeReach: number;
  teachingHours: number;
  skillsShared: number;
  learnersWhoBecameTeachers: number;
  chain: Array<{
    learnerName: string;
    skill: string;
    date: string;
    subLearners?: Array<{ name: string; date: string }>;
  }>;
}
