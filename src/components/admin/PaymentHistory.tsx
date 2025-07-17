
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { DollarSign, CreditCard, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await apiClient.get('/admin/payments');
        setPayments(response.data);
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const getStatusVariant = (status: string): 'default' | 'destructive' | 'secondary' | 'outline' => {
    switch (status) {
      case 'succeeded':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'refunded':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleRefund = async (paymentId: string) => {
    if (confirm('Are you sure you want to process this refund?')) {
      setLoading(true);
      try {
        await apiClient.post(`/admin/payments/${paymentId}/refund`);
        toast({
          title: 'Refund Processed',
          description: 'The payment has been refunded successfully.',
        });
        // Refresh payment list
        const response = await apiClient.get('/admin/payments');
        setPayments(response.data);
      } catch (error) {
        console.error('Error processing refund:', error);
        toast({
          title: 'Refund Failed',
          description: 'There was an error processing the refund.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return <div>Loading payment data...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment History
          </CardTitle>
          <CardDescription>View and manage all payment transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length > 0 ? (
                payments.map((payment: any) => (
                  <TableRow key={payment._id}>
                    <TableCell>
                      <div className="font-medium">{payment.user.fname} {payment.user.lname}</div>
                      <div className="text-sm text-muted-foreground">@{payment.user.username}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {payment.amount.toFixed(2)} {payment.currency || 'USD'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payment.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(payment.status)}>{payment.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                        {payment.transactionId}
                      </code>
                    </TableCell>
                    <TableCell>{format(new Date(payment.createdAt), 'PPP')}</TableCell>
                    <TableCell>
                      {payment.status === 'succeeded' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRefund(payment._id)}
                          className="flex items-center gap-1"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Refund
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;
