
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Search, Heart, Users, Send } from 'lucide-react';

const SuggestedMatches = () => {
  const [premiumUsers, setPremiumUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Fetch premium users on component mount
  useEffect(() => {
    fetchPremiumUsers();
  }, []);

  const fetchPremiumUsers = async () => {
    try {
      const response = await fetch('/api/admin/premium-users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPremiumUsers(data.vips || []);
      }
    } catch (error) {
      console.error('Error fetching premium users:', error);
    }
  };

  const fetchPotentialMatches = async (userId: string) => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/potential-matches`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPotentialMatches(data.matches || []);
      }
    } catch (error) {
      console.error('Error fetching potential matches:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch potential matches',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setSelectedMatches([]);
    fetchPotentialMatches(userId);
  };

  const toggleMatchSelection = (matchId: string) => {
    setSelectedMatches(prev => 
      prev.includes(matchId) 
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId]
    );
  };

  const sendMatchSuggestions = async () => {
    if (!selectedUser || selectedMatches.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a user and at least one match suggestion',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${selectedUser}/suggest-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          suggestedUserIds: selectedMatches
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Match suggestions sent successfully'
        });
        setSelectedMatches([]);
      } else {
        throw new Error('Failed to send suggestions');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send match suggestions',
        variant: 'destructive'
      });
    }
  };

  const filteredUsers = premiumUsers.filter((user: any) =>
    `${user.fname} ${user.lname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUserData = premiumUsers.find((user: any) => user._id === selectedUser);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Manual Match Suggestions for Premium Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Premium Users</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Select Premium User</label>
              <Select value={selectedUser} onValueChange={handleUserSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a premium user..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.map((user: any) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.fullName} ({user.email}) - {user.gender}, {user.age} years
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUserData && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {selectedUserData.fname?.[0]}{selectedUserData.lname?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedUserData.fullName}</h3>
                    <p className="text-sm text-gray-600">
                      {selectedUserData.gender} • {selectedUserData.age} years • {selectedUserData.matchCount} matches
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Potential Matches ({potentialMatches.length})
              </span>
              {selectedMatches.length > 0 && (
                <Button onClick={sendMatchSuggestions} className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send {selectedMatches.length} Suggestions
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading potential matches...</div>
            ) : potentialMatches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No potential matches found for this user
              </div>
            ) : (
              <div className="grid gap-4">
                {potentialMatches.map((match: any) => (
                  <div
                    key={match._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedMatches.includes(match._id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleMatchSelection(match._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {match.fname?.[0]}{match.lname?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{match.fullName}</h4>
                          <p className="text-sm text-gray-600">
                            {match.gender} • {match.age} years • Premium
                          </p>
                          {match.country && (
                            <p className="text-sm text-gray-500">{match.country}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="default">Premium</Badge>
                        {selectedMatches.includes(match._id) && (
                          <Badge variant="secondary">Selected</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {premiumUsers.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Premium Users Found</h3>
            <p className="text-gray-500">
              Premium users will appear here once they upgrade their accounts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SuggestedMatches;
