
export interface User {
  _id: string;
  id?: string;
  username: string;
  email: string;
  fname: string;
  lname: string;
  parentEmail?: string;
  plan?: string;
  gender: 'male' | 'female' | 'other';
  dob?: Date;
  startedPracticing?: Date;
  hidden?: boolean;
  emailVerified?: boolean;
  status?: 'active' | 'inactive' | 'pending' | 'suspended' | 'banned';
  type?: 'USER' | 'ADMIN';
  referralCode?: string;
  referredBy?: string;
  referralStatus?: 'Pending' | 'Verified' | 'Rejected';
  referralStats?: {
    totalReferrals: number;
    activeReferrals: number;
    completedReferrals: number;
  };
  videoCallCredits?: number;
  waliDetails?: string;
  kunya?: string;
  nationality?: string;
  country?: string;
  region?: string;
  build?: string;
  appearance?: string;
  maritalStatus?: string;
  noOfChildren?: string;
  ethnicity?: string;
  patternOfSalaah?: string;
  genotype?: string;
  summary?: string;
  workEducation?: string;
  lastSeen?: Date;
  favorites?: string[];
  profile_pic?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
  fname: string;
  lname: string;
  gender: 'male' | 'female' | 'other';
  parentEmail?: string;
}

export interface AuthResponse {
  _id: string;
  username: string;
  email: string;
  fname: string;
  lname: string;
  gender: string;
  type: string;
  token: string;
  user: User;
}

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  fname: string;
  lname: string;
  type: 'ADMIN';
}
