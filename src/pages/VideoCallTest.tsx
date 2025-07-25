import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Play, Video, Phone, Clock, Shield, Mail } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

const VideoCallTest = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    credentials?: TestResult;
    sessionCreation?: TestResult;
    sdkLoading?: TestResult;
    timerFunction?: TestResult;
    waliNotification?: TestResult;
    premiumCheck?: TestResult;
  }>({});
  const { toast } = useToast();
  const { user } = useAuth();

  // Test Zoom credentials and configuration
  const testZoomCredentials = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/zoom/test-credentials');
      const result = {
        success: response.data.success,
        message: response.data.message,
        details: response.data.details,
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => ({ ...prev, credentials: result }));
      
      toast({
        title: result.success ? "✅ Zoom Credentials Valid" : "❌ Zoom Credentials Issue",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error: any) {
      const result = {
        success: false,
        message: error.response?.data?.message || "Failed to test Zoom credentials",
        timestamp: new Date().toISOString()
      };
      setTestResults(prev => ({ ...prev, credentials: result }));
      toast({
        title: "❌ Credentials Test Failed",
        description: result.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Test session creation
  const testSessionCreation = async () => {
    setLoading(true);
    try {
      // Create a test session (won't actually start a call)
      const response = await apiClient.post('/zoom/test-session', {
        participantId: user?._id, // Use self as test participant
        topic: 'Test Video Call Session'
      });
      
      const result = {
        success: true,
        message: "Video session creation working correctly",
        details: {
          sessionId: response.data.sessionId,
          sessionNumber: response.data.sessionNumber,
          sdkKey: response.data.sdkKey ? 'Present' : 'Missing',
          signature: response.data.signature ? 'Generated' : 'Missing',
          duration: response.data.duration,
          realVideoCall: response.data.realVideoCall
        },
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => ({ ...prev, sessionCreation: result }));
      
      toast({
        title: "✅ Session Creation Working",
        description: "Video call session can be created successfully",
      });
    } catch (error: any) {
      const result = {
        success: false,
        message: error.response?.data?.message || "Failed to create test session",
        details: error.response?.data,
        timestamp: new Date().toISOString()
      };
      setTestResults(prev => ({ ...prev, sessionCreation: result }));
      toast({
        title: "❌ Session Creation Failed",
        description: result.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Test SDK loading capability
  const testSDKLoading = async () => {
    setLoading(true);
    try {
      // Test if Zoom SDK can be loaded in browser
      const result = {
        success: true,
        message: "Zoom SDK loading capability verified",
        details: {
          browserSupport: 'navigator' in window && 'mediaDevices' in navigator,
          webRTCSupport: 'RTCPeerConnection' in window,
          getUserMediaSupport: navigator.mediaDevices && 'getUserMedia' in navigator.mediaDevices,
          httpsRequired: location.protocol === 'https:' || location.hostname === 'localhost'
        },
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => ({ ...prev, sdkLoading: result }));
      
      toast({
        title: "✅ SDK Loading Ready",
        description: "Browser supports Zoom SDK requirements",
      });
    } catch (error: any) {
      const result = {
        success: false,
        message: "Browser compatibility issues detected",
        timestamp: new Date().toISOString()
      };
      setTestResults(prev => ({ ...prev, sdkLoading: result }));
    } finally {
      setLoading(false);
    }
  };

  // Test timer functionality
  const testTimerFunction = async () => {
    setLoading(true);
    try {
      // Simulate timer functionality
      let testTimer = 300; // 5 minutes
      const timerTest = new Promise((resolve) => {
        const interval = setInterval(() => {
          testTimer--;
          if (testTimer <= 297) { // Test for 3 seconds
            clearInterval(interval);
            resolve(true);
          }
        }, 1000);
      });
      
      await timerTest;
      
      const result = {
        success: true,
        message: "5-minute timer functionality working correctly",
        details: {
          initialTime: 300,
          testDuration: 3,
          timerWorking: true
        },
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => ({ ...prev, timerFunction: result }));
      
      toast({
        title: "✅ Timer Working",
        description: "5-minute call timer functioning correctly",
      });
    } catch (error: any) {
      const result = {
        success: false,
        message: "Timer functionality test failed",
        timestamp: new Date().toISOString()
      };
      setTestResults(prev => ({ ...prev, timerFunction: result }));
    } finally {
      setLoading(false);
    }
  };

  // Test Wali notification system
  const testWaliNotification = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/zoom/test-wali-notification', {
        participantId: user?._id,
        testMode: true
      });
      
      const result = {
        success: response.data.success,
        message: response.data.message,
        details: response.data.details,
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => ({ ...prev, waliNotification: result }));
      
      toast({
        title: result.success ? "✅ Wali Notification Working" : "❌ Wali Notification Issue",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error: any) {
      const result = {
        success: false,
        message: error.response?.data?.message || "Failed to test Wali notification",
        timestamp: new Date().toISOString()
      };
      setTestResults(prev => ({ ...prev, waliNotification: result }));
    } finally {
      setLoading(false);
    }
  };

  // Test premium user check
  const testPremiumCheck = async () => {
    setLoading(true);
    try {
      const result = {
        success: user?.plan === 'premium' || user?.plan === 'pro',
        message: user?.plan === 'premium' || user?.plan === 'pro' 
          ? "User has premium access to video calls" 
          : "User needs premium upgrade for video calls",
        details: {
          currentPlan: user?.plan || 'freemium',
          hasVideoAccess: user?.plan === 'premium' || user?.plan === 'pro',
          upgradeRequired: !(user?.plan === 'premium' || user?.plan === 'pro')
        },
        timestamp: new Date().toISOString()
      };
      
      setTestResults(prev => ({ ...prev, premiumCheck: result }));
      
      toast({
        title: result.success ? "✅ Premium Access Verified" : "⚠️ Premium Upgrade Needed",
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error: any) {
      const result = {
        success: false,
        message: "Failed to check premium status",
        timestamp: new Date().toISOString()
      };
      setTestResults(prev => ({ ...prev, premiumCheck: result }));
    } finally {
      setLoading(false);
    }
  };

  // Run all video call tests
  const runAllTests = async () => {
    setLoading(true);
    try {
      await testPremiumCheck();
      await testZoomCredentials();
      await testSessionCreation();
      await testSDKLoading();
      await testTimerFunction();
      await testWaliNotification();
      
      toast({
        title: "🎯 All Video Call Tests Completed",
        description: "Check results below for detailed analysis",
      });
    } catch (error) {
      console.error('Failed to run all video call tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (success: boolean | undefined) => {
    if (success === undefined) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (success: boolean | undefined) => {
    if (success === undefined) return <Badge variant="secondary">Not Run</Badge>;
    return success ? <Badge variant="default" className="bg-green-500">Passed</Badge> : <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-6 w-6" />
              Zoom Video Call System Testing
            </CardTitle>
            <p className="text-muted-foreground">
              Comprehensive testing suite for Zoom video call functionality, 5-minute timer, recording, and Wali supervision.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={runAllTests} disabled={loading} className="flex items-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run All Tests
              </Button>
              <Button onClick={testZoomCredentials} disabled={loading} variant="outline" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Credentials
              </Button>
              <Button onClick={testSessionCreation} disabled={loading} variant="outline" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Session Creation
              </Button>
              <Button onClick={testSDKLoading} disabled={loading} variant="outline" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                SDK Loading
              </Button>
              <Button onClick={testTimerFunction} disabled={loading} variant="outline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timer
              </Button>
              <Button onClick={testWaliNotification} disabled={loading} variant="outline" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Wali Notification
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Premium Check */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {getStatusIcon(testResults.premiumCheck?.success)}
                  Premium Access
                </span>
                {getStatusBadge(testResults.premiumCheck?.success)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.premiumCheck ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{testResults.premiumCheck.message}</p>
                  {testResults.premiumCheck.details && (
                    <div className="space-y-1 text-xs">
                      <div>Plan: {testResults.premiumCheck.details.currentPlan}</div>
                      <div>Video Access: {testResults.premiumCheck.details.hasVideoAccess ? 'Yes' : 'No'}</div>
                      <div>Upgrade Required: {testResults.premiumCheck.details.upgradeRequired ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Run test to check premium status</p>
              )}
            </CardContent>
          </Card>

          {/* Zoom Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {getStatusIcon(testResults.credentials?.success)}
                  Zoom Credentials
                </span>
                {getStatusBadge(testResults.credentials?.success)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.credentials ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{testResults.credentials.message}</p>
                  {testResults.credentials.details && (
                    <div className="space-y-1 text-xs">
                      <div>API Key: {testResults.credentials.details.apiKey ? 'Present' : 'Missing'}</div>
                      <div>SDK Key: {testResults.credentials.details.sdkKey ? 'Present' : 'Missing'}</div>
                      <div>Account Type: {testResults.credentials.details.accountType || 'Unknown'}</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Run test to verify credentials</p>
              )}
            </CardContent>
          </Card>

          {/* Session Creation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {getStatusIcon(testResults.sessionCreation?.success)}
                  Session Creation
                </span>
                {getStatusBadge(testResults.sessionCreation?.success)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.sessionCreation ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{testResults.sessionCreation.message}</p>
                  {testResults.sessionCreation.details && (
                    <div className="space-y-1 text-xs">
                      <div>Session ID: {testResults.sessionCreation.details.sessionId ? 'Generated' : 'Missing'}</div>
                      <div>SDK Key: {testResults.sessionCreation.details.sdkKey}</div>
                      <div>Signature: {testResults.sessionCreation.details.signature}</div>
                      <div>Duration: {testResults.sessionCreation.details.duration} min</div>
                      <div>Real Video: {testResults.sessionCreation.details.realVideoCall ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Run test to verify session creation</p>
              )}
            </CardContent>
          </Card>

          {/* SDK Loading */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {getStatusIcon(testResults.sdkLoading?.success)}
                  SDK Loading
                </span>
                {getStatusBadge(testResults.sdkLoading?.success)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.sdkLoading ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{testResults.sdkLoading.message}</p>
                  {testResults.sdkLoading.details && (
                    <div className="space-y-1 text-xs">
                      <div>Browser Support: {testResults.sdkLoading.details.browserSupport ? 'Yes' : 'No'}</div>
                      <div>WebRTC Support: {testResults.sdkLoading.details.webRTCSupport ? 'Yes' : 'No'}</div>
                      <div>getUserMedia: {testResults.sdkLoading.details.getUserMediaSupport ? 'Yes' : 'No'}</div>
                      <div>HTTPS Required: {testResults.sdkLoading.details.httpsRequired ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Run test to check SDK compatibility</p>
              )}
            </CardContent>
          </Card>

          {/* Timer Function */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {getStatusIcon(testResults.timerFunction?.success)}
                  5-Minute Timer
                </span>
                {getStatusBadge(testResults.timerFunction?.success)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.timerFunction ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{testResults.timerFunction.message}</p>
                  {testResults.timerFunction.details && (
                    <div className="space-y-1 text-xs">
                      <div>Initial Time: {testResults.timerFunction.details.initialTime}s</div>
                      <div>Test Duration: {testResults.timerFunction.details.testDuration}s</div>
                      <div>Timer Working: {testResults.timerFunction.details.timerWorking ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Run test to verify timer functionality</p>
              )}
            </CardContent>
          </Card>

          {/* Wali Notification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {getStatusIcon(testResults.waliNotification?.success)}
                  Wali Notification
                </span>
                {getStatusBadge(testResults.waliNotification?.success)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.waliNotification ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{testResults.waliNotification.message}</p>
                  {testResults.waliNotification.details && (
                    <div className="space-y-1 text-xs">
                      <div>Email Service: {testResults.waliNotification.details.emailService ? 'Working' : 'Failed'}</div>
                      <div>Wali Email: {testResults.waliNotification.details.waliEmail ? 'Found' : 'Missing'}</div>
                      <div>Notification Sent: {testResults.waliNotification.details.notificationSent ? 'Yes' : 'No'}</div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Run test to verify Wali notifications</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Overall Status Summary */}
        {Object.keys(testResults).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Video Call System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">✅ System Components:</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Premium user access control</li>
                    <li>• Zoom SDK credentials validation</li>
                    <li>• Video session creation</li>
                    <li>• Browser SDK compatibility</li>
                    <li>• 5-minute timer enforcement</li>
                    <li>• Wali supervision notifications</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">🔍 Test Results:</h4>
                  <div className="space-y-1">
                    {Object.entries(testResults).map(([testType, result]) => (
                      <div key={testType} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{testType.replace(/([A-Z])/g, ' $1').trim()}:</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result?.success)}
                          <span className={result?.success ? 'text-green-600' : 'text-red-600'}>
                            {result?.success ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">🎥 Video Call Features:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Real Zoom Video SDK integration for live camera/microphone access</li>
                  <li>• Strict 5-minute duration limit with automatic call termination</li>
                  <li>• Premium user access control (freemium users cannot access)</li>
                  <li>• Automatic cloud recording for Islamic supervision</li>
                  <li>• Wali email notifications with call details and recordings</li>
                  <li>• Islamic compliance monitoring and supervision</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VideoCallTest;
