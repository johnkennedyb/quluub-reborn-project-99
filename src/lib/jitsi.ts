
export interface JitsiConfig {
  roomName: string;
  displayName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
}

export interface JitsiAPI {
  executeCommand: (command: string, ...args: any[]) => void;
  addEventListener: (event: string, callback: Function) => void;
  removeEventListener: (event: string, callback: Function) => void;
  dispose: () => void;
  isVideoMuted: () => boolean;
  isAudioMuted: () => boolean;
  getParticipantsInfo: () => any[];
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
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
    script.onerror = () => reject(new Error('Failed to load Jitsi script'));
    document.head.appendChild(script);
  });
};

export const initializeJitsi = async (
  containerId: string,
  config: JitsiConfig
): Promise<JitsiAPI> => {
  await loadJitsiScript();

  const domain = 'meet.jit.si';
  const options = {
    roomName: config.roomName,
    width: '100%',
    height: '100%',
    parentNode: document.getElementById(containerId),
    configOverwrite: {
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      enableWelcomePage: false,
      prejoinPageEnabled: false,
      disableDeepLinking: true,
    },
    interfaceConfigOverwrite: {
      TOOLBAR_BUTTONS: [
        'microphone',
        'camera',
        'closedcaptions',
        'desktop',
        'fullscreen',
        'fodeviceselection',
        'hangup',
        'profile',
        'info',
        'chat',
        'recording',
        'livestreaming',
        'etherpad',
        'sharedvideo',
        'settings',
        'raisehand',
        'videoquality',
        'filmstrip',
        'invite',
        'feedback',
        'stats',
        'shortcuts',
        'tileview',
        'videobackgroundblur',
        'download',
        'help',
        'mute-everyone',
        'security'
      ],
      SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      SHOW_POWERED_BY: false,
      MOBILE_APP_PROMO: false,
    },
    userInfo: {
      displayName: config.displayName || 'Anonymous',
      email: config.userEmail || '',
      avatarUrl: config.userAvatarUrl || ''
    }
  };

  const api = new window.JitsiMeetExternalAPI(domain, options);
  
  return api;
};

export const cleanupJitsi = (api: JitsiAPI | null) => {
  if (api) {
    try {
      api.dispose();
    } catch (error) {
      console.error('Error disposing Jitsi API:', error);
    }
  }
};

export const generateRoomId = (userId1: string, userId2: string): string => {
  // Create a consistent room ID based on user IDs
  const sortedIds = [userId1, userId2].sort();
  return `quluub-${sortedIds[0]}-${sortedIds[1]}-${Date.now()}`;
};
