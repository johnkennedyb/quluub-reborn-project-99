import { useState } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

const SuggestedMatches = () => {
  const {
    vipUsers,
    potentialMatches,
    loadingVips,
    loadingMatches,
    isSubmitting,
    fetchPotentialMatches,
    sendSuggestions,
  } = useAdminData();

  const [selectedVip, setSelectedVip] = useState<string>('');
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);



  const handleVipSelect = (userId: string) => {
    setSelectedVip(userId);
    setSelectedMatches([]);
    if (userId) {
      fetchPotentialMatches(userId);
    }
  };

  const handleMatchToggle = (matchId: string) => {
    setSelectedMatches((prev) =>
      prev.includes(matchId) ? prev.filter((id) => id !== matchId) : [...prev, matchId]
    );
  };

  const handleSubmit = () => {
    if (selectedVip && selectedMatches.length > 0) {
      sendSuggestions(selectedVip, selectedMatches);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin-Suggested Matches</CardTitle>
          <CardDescription>Select a VIP user to suggest potential matches.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select VIP User</label>
            <Select onValueChange={handleVipSelect} disabled={loadingVips}>
              <SelectTrigger>
                <SelectValue placeholder={loadingVips ? 'Loading VIPs...' : 'Select a VIP user'} />
              </SelectTrigger>
              <SelectContent>
                {vipUsers.map((user) => (
                  <SelectItem key={user._id} value={user._id}>
                    {user.fullName} (@{user.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loadingMatches && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2">Loading matches...</span>
            </div>
          )}

          {selectedVip && !loadingMatches && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Potential Matches</h3>
              <ScrollArea className="h-72 w-full rounded-md border p-4">
                {potentialMatches.length > 0 ? (
                  potentialMatches.map((match) => (
                    <div key={match._id} className="flex items-center space-x-3 mb-2">
                      <Checkbox
                        id={match._id}
                        checked={selectedMatches.includes(match._id)}
                        onCheckedChange={() => handleMatchToggle(match._id)}
                      />
                      <label htmlFor={match._id} className="text-sm font-medium leading-none">
                        {match.fullName} (@{match.username})
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No potential matches found.</p>
                )}
              </ScrollArea>
            </div>
          )}

          {selectedVip && (
            <Button onClick={handleSubmit} disabled={isSubmitting || selectedMatches.length === 0}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Suggestions ({selectedMatches.length})
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SuggestedMatches;