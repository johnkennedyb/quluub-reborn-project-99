
export interface AdminUser {
  _id: string;
  fname: string;
  lname: string;
  email: string;
  username: string;
  gender: string;
  status: string;
  plan: string;
  isVerified: boolean;
  city?: string;
  country?: string;
  dob?: string;
  createdAt: string;
  lastSeen?: string;
  lastSeenAgo?: number;
  matchCount?: number;
  messageCount?: number;
  hidden?: boolean;
  profilePicture?: string;
  age?: number;
}

export interface ReportedUser {
  _id: string;
  fullName: string;
  username: string;
}

export interface Report {
  _id: string;
  reporter: ReportedUser;
  reported: ReportedUser;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface CallUser {
  _id: string;
  fullName: string;
  username?: string;
}

export interface AdminCall {
  _id: string;
  callerUser: CallUser;
  receiverUser: CallUser;
  startTime: string;
  endTime?: string;
  duration: number;
  status: string;
  recordingUrl?: string;
}

export interface Payment {
  _id: string;
  user: AdminUser;
  amount: number;
  currency: string;
  plan: string;
  status: string;
  transactionId: string;
  createdAt: string;
}

export interface PushNotification {
  _id: string;
  title: string;
  body: string;
  target: string;
  status: string;
  sentCount: number;
  failedCount: number;
  sentAt: string;
}

export interface AdminStats {
  totalMembers: number;
  maleMembers: number;
  femaleMembers: number;
  premiumMembers: number;
  hiddenProfiles: number;
  inactiveSixMonths: number;
  totalPayments: number;
  totalRevenue: number;
  avgDailySignups: number;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  total: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalUsers: number;
}

export interface UserFilters {
  search?: string;
  gender?: string;
  plan?: string;
  status?: string;
  country?: string;
  city?: string;
  inactiveFor?: string;
  page?: number;
  limit?: number;
}

export interface SendEmailParams {
  recipients: string[];
  subject: string;
  message: string;
  attachments?: File[];
}

export interface PushNotificationParams {
  title: string;
  body: string;
  target: string;
  userId?: string;
}
