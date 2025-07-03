export interface User {
  _id: string;
  id?: string;
  username: string;
  email: string;
  fname: string;
  lname: string;
  plan?: string | null;
  gender: "male" | "female";
  dob?: string | Date | null;
  startedPracticing?: string | Date | null;
  hidden?: boolean | null;
  status?: string;
  type?: string;
  validationToken?: string;
  resetPasswordToken?: string;
  resetPasswordTokenExpiration?: Date | null;
  referralCode?: string;
  referredBy?: string;
  referralStatus?: string;
  referralStats?: {
    totalReferrals: number;
    activeReferrals: number;
    completedReferrals: number;
  };
  videoCallCredits?: number;
  waliDetails?: string; // JSON string
  kunya?: string;
  nationality?: string;
  country?: string;
  region?: string;
  build?: string | null;
  appearance?: string | null;
  maritalStatus?: string;
  noOfChildren?: string;
  ethnicity?: string; // JSON string array
  patternOfSalaah?: string;
  genotype?: string | null;
  summary?: string;
  workEducation?: string;
  lastSeen?: Date;
  favorites?: string[];
  traits?: string; // JSON string array
  revert?: string;
  scholarsSpeakers?: string;
  height?: string | null;
  weight?: string | null;
  emailVerified?: boolean;
  profile_pic?: string | null;
  sect?: string | null;
  dressingCovering?: string | null;
  islamicPractice?: string | null;
  otherDetails?: string | null;
  openToMatches?: string | null;
  dealbreakers?: string | null;
  icebreakers?: string | null;
  interests?: string; // JSON string array
  sessionId?: string | null;
  created?: string;
  updated?: string;
  deleted?: string | null;
  parentEmail?: string | null;
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
  gender: "male" | "female";
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ConnectionRequest {
  _id: string;
  relationship: {
    id: string;
    status: string;
  };
  fname: string;
  lname: string;
  country?: string;
  profile_pic?: string;
}

export interface Chat {
  _id: string;
  senderId: string;
  receiverId: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  user: User;
  lastMessage?: Chat;
  unreadCount: number;
}

export interface MatchCardProps {
  name: string;
  age: number;
  location: string;
  photoUrl: string;
  tags: string[];
  userId: string;
  onLike: () => Promise<void>;
  onPass: () => void;
  onMessage: () => void;
  matchDate?: string;
  bio?: string;
  onChat?: () => void;
}

export interface VideoCallSettings {
  duration: number; // in minutes
  participants: User[];
  callId: string;
}
