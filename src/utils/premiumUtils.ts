import { User } from '@/types/user';

// Define premium plan types
export type PremiumPlan = 'premium' | 'pro';
export type FreePlan = 'free' | 'basic';
export type UserPlan = PremiumPlan | FreePlan;

// Check if user has premium access
export const isPremiumUser = (user: User | null | undefined): boolean => {
  if (!user || !user.plan) return false;
  return user.plan === 'premium' || user.plan === 'pro';
};

// Check if user is free/basic user
export const isFreeUser = (user: User | null | undefined): boolean => {
  return !isPremiumUser(user);
};

// Get user plan display name
export const getPlanDisplayName = (plan: string | undefined): string => {
  switch (plan) {
    case 'premium':
      return 'Premium';
    case 'pro':
      return 'Pro';
    case 'basic':
      return 'Basic';
    case 'free':
    default:
      return 'Free';
  }
};

// Premium features configuration
export const PREMIUM_FEATURES = {
  VIDEO_CALLS: 'video_calls',
  UNLIMITED_MESSAGES: 'unlimited_messages',
  AD_FREE_BROWSING: 'ad_free_browsing',
  ADVANCED_FILTERS: 'advanced_filters',
  PRIORITY_SUPPORT: 'priority_support',
  PROFILE_BOOST: 'profile_boost'
} as const;

// Check if user has access to specific premium feature
export const hasFeatureAccess = (
  user: User | null | undefined, 
  feature: keyof typeof PREMIUM_FEATURES
): boolean => {
  if (!isPremiumUser(user)) return false;
  
  // All premium users have access to all features for now
  // This can be expanded later for different premium tiers
  return true;
};

// Get upgrade message for feature
export const getUpgradeMessage = (feature: keyof typeof PREMIUM_FEATURES): string => {
  const messages = {
    VIDEO_CALLS: 'Video calls are available for Premium users only. Upgrade your plan to access this feature.',
    UNLIMITED_MESSAGES: 'Unlimited messaging is available for Premium users only.',
    AD_FREE_BROWSING: 'Ad-free browsing is available for Premium users only.',
    ADVANCED_FILTERS: 'Advanced filters are available for Premium users only.',
    PRIORITY_SUPPORT: 'Priority support is available for Premium users only.',
    PROFILE_BOOST: 'Profile boost is available for Premium users only.'
  };
  
  return messages[feature] || 'This feature is available for Premium users only.';
};
