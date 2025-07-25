import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle, AlertTriangle, Play, Database, Save, Eye } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface TestResult {
  success: boolean;
  message: string;
  report?: any;
  result?: any;
  validation?: any;
  analysis?: any;
  completionPercentage?: number;
  timestamp: string;
}

const ProfileDataTest = () => {
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    integrity?: TestResult;
    schema?: TestResult;
    save?: TestResult;
    complete?: TestResult;
  }>({});
  const { toast } = useToast();

  // Test profile data integrity
  const runIntegrityTest = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/test/profile-integrity');
      setTestResults(prev => ({ ...prev, integrity: response.data }));
      
      toast({
        title: response.data.success ? "✅ Integrity Test Passed" : "❌ Integrity Test Failed",
        description: response.data.message,
        variant: response.data.success ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error('Integrity test failed:', error);
      toast({
        title: "❌ Test Failed",
        description: error.response?.data?.message || "Failed to run integrity test",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Test profile schema validation
  const runSchemaTest = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/test/profile-schema');
      setTestResults(prev => ({ ...prev, schema: response.data }));
      
      toast({
        title: response.data.success ? "✅ Schema Valid" : "❌ Schema Issues",
        description: response.data.message,
        variant: response.data.success ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error('Schema test failed:', error);
      toast({
        title: "❌ Test Failed",
        description: error.response?.data?.message || "Failed to run schema test",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Test profile save functionality
  const runSaveTest = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post('/test/profile-save');
      setTestResults(prev => ({ ...prev, save: response.data }));
      
      toast({
        title: response.data.success ? "✅ Save Test Passed" : "❌ Save Test Failed",
        description: response.data.message,
        variant: response.data.success ? "default" : "destructive"
      });
    } catch (error: any) {
      console.error('Save test failed:', error);
      toast({
        title: "❌ Test Failed",
        description: error.response?.data?.message || "Failed to run save test",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get complete profile data
  const getCompleteProfile = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/test/profile-complete');
      setTestResults(prev => ({ ...prev, complete: response.data }));
      
      toast({
        title: "✅ Profile Data Retrieved",
        description: `Profile completion: ${response.data.completionPercentage}%`,
      });
    } catch (error: any) {
      console.error('Complete profile test failed:', error);
      toast({
        title: "❌ Test Failed",
        description: error.response?.data?.message || "Failed to get complete profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setLoading(true);
    try {
      await runSchemaTest();
      await runSaveTest();
      await runIntegrityTest();
      await getCompleteProfile();
      
      toast({
        title: "🎯 All Tests Completed",
        description: "Check results below for detailed analysis",
      });
    } catch (error) {
      console.error('Failed to run all tests:', error);
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
              <Database className="h-6 w-6" />
              Profile Data Integrity Testing System
            </CardTitle>
            <p className="text-muted-foreground">
              Comprehensive testing suite to ensure all profile fields are properly connected between frontend and backend.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button onClick={runAllTests} disabled={loading} className="flex items-center gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Run All Tests
              </Button>
              <Button onClick={runSchemaTest} disabled={loading} variant="outline" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Schema Test
              </Button>
              <Button onClick={runSaveTest} disabled={loading} variant="outline" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Test
              </Button>
              <Button onClick={runIntegrityTest} disabled={loading} variant="outline" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Integrity Test
              </Button>
              <Button onClick={getCompleteProfile} disabled={loading} variant="outline" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                View Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Schema Validation Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {getStatusIcon(testResults.schema?.success)}
                  Schema Validation
                </span>
                {getStatusBadge(testResults.schema?.success)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.schema ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{testResults.schema.message}</p>
                  {testResults.schema.validation && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Fields:</span>
                        <span className="font-medium">{testResults.schema.validation.totalFields}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Valid Fields:</span>
                        <span className="font-medium text-green-600">{testResults.schema.validation.validFields}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Missing Fields:</span>
                        <span className="font-medium text-red-600">{testResults.schema.validation.missingFields?.length || 0}</span>
                      </div>
                      {testResults.schema.validation.missingFields?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-red-600 mb-1">Missing Fields:</p>
                          <div className="flex flex-wrap gap-1">
                            {testResults.schema.validation.missingFields.map((field: string) => (
                              <Badge key={field} variant="destructive" className="text-xs">{field}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Run schema test to see results</p>
              )}
            </CardContent>
          </Card>

          {/* Save Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {getStatusIcon(testResults.save?.success)}
                  Save Functionality
                </span>
                {getStatusBadge(testResults.save?.success)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.save ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{testResults.save.message}</p>
                  {testResults.save.result?.results && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Correct Fields:</span>
                        <span className="font-medium text-green-600">{testResults.save.result.results.correctFields?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Failed Fields:</span>
                        <span className="font-medium text-red-600">{testResults.save.result.results.incorrectFields?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Not Tested:</span>
                        <span className="font-medium text-yellow-600">{testResults.save.result.results.notTestedFields?.length || 0}</span>
                      </div>
                      {testResults.save.result.results.incorrectFields?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-red-600 mb-1">Failed Fields:</p>
                          <div className="space-y-1">
                            {testResults.save.result.results.incorrectFields.map((field: any, index: number) => (
                              <div key={index} className="text-xs bg-red-50 p-2 rounded">
                                <strong>{field.name}:</strong> Expected "{String(field.expected)}", Got "{String(field.actual)}"
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Run save test to see results</p>
              )}
            </CardContent>
          </Card>

          {/* Integrity Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {getStatusIcon(testResults.integrity?.success)}
                  Data Integrity
                </span>
                {getStatusBadge(testResults.integrity?.success)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.integrity ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{testResults.integrity.message}</p>
                  {testResults.integrity.report && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Status:</span>
                        <span className={`font-medium ${testResults.integrity.report.overallStatus ? 'text-green-600' : 'text-red-600'}`}>
                          {testResults.integrity.report.overallStatus ? 'FUNCTIONAL' : 'NEEDS ATTENTION'}
                        </span>
                      </div>
                      {testResults.integrity.report.modelValidation && (
                        <div className="text-xs space-y-1">
                          <div>Model Valid Fields: {testResults.integrity.report.modelValidation.validFields}</div>
                          <div>Model Missing Fields: {testResults.integrity.report.modelValidation.missingFields?.length || 0}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Run integrity test to see results</p>
              )}
            </CardContent>
          </Card>

          {/* Complete Profile Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {getStatusIcon(testResults.complete?.success)}
                  Profile Completion
                </span>
                {testResults.complete?.completionPercentage && (
                  <Badge variant="outline">{testResults.complete.completionPercentage}% Complete</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults.complete ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Profile data analysis completed</p>
                  {testResults.complete.analysis && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Fields:</span>
                        <span className="font-medium">{testResults.complete.analysis.totalFields}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Populated Fields:</span>
                        <span className="font-medium text-green-600">{testResults.complete.analysis.populatedFields}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Empty Fields:</span>
                        <span className="font-medium text-gray-600">{testResults.complete.analysis.emptyFields}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${testResults.complete.completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Run profile analysis to see results</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Overall Status */}
        {Object.keys(testResults).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Overall System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(testResults).map(([testType, result]) => (
                  <div key={testType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium capitalize">{testType} Test</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result?.success)}
                      {getStatusBadge(result?.success)}
                    </div>
                  </div>
                ))}
                
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">System Recommendations:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Ensure all profile fields are properly defined in the User model schema</li>
                    <li>• Verify that frontend ProfileEditSections matches backend updateUserProfile fields</li>
                    <li>• Test profile saving and retrieval with real user data</li>
                    <li>• Monitor profile completion rates to identify missing data collection</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfileDataTest;
