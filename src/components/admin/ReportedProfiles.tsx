import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const ReportedProfiles = () => {
  const { reportedProfiles: reports, loading, dismissReport, updateUserStatus } = useAdminData();

  if (loading) return <div>Loading reported profiles...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Reported Profiles</CardTitle>
          <CardDescription>Review and take action on user-submitted reports.</CardDescription>
        </CardHeader>
        <CardContent>
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