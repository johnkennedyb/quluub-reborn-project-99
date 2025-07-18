import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { isPremiumUser, getPlanDisplayName } from "@/utils/premiumUtils";

interface ViewProfileDialogProps {
  user: any;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const ViewProfileDialog = ({ user, isOpen, onOpenChange }: ViewProfileDialogProps) => {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Member Profile: {user.fullName}</DialogTitle>
          <DialogDescription>@{user.username}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="md:col-span-1 flex flex-col items-center space-y-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={user.profilePicture} alt={user.fullName} />
              <AvatarFallback>{user.fname?.[0]}{user.lname?.[0]}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-xl font-semibold">{user.fullName}</h2>
              <p className="text-sm text-muted-foreground">{user.age} years old</p>
              <p className="text-sm text-muted-foreground">{user.city}, {user.country}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
                <Badge variant={user.gender === 'male' ? 'default' : 'secondary'}>{user.gender}</Badge>
                <Badge variant={isPremiumUser(user) ? 'default' : 'outline'}>{getPlanDisplayName(user.plan)}</Badge>
                <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>{user.status}</Badge>
                {user.hidden && <Badge variant="destructive">Hidden</Badge>}
            </div>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div>
              <h3 className="font-semibold">Bio</h3>
              <p className="text-sm text-muted-foreground italic">{user.bio || 'No bio provided.'}</p>
            </div>
            <div>
              <h3 className="font-semibold">Interests</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {user.interests?.length > 0 ? (
                  user.interests.map((interest: string) => (
                    <Badge key={interest} variant="secondary">{interest}</Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No interests listed.</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-semibold">Email:</span> {user.email}</div>
              <div><span className="font-semibold">Phone:</span> {user.phone || 'N/A'}</div>
              <div><span className="font-semibold">Joined:</span> {format(new Date(user.createdAt), 'PPP')}</div>
              <div><span className="font-semibold">Last Seen:</span> {user.lastSeen ? format(new Date(user.lastSeen), 'PPP p') : 'Never'}</div>
              <div><span className="font-semibold">Matches:</span> {user.matchCount}</div>
              <div><span className="font-semibold">Messages:</span> {user.messageCount}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewProfileDialog;