
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EditUserDialog from './EditUserDialog';
import CountryCityFilter from './CountryCityFilter';
import ConfirmationDialog from './ConfirmationDialog';
import SendEmailDialog from './SendEmailDialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Trash2, User, Users, Eye, Mail, AlertTriangle } from 'lucide-react';

interface MemberManagementProps {
  stats: any;
}

const MemberManagement = ({ stats }: MemberManagementProps) => {
  const [filters, setFilters] = useState({
    search: '',
    gender: 'all',
    plan: 'all',
    status: 'all',
    countries: [] as string[],
    cities: [] as string[],
    inactiveFor: 'all',
    page: 1,
    limit: 20
  });

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
    variant: 'default'
  });
  const [emailDialog, setEmailDialog] = useState<{
    isOpen: boolean;
    user: any;
  }>({
    isOpen: false,
    user: null
  });

  const { users, loading, pagination, refetchData, deleteUser, updateUser, sendPasswordReset } = useAdminData({
    ...filters,
    country: filters.countries.join(','),
    city: filters.cities.join(',')
  });
  const { toast } = useToast();

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User Account',
      description: `Are you sure you want to permanently delete ${userName}'s account? This action cannot be undone and will remove all their data including messages, matches, and profile information.`,
      onConfirm: async () => {
        try {
          await deleteUser(userId);
          toast({ title: 'Success', description: 'User has been successfully deleted.' });
        } catch (error: any) {
          toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      variant: 'destructive'
    });
  };

  const handleUpgradeToPremium = (userId: string, userName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Upgrade to Premium',
      description: `Are you sure you want to upgrade ${userName} to Premium? This will give them access to all premium features including unlimited messaging, video calls, and advanced search filters.`,
      onConfirm: async () => {
        try {
          await updateUser(userId, { plan: 'premium' });
          toast({ title: 'Success', description: 'User upgraded to Premium successfully.' });
        } catch (error: any) {
          toast({ title: 'Error', description: error.message || 'Failed to upgrade user.', variant: 'destructive' });
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleStatusChange = (userId: string, userName: string, currentStatus: string, newStatus: string) => {
    const isActivating = newStatus === 'active' && currentStatus !== 'active';
    const isDeactivating = newStatus !== 'active' && currentStatus === 'active';
    
    if (isActivating || isDeactivating) {
      setConfirmDialog({
        isOpen: true,
        title: isActivating ? 'Activate User Account' : 'Change User Status',
        description: isActivating 
          ? `Are you sure you want to activate ${userName}'s account? They will be able to access the platform and appear in searches.`
          : `Are you sure you want to change ${userName}'s status to ${newStatus}? This will affect their ability to use the platform.`,
        onConfirm: async () => {
          try {
            await updateUser(userId, { status: newStatus });
            toast({ title: 'Success', description: 'User status updated successfully.' });
          } catch (error: any) {
            toast({ title: 'Error', description: error.message || 'Failed to update user status.', variant: 'destructive' });
          }
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        },
        variant: isDeactivating ? 'destructive' : 'default'
      });
    } else {
      // Direct update for non-critical status changes
      updateUser(userId, { status: newStatus });
    }
  };

  const openEmailDialog = (user: any) => {
    setEmailDialog({
      isOpen: true,
      user
    });
  };

  const renderUserCard = (user: any) => (
    <Card key={user._id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <Avatar className="flex-shrink-0">
              <AvatarFallback>
                {user.fname?.[0]}{user.lname?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{user.fname} {user.lname}</h3>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant={user.gender === 'male' ? 'default' : 'secondary'} className="text-xs">
                  {user.gender}
                </Badge>
                <Badge variant={user.plan === 'premium' ? 'default' : 'outline'} className="text-xs">
                  {user.plan === 'freemium' ? 'Free' : user.plan}
                </Badge>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                  {user.status}
                </Badge>
                {user.hidden && <Badge variant="destructive" className="text-xs">Hidden</Badge>}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col lg:items-end space-y-2 flex-shrink-0">
            <div className="text-sm text-gray-500 lg:text-right">
              {user.age && <span>{user.age} years old</span>}
              {user.country && <span> • {user.country}</span>}
            </div>
            <div className="text-sm text-gray-500 lg:text-right">
              Matches: {user.matchCount || 0} • Messages: {user.messageCount || 0}
            </div>
            <div className="text-sm text-gray-500 lg:text-right">
              {user.lastSeenAgo !== null && user.lastSeenAgo !== undefined 
                ? `Last seen ${user.lastSeenAgo} days ago` 
                : 'Never logged in'}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Link to={`/admin/user/${user._id}`}>
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>

              <Button size="sm" variant="outline" onClick={() => openEmailDialog(user)}>
                <Mail className="h-4 w-4" />
              </Button>

              <Button size="sm" variant="outline" onClick={() => {
                setSelectedUser(user);
                setEditDialogOpen(true);
              }}>
                <Edit className="h-4 w-4" />
              </Button>

              {user.plan === 'freemium' && (
                <Button 
                  size="sm" 
                  variant="default" 
                  onClick={() => handleUpgradeToPremium(user._id, `${user.fname} ${user.lname}`)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Upgrade
                </Button>
              )}
              
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={() => handleDeleteUser(user._id, `${user.fname} ${user.lname}`)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.maleMembers || 0} male, {stats?.femaleMembers || 0} female
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Members</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.premiumMembers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.premiumMembers || 0} / {stats?.totalMembers || 0} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hidden Profiles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.hiddenProfiles || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive (6+ months)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inactiveSixMonths || 0}</div>
            <p className="text-xs text-muted-foreground">
              Candidates for removal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Member Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.gender} onValueChange={(value) => handleFilterChange('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.plan} onValueChange={(value) => handleFilterChange('plan', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.inactiveFor} onValueChange={(value) => handleFilterChange('inactiveFor', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Inactive Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="30">1+ month inactive</SelectItem>
                <SelectItem value="90">3+ months inactive</SelectItem>
                <SelectItem value="180">6+ months inactive</SelectItem>
                <SelectItem value="365">12+ months inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4">
            <CountryCityFilter
              selectedCountries={filters.countries}
              selectedCities={filters.cities}
              onCountriesChange={(countries) => handleFilterChange('countries', countries)}
              onCitiesChange={(cities) => handleFilterChange('cities', cities)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Members ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading members...</div>
          ) : (
            <>
              {users.map(renderUserCard)}
              
              {/* Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <Button
                  variant="outline"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-500">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      {selectedUser && (
        <EditUserDialog
          user={selectedUser}
          isOpen={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUserUpdate={async (userId, data) => {
            await updateUser(userId, data);
            setEditDialogOpen(false);
          }}
          sendPasswordReset={sendPasswordReset}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />

      {/* Send Email Dialog */}
      {emailDialog.user && (
        <SendEmailDialog
          isOpen={emailDialog.isOpen}
          onOpenChange={(open) => setEmailDialog(prev => ({ ...prev, isOpen: open }))}
          recipientName={`${emailDialog.user.fname} ${emailDialog.user.lname}`}
          recipientEmail={emailDialog.user.email}
          userId={emailDialog.user._id}
        />
      )}
    </div>
  );
};

export default MemberManagement;
