import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminData } from '@/hooks/useAdminData';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { adminService } from "@/lib/api-client";
import { isPremiumUser, getPlanDisplayName } from "@/utils/premiumUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import UserProfileCard from './UserProfileCard';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import EditUserDialog from './EditUserDialog';
import SendEmailDialog from './SendEmailDialog';
import { Search, Edit, Trash2, Users, Eye, Mail, User } from 'lucide-react';
import ReactSelect from 'react-select';

interface MemberManagementProps {
  stats: any;
}

const countryOptions = [
  { value: 'USA', label: 'USA' },
  { value: 'Canada', label: 'Canada' },
  { value: 'UK', label: 'UK' },
  { value: 'Australia', label: 'Australia' },
  { value: 'Pakistan', label: 'Pakistan' },
];

const cityOptions: { [key: string]: { value: string; label: string }[] } = {
  USA: [
    { value: 'New York', label: 'New York' },
    { value: 'Los Angeles', label: 'Los Angeles' },
  ],
  Canada: [
    { value: 'Toronto', label: 'Toronto' },
    { value: 'Vancouver', label: 'Vancouver' },
  ],
  UK: [
    { value: 'London', label: 'London' },
    { value: 'Manchester', label: 'Manchester' },
  ],
  Australia: [
    { value: 'Sydney', label: 'Sydney' },
    { value: 'Melbourne', label: 'Melbourne' },
  ],
  Pakistan: [
    { value: 'Lahore', label: 'Lahore' },
    { value: 'Karachi', label: 'Karachi' },
  ],
};

const MemberManagement = ({ stats }: MemberManagementProps) => {
    const [filters, setFilters] = useState<{
    search: string;
    gender: string;
    plan: string;
    status: string;
    country: string[];
    city: string[];
    inactiveFor: string;
    page: number;
    limit: number;
  }>({
    search: '',
    gender: 'all',
    plan: 'all',
    status: 'all',
    country: [],
    city: [],
    inactiveFor: 'all',
    page: 1,
    limit: 20
  });

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [userForEmail, setUserForEmail] = useState<any>(null);

  const { users, loading, pagination, refetchData, deleteUser, updateUser, sendPasswordReset, sendEmail } = useAdminData(filters);
  const { toast } = useToast();

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleMultiSelectChange = (key: 'country' | 'city', selectedOptions: any) => {
    const values = selectedOptions ? selectedOptions.map((option: any) => option.value) : [];
    if (key === 'country') {
      setFilters(prev => ({ ...prev, country: values, city: [], page: 1 }));
    } else {
      setFilters(prev => ({ ...prev, city: values, page: 1 }));
    }
  };



  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user and all their associated data? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteUser(userId);
      toast({ title: 'Success', description: 'User has been successfully deleted.' });
      // refetchData is already called within the deleteUser hook on success
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast({ title: 'Error', description: error.message || 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  const renderUserCard = (user: any) => (
    <Card key={user._id} className="mb-4">
      <CardContent className="p-3 sm:p-4">
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          <div className="flex items-start space-x-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs">
                {user.fname?.[0]}{user.lname?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{user.fname} {user.lname}</h3>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                <Badge variant={user.gender === 'male' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0.5">
                  {user.gender}
                </Badge>
                <Badge variant={isPremiumUser(user) ? 'default' : 'outline'} className="text-xs px-1.5 py-0.5">
                  {getPlanDisplayName(user.plan)}
                </Badge>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="text-xs px-1.5 py-0.5">
                  {user.status}
                </Badge>
                {user.hidden && <Badge variant="destructive" className="text-xs px-1.5 py-0.5">Hidden</Badge>}
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-3">
            <div className="text-xs text-gray-500">
              {user.age && <span>{user.age} years</span>}
              {user.country && <span> • {user.country}</span>}
            </div>
            <div className="text-xs text-gray-500">
              Matches: {user.matchCount} • Messages: {user.messageCount}
            </div>
            <div className="text-xs text-gray-500">
              {user.lastSeenAgo !== null ? `Last seen ${user.lastSeenAgo}d ago` : 'Never logged in'}
            </div>
          </div>
          
          <div className="flex justify-between gap-2">
            <Link to={`/admin/user/${user._id}`} className="flex-1">
              <Button size="sm" variant="outline" className="w-full text-xs h-8">
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </Link>
            <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => {
              setSelectedUser(user);
              setEditDialogOpen(true);
            }}>
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs h-8" onClick={() => {
              setUserForEmail(user);
              setEmailDialogOpen(true);
            }}>
              <Mail className="h-3 w-3 mr-1" />
              Mail
            </Button>
            <Button size="sm" variant="destructive" className="text-xs h-8 px-2" onClick={() => handleDeleteUser(user._id)}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarFallback>
                {user.fname?.[0]}{user.lname?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{user.fname} {user.lname}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={user.gender === 'male' ? 'default' : 'secondary'}>
                  {user.gender}
                </Badge>
                <Badge variant={isPremiumUser(user) ? 'default' : 'outline'}>
                  {getPlanDisplayName(user.plan)}
                </Badge>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                  {user.status}
                </Badge>
                {user.hidden && <Badge variant="destructive">Hidden</Badge>}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            <div className="text-sm text-gray-500">
              {user.age && <span>{user.age} years old</span>}
              {user.country && <span> • {user.country}</span>}
            </div>
            <div className="text-sm text-gray-500">
              Matches: {user.matchCount} • Messages: {user.messageCount}
            </div>
            <div className="text-sm text-gray-500">
              {user.lastSeenAgo !== null ? `Last seen ${user.lastSeenAgo} days ago` : 'Never logged in'}
            </div>
            
            <div className="flex space-x-2">
              <Link to={`/admin/user/${user._id}`}>
                <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>

              <Button size="sm" variant="outline" onClick={() => {
                setSelectedUser(user);
                setEditDialogOpen(true);
              }}>
                <Edit className="h-4 w-4" />
              </Button>
              
              <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user._id)}>
                <Trash2 className="h-4 w-4" />
              </Button>

              <Button size="sm" variant="outline" onClick={() => {
                setUserForEmail(user);
                setEmailDialogOpen(true);
              }}>
                <Mail className="h-4 w-4" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-1"
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
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
                <SelectItem value="freemium">Freemium</SelectItem>
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

            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <ReactSelect
                isMulti
                options={countryOptions}
                className="basic-multi-select"
                classNamePrefix="select"
                placeholder="Filter by country..."
                onChange={(selected) => handleMultiSelectChange('country', selected)}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '40px',
                    fontSize: '14px'
                  }),
                  multiValue: (base) => ({
                    ...base,
                    fontSize: '12px'
                  })
                }}
              />
            </div>

            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <ReactSelect
                isMulti
                options={filters.country.flatMap(country => cityOptions[country] || [])}
                className="basic-multi-select"
                classNamePrefix="select"
                placeholder="Filter by city..."
                value={(filters.country.flatMap(country => cityOptions[country] || [])).filter(option => filters.city.includes(option.value))}
                onChange={(selected) => handleMultiSelectChange('city', selected)}
                isDisabled={filters.country.length === 0}
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '40px',
                    fontSize: '14px'
                  }),
                  multiValue: (base) => ({
                    ...base,
                    fontSize: '12px'
                  })
                }}
              />
            </div>
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
                  className="w-full sm:w-auto"
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-500 order-first sm:order-none">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  className="w-full sm:w-auto"
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

      {userForEmail && (
        <SendEmailDialog
          user={userForEmail}
          isOpen={emailDialogOpen}
          onOpenChange={setEmailDialogOpen}
          onSendEmail={async (userId, subject, message) => {
            await sendEmail(userId, subject, message);
            setEmailDialogOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default MemberManagement;
