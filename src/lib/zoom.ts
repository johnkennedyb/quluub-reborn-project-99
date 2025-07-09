
interface ZoomMeetingOptions {
  topic: string;
  duration: number;
  hostEmail: string;
  participantEmails: string[];
  password: string;
}

interface ZoomMeeting {
  id: string;
  password: string;
  joinUrl: string;
  startTime: Date;
  duration: number;
  cost: number;
}

interface ZoomUsage {
  totalMinutes: number;
  costPerMinute: number;
  totalCost: number;
}

// Mock Zoom API - Replace with actual Zoom SDK integration
const ZOOM_CONFIG = {
  apiKey: 'demo_key',
  apiSecret: 'demo_secret',
  costPerMinute: 0.02, // £0.02 per minute for pay-as-you-go
  freeMinutesPerMonth: 120 // 2 hours free per month for premium users
};

export const createZoomMeeting = async (options: ZoomMeetingOptions): Promise<ZoomMeeting> => {
  try {
    // Mock implementation - replace with actual Zoom API call
    const meetingId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    const meeting: ZoomMeeting = {
      id: meetingId,
      password: options.password,
      joinUrl: `https://zoom.us/j/${meetingId}?pwd=${options.password}`,
      startTime: new Date(),
      duration: options.duration,
      cost: 0 // Will be calculated based on actual usage
    };

    // In a real implementation, you would:
    // 1. Make API call to Zoom to create meeting
    // 2. Store meeting details in your database
    // 3. Set up billing tracking
    
    console.log('Created Zoom meeting:', meeting);
    return meeting;
  } catch (error) {
    console.error('Error creating Zoom meeting:', error);
    throw new Error('Failed to create video call. Please try again.');
  }
};

export const joinZoomMeeting = (meetingId: string, password: string) => {
  try {
    // Initialize Zoom Web SDK
    if (typeof window !== 'undefined' && (window as any).ZoomMtg) {
      const ZoomMtg = (window as any).ZoomMtg;
      
      ZoomMtg.setZoomJSLib('https://source.zoom.us/2.9.5/lib', '/av');
      ZoomMtg.preLoadWasm();
      ZoomMtg.prepareWebSDK();
      
      // Generate signature (in production, this should be done server-side)
      const signature = generateSignature(meetingId, 0); // 0 for participant
      
      ZoomMtg.init({
        leaveUrl: window.location.origin,
        success: () => {
          ZoomMtg.join({
            signature: signature,
            meetingNumber: meetingId,
            userName: 'User', // Should be actual user name
            apiKey: ZOOM_CONFIG.apiKey,
            userEmail: '', // Should be actual user email
            passWord: password,
            success: (res: any) => {
              console.log('Successfully joined meeting', res);
            },
            error: (res: any) => {
              console.error('Error joining meeting', res);
            }
          });
        },
        error: (res: any) => {
          console.error('Error initializing Zoom', res);
        }
      });
    } else {
      // Fallback to opening in new window if SDK not loaded
      const joinUrl = `https://zoom.us/j/${meetingId}?pwd=${password}`;
      window.open(joinUrl, '_blank');
    }
  } catch (error) {
    console.error('Error joining Zoom meeting:', error);
    throw new Error('Failed to join video call. Please try again.');
  }
};

export const endZoomMeeting = (meetingId: string) => {
  try {
    if (typeof window !== 'undefined' && (window as any).ZoomMtg) {
      const ZoomMtg = (window as any).ZoomMtg;
      ZoomMtg.endMeeting({
        success: () => {
          console.log('Meeting ended successfully');
        },
        error: (res: any) => {
          console.error('Error ending meeting', res);
        }
      });
    }
  } catch (error) {
    console.error('Error ending meeting:', error);
  }
};

export const getZoomMeetingUsage = async (): Promise<ZoomUsage> => {
  try {
    // Mock implementation - replace with actual API call to your backend
    // which tracks usage and calculates costs
    
    const mockUsage: ZoomUsage = {
      totalMinutes: 45, // Total minutes used this month
      costPerMinute: ZOOM_CONFIG.costPerMinute,
      totalCost: 45 * ZOOM_CONFIG.costPerMinute // £0.90 for 45 minutes
    };

    return mockUsage;
  } catch (error) {
    console.error('Error fetching usage:', error);
    return {
      totalMinutes: 0,
      costPerMinute: ZOOM_CONFIG.costPerMinute,
      totalCost: 0
    };
  }
};

// Helper function to generate Zoom signature (should be done server-side in production)
const generateSignature = (meetingNumber: string, role: number): string => {
  // This is a simplified signature generation
  // In production, use proper JWT signing with your Zoom credentials
  const timestamp = Date.now();
  const signature = btoa(`${ZOOM_CONFIG.apiKey}:${meetingNumber}:${timestamp}:${role}`);
  return signature;
};

export const checkVideoCallEligibility = (userPlan: string): { eligible: boolean; reason?: string } => {
  if (userPlan !== 'premium') {
    return {
      eligible: false,
      reason: 'Video calling is only available for premium users. Please upgrade your plan.'
    };
  }
  
  return { eligible: true };
};

export const calculateMeetingCost = (durationMinutes: number, userPlan: string): number => {
  if (userPlan !== 'premium') return 0;
  
  // Premium users get free minutes, then pay-as-you-go
  const freeMinutesUsed = Math.min(durationMinutes, ZOOM_CONFIG.freeMinutesPerMonth);
  const paidMinutes = Math.max(0, durationMinutes - ZOOM_CONFIG.freeMinutesPerMonth);
  
  return paidMinutes * ZOOM_CONFIG.costPerMinute;
};

// Export config for use in components
export const ZOOM_SETTINGS = {
  costPerMinute: ZOOM_CONFIG.costPerMinute,
  freeMinutesPerMonth: ZOOM_CONFIG.freeMinutesPerMonth
};
