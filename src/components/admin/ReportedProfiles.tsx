import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, AlertTriangle } from 'lucide-react';

const ReportedProfiles = () => {
  const { reportedProfiles: reports, loading, dismissReport, updateUserStatus } = useAdminData();
  const { toast } = useToast();
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulationData, setSimulationData] = useState({
    reportedUserId: '',
    reporterUserId: '',
    reason: '',
    description: ''
  });

  const reportReasons = [
    'Inappropriate content',
    'Fake profile', 
    'Harassment',
    'Spam',
    'Scam/Fraud',
    'Inappropriate photos',
    'Offensive language',
    'Other'
  ];

  const handleSimulateReport = async () => {
    if (!simulationData.reportedUserId || !simulationData.reporterUserId || !simulationData.reason) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      // This would call an API to create a simulated report
      console.log('Simulating report:', simulationData);
      toast({
        title: 'Report Simulated',
        description: 'Test report has been created successfully'
      });
      setShowSimulator(false);
      setSimulationData({ reportedUserId: '', reporterUserId: '', reason: '', description: '' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to simulate report',
        variant: 'destructive'
      });
    }
  };

  if (loading) return <div>Loading reported profiles...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reported Profiles</CardTitle>
              <CardDescription>Review and take action on user-submitted reports.</CardDescription>
            </div>
            <Button onClick={() => setShowSimulator(!showSimulator)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Simulate Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showSimulator && (
            <div className="mb-6 p-4 border rounded-lg bg-yellow-50">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">Simulate Report (Testing)</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportedUserId">Reported User ID</Label>
                  <Input
                    id="reportedUserId"
                    placeholder="Enter user ID to be reported"
                    value={simulationData.reportedUserId}
                    onChange={(e) => setSimulationData(prev => ({ ...prev, reportedUserId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="reporterUserId">Reporter User ID</Label>
                  <Input
                    id="reporterUserId"
                    placeholder="Enter reporter user ID"
                    value={simulationData.reporterUserId}
                    onChange={(e) => setSimulationData(prev => ({ ...prev, reporterUserId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Select value={simulationData.reason} onValueChange={(value) => setSimulationData(prev => ({ ...prev, reason: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportReasons.map(reason => (
                        <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the issue..."
                    value={simulationData.description}
                    onChange={(e) => setSimulationData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={handleSimulateReport}>Create Test Report</Button>
                <Button onClick={() => setShowSimulator(false)} variant="outline">Cancel</Button>
              </div>
            </div>
          )}
          
          {reports.length === 0 ? (
            <p>No pending reports.</p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report._id} className={report.status !== 'pending' ? 'bg-gray-100' : ''}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <h4 className="font-semibold">Reported User</h4>
                        <p className="text-sm">{report.reported.fullName} (@{report.reported.username})</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold">Reporter</h4>
                        <p className="text-sm">{report.reporter.fullName} (@{report.reporter.username})</p>
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold">Details</h4>
                        <p className="text-sm">Reason: <Badge variant="secondary">{report.reason}</Badge></p>
                        <p className="text-sm">Date: {format(new Date(report.createdAt), 'PPP')}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold">Description</h4>
                      <p className="text-sm text-gray-600 italic">{report.description}</p>
                    </div>
                    {report.status === 'pending' && (
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => dismissReport(report._id)}>
                          Dismiss Report
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => updateUserStatus(report.reported._id, 'suspended')}>
                          Suspend User
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => updateUserStatus(report.reported._id, 'banned')}>
                          Ban User
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
};

export default ReportedProfiles;