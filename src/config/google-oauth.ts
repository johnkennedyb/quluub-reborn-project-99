
export const GOOGLE_OAUTH_CONFIG = {
  clientId: '138477569455-9r9mqdm2csj45us9narl9qojl6fl3t8h.apps.googleusercontent.com',
  clientSecret: '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',
  redirectUri: `${window.location.origin}/auth/google/callback`,
  scope: 'openid email profile'
};

export const getGoogleAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CONFIG.clientId,
    redirect_uri: GOOGLE_OAUTH_CONFIG.redirectUri,
    scope: GOOGLE_OAUTH_CONFIG.scope,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent'
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};
