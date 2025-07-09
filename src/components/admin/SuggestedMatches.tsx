
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Users, Send } from 'lucide-react';
import { useState } from 'react';

const SuggestedMatches = () => {
  const { 
    vipUsers, 
    potentialMatches, 
    loadingVips, 
    loadingMatches, 
    isSubmitting,
    fetchPotentialMatches, 
    sendSuggestions 
  } = useAdminData();
  
  const [selectedVipUser, setSelectedVipUser] = useState<string>('');
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);

  const handleVipUserSelect = async (userId: string) => {
    setSelectedVipUser(userId);
    setSelectedMatches([]);
    if (userId) {
      await fetchPotentialMatches(userId);
    }
  };

  const toggleMatchSelection = (userId: string) => {
    setSelectedMatches(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendSuggestions = async () => {
    if (selectedVipUser && selectedMatches.length > 0) {
      await sendSuggestions(selectedVipUser, selectedMatches);
      setSelectedMatches([]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Manual Match Suggestions
          </CardTitle>
          <CardDescription>
            Send curated match suggestions to Premium users to improve their experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Select VIP User</label>
            <Select onValueChange={handleVipUserSelect} value={selectedVipUser}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a VIP user..." />
              </SelectTrigger>
              <SelectContent>
                {loadingVips ? (
                  <SelectItem value="loading" disabled>Loading VIP users...</SelectItem>
                ) : vipUsers.length === 0 ? (
                  <SelectItem value="no-users" disabled>No VIP users found</SelectItem>
                ) : (
                  vipUsers.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      {user.fullName} (@{user.username}) - {user.plan}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedVipUser && (
            <div>
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Potential Matches
              </h3>
              
              {loadingMatches ? (
                <div>Loading potential matches...</div>
              ) : potentialMatches.length === 0 ? (
                <p className="text-muted-foreground">No potential matches found for this user.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {potentialMatches.map((match) => (
                    <Card 
                      key={match._id} 
                      className={`cursor-pointer transition-colors ${
                        selectedMatches.includes(match._id) 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleMatchSelection(match._id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {match.fname?.[0]}{match.lname?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium">{match.fullName}</h4>
                            <p className="text-sm text-muted-foreground">@{match.username}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={match.gender === 'male' ? 'default' : 'secondary'}>
                                {match.gender}
                              </Badge>
                              {match.age && <Badge variant="outline">{match.age} years</Badge>}
                              {match.country && <Badge variant="outline">{match.country}</Badge>}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {selectedMatches.length > 0 && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-sm text-muted-foreground">
                    {selectedMatches.length} match{selectedMatches.length !== 1 ? 'es' : ''} selected
                  </span>
                  <Button 
                    onClick={handleSendSuggestions} 
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? 'Sending...' : 'Send Suggestions'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuggestedMatches;
