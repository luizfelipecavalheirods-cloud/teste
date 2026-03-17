export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  level: number;
  achievements: Achievement[];
  vouchers: Voucher[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface Campaign {
  id: string;
  brandName: string;
  title: string;
  description: string;
  productBarcode: string;
  reward: Reward;
  missions: Mission[];
  status: 'active' | 'draft' | 'ended';
}

export interface Mission {
  id: string;
  type: 'scan' | 'quiz' | 'geo' | 'walk' | 'photo';
  title: string;
  description: string;
  points: number;
  completed: boolean;
  quizId?: string;
  location?: { lat: number; lng: number; radius: number };
  targetDistance?: number;
}

export interface Quiz {
  id: string;
  campaignId: string;
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

export interface Voucher {
  id: string;
  campaignId: string;
  code: string;
  status: 'unused' | 'used';
  expiresAt: string;
}

export interface Reward {
  type: 'coupon' | 'product' | 'points';
  value: string;
  description: string;
}
