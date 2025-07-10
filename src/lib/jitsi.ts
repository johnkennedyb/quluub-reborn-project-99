
// Jitsi Meet API configuration and utilities
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export interface JitsiMeetConfig {
  roomName: string;
  parentNode: HTMLElement;
  configOverwrite?: {
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    enableWelcomePage?: boolean;
    prejoinPageEnabled?: boolean;
    disableModeratorIndicator?: boolean;
    startScreenSharing?: boolean;
    enableEmailInStats?: boolean;
    requireDisplayName?: boolean;
    disableProfile?: boolean;
    hideDisplayName?: boolean;
    enableUserRolesBasedOnToken?: boolean;
    callStatsThreshold?: number;
  };
  interfaceConfigOverwrite?: {
    DISABLE_JOIN_LEAVE_NOTIFICATIONS?: boolean;
    DISABLE_PRESENCE_STATUS?: boolean;
    SHOW_JITSI_WATERMARK?: boolean;
    SHOW_WATERMARK_FOR_GUESTS?: boolean;
    TOOLBAR_BUTTONS?: string[];
    HIDE_INVITE_MORE_HEADER?: boolean;
    SHOW_CHROME_EXTENSION_BANNER?: boolean;
  };
  userInfo?: {
    displayName?: string;
    email?: string;
  };
}

export const loadJitsiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Jitsi Meet API'));
    document.head.appendChild(script);
  });
};

export const createJitsiMeeting = (config: JitsiMeetConfig) => {
  const defaultConfig = {
    height: '100%',
    width: '100%',
    parentNode: config.parentNode,
    roomName: config.roomName,
    configOverwrite: {
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      enableWelcomePage: false,
      prejoinPageEnabled: false,
      disableModeratorIndicator: true,
      startScreenSharing: false,
      enableEmailInStats: false,
      requireDisplayName: false,
      disableProfile: true,
      hideDisplayName: false,
      enableUserRolesBasedOnToken: false,
      disableDeepLinking: true,
      disableInviteFunctions: true,
      // Enhanced call time limit for premium users only
      callStatsThreshold: 300, // 5 minutes for free users
      ...config.configOverwrite,
    },
    interfaceConfigOverwrite: {
      DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
      DISABLE_PRESENCE_STATUS: true,
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      HIDE_INVITE_MORE_HEADER: true,
      SHOW_CHROME_EXTENSION_BANNER: false,
      TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'hangup', 'settings', 'filmstrip'
      ],
      ...config.interfaceConfigOverwrite,
    },
    userInfo: {
      displayName: config.userInfo?.displayName || `Guest-${Math.floor(Math.random() * 1000)}`,
      ...config.userInfo,
    },
  };

  return new window.JitsiMeetExternalAPI('meet.jit.si', defaultConfig);
};
