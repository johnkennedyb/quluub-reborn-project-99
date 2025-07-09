
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
import CountryCityMultiSelect from './CountryCityMultiSelect';
import SendEmailDialog from './SendEmailDialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Edit, Trash2, User, Users, Eye, Mail } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MemberManagementProps {
  stats: any;
}

const MemberManagement = ({ stats }: MemberManagementProps) => {
  const isMobile = useIsMobile();
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
  const [sendEmailOpen, setSendEmailOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState<any>(null);

  const { users, loading, pagination, refetchData, deleteUser, updateUser, sendPasswordReset } = useAdminData(filters);
  const { toast } = useToast();

  const handleFilterChange = (key: string, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePremiumUpgrade = async (userId: string, currentPlan: string) => {
    if (currentPlan === 'premium') {
      toast({ title: 'Info', description: 'User is already on premium plan.', variant: 'default' });
      return;
    }
    
    if (!confirm('⚠️ WARNING: Are you sure you want to upgrade this user to premium? This action will grant them premium access immediately.')) {
      return;
    }

    try {
      await updateUser(userId, { plan: 'premium' });
      toast({ title: 'Success', description: 'User has been upgraded to premium.' });
    } catch (error: any) {
      console.error('Failed to upgrade user:', error);
      toast({ title: 'Error', description: error.message || 'Failed to upgrade user.', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (userId: string, currentStatus: string, newStatus: string) => {
    if (currentStatus === newStatus) return;
    
    const statusChangeMessage = newStatus === 'active' 
      ? '⚠️ WARNING: Are you sure you want to activate this user? They will be able to access the platform and interact with other members.'
      : '⚠️ WARNING: Are you sure you want to change this user\'s status? This will affect their ability to use the platform.';
    
    if (!confirm(statusChangeMessage)) {
      return;
    }

    try {
      await updateUser(userId, { status: newStatus });
      toast({ title: 'Success', description: `User status updated to ${newStatus}.` });
    } catch (error: any) {
      console.error('Failed to update user status:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update user status.', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user and all their associated data? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteUser(userId);
      toast({ title: 'Success', description: 'User has been successfully deleted.' });
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  const renderUserCard = (user: any) => (
    <Card key={user._id} className="mb-4">
      <CardContent className={`p-4 ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
          <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
            <Avatar className={isMobile ? 'h-10 w-10' : 'h-12 w-12'}>
              <AvatarFallback>
                {user.fname?.[0]}{user.lname?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>{user.fname} {user.lname}</h3>
              <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>{user.email}</p>
              <div className={`flex flex-wrap items-center gap-1 mt-1 ${isMobile ? 'gap-1' : 'gap-2'}`}>
                <Badge className={`${isMobile ? 'text-xs px-1 py-0' : ''}`}>
                  {user.gender}
                </Badge>
                <Badge className={`${isMobile ? 'text-xs px-1 py-0' : ''}`}>
                  {user.plan === 'freemium' ? 'Free' : user.plan}
                </Badge>
                <Badge className={`${isMobile ? 'text-xs px-1 py-0' : ''}`}>
                  {user.status}
                </Badge>
                {user.hidden && <Badge className={`${isMobile ? 'text-xs px-1 py-0' : ''}`}>Hidden</Badge>}
              </div>
            </div>
          </div>
          
          <div className={`${isMobile ? 'w-full' : 'flex flex-col items-end space-y-2'}`}>
            <div className={`text-gray-500 ${isMobile ? 'text-xs mb-2' : 'text-sm'}`}>
              {user.age && <span>{user.age} years old</span>}
              {user.country && <span> • {user.country}</span>}
            </div>
            <div className={`text-gray-500 ${isMobile ? 'text-xs mb-2' : 'text-sm'}`}>
              Matches: {user.matchCount || 0} • Messages: {user.messageCount || 0}
            </div>
            <div className={`text-gray-500 ${isMobile ? 'text-xs mb-3' : 'text-sm'}`}>
              {user.lastSeenAgo !== null && user.lastSeenAgo !== undefined 
                ? `Last seen ${user.lastSeenAgo} days ago` 
                : 'Never logged in'}
            </div>
            
            <div className={`flex ${isMobile ? 'flex-wrap gap-2 w-full' : 'space-x-2'}`}>
              <Link to={`/admin/user/${user._id}`}>
                <Button size={isMobile ? "sm" : "sm"} variant="outline" className={isMobile ? 'flex-1' : ''}>
                  <Eye className="h-4 w-4" />
                  {isMobile && <span className="ml-1 text-xs">View</span>}
                </Button>
              </Link>

              <Button 
                size={isMobile ? "sm" : "sm"} 
                variant="outline" 
                className={isMobile ? 'flex-1' : ''}
                onClick={() => {
                  setSelectedUser(user);
                  setEditDialogOpen(true);
                }}
              >
                <Edit className="h-4 w-4" />
                {isMobile && <span className="ml-1 text-xs">Edit</span>}
              </Button>

              <Button 
                size={isMobile ? "sm" : "sm"} 
                variant="outline" 
                className={isMobile ? 'flex-1' : ''}
                onClick={() => {
                  setEmailRecipient(user);
                  setSendEmailOpen(true);
                }}
              >
                <Mail className="h-4 w-4" />
                {isMobile && <span className="ml-1 text-xs">Email</span>}
              </Button>

              {user.plan !== 'premium' && (
                <Button 
                  size={isMobile ? "sm" : "sm"} 
                  variant="default" 
                  className={`${isMobile ? 'flex-1 bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'}`}
                  onClick={() => handlePremiumUpgrade(user._id, user.plan)}
                >
                  <span className={isMobile ? 'text-xs' : 'text-sm'}>↗ Premium</span>
                </Button>
              )}
              
              <Button 
                size={isMobile ? "sm" : "sm"} 
                variant="destructive" 
                className={isMobile ? 'flex-1' : ''}
                onClick={() => handleDeleteUser(user._id)}
              >
                <Trash2 className="h-4 w-4" />
                {isMobile && <span className="ml-1 text-xs">Delete</span>}
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
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

          {/* Country and City Multi-Select */}
          <div className="mt-4">
            <CountryCityMultiSelect
              countryValue={filters.countries}
              cityValue={filters.cities}
              onCountryChange={(countries) => handleFilterChange('countries', countries)}
              onCityChange={(cities) => handleFilterChange('cities', cities)}
              maxSelections={5}
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
              <div className="flex justify-between items-center mt-6">
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
          onUserUpdate={(userId, data) => {
            updateUser(userId, data);
            setEditDialogOpen(false);
          }}
          sendPasswordReset={sendPasswordReset}
        />
      )}

      {/* Send Email Dialog */}
      {emailRecipient && (
        <SendEmailDialog
          user={emailRecipient}
          isOpen={sendEmailOpen}
          onOpenChange={setSendEmailOpen}
        />
      )}
    </div>
  );
};

export default MemberManagement;
