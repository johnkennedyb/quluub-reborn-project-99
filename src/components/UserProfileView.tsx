import { User } from "@/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Star, UserPlus } from "lucide-react";
import { format, differenceInYears } from 'date-fns';

interface UserProfileViewProps {
  user: User;
}

const DetailItem = ({ label, value }: { label: string; value: string | undefined | null }) => {
  if (!value) return null;
  return (
    <div className="flex justify-between py-2 border-b border-gray-200">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  );
};

const UserProfileView = ({ user }: UserProfileViewProps) => {
  const getInitials = (fname: string, lname: string) => {
    return `${fname.charAt(0)}${lname.charAt(0)}`.toUpperCase();
  };

  const calculateAge = (dob: Date | undefined) => {
    if (!dob) return "N/A";
    return differenceInYears(new Date(), new Date(dob));
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={user.profile_pic} alt={`${user.fname}'s profile picture`} />
                <AvatarFallback>{getInitials(user.fname, user.lname)}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold">{user.fname} {user.lname}</h2>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <p className="text-sm text-muted-foreground mt-1">{user.city}, {user.country}</p>
              {user.lastSeen && <p className="text-xs text-gray-400 mt-2">Last seen: {format(new Date(user.lastSeen), 'PPp')}</p>}
              <div className="mt-4 flex gap-2">
                <Button variant="outline"><UserPlus className="mr-2 h-4 w-4" /> Send Request</Button>
                <Button variant="outline"><Star className="mr-2 h-4 w-4" /> Favorite</Button>
                <Button><MessageSquare className="mr-2 h-4 w-4" /> Message</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{user.summary || "No summary provided."}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Detailed Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-gray-200">
                <DetailItem label="Age" value={`${calculateAge(user.dob)} years old`} />
                <DetailItem label="Gender" value={user.gender} />
                <DetailItem label="Marital Status" value={user.maritalStatus} />
                <DetailItem label="Children" value={user.noOfChildren} />
                <DetailItem label="Nationality" value={user.nationality} />
                <DetailItem label="Ethnicity" value={user.ethnicity?.join(', ')} />
                <DetailItem label="Height" value={user.height} />
                <DetailItem label="Weight" value={user.weight} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-gray-200">
                <DetailItem label="Build" value={user.build} />
                <DetailItem label="Facial Appearance" value={user.appearance} />
                {user.gender === 'female' && <DetailItem label="Hijab" value={user.hijab} />}
                {user.gender === 'male' && <DetailItem label="Beard" value={user.beard} />}
                <DetailItem label="Dressing / Covering" value={user.dressingCovering} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Islamic Identity & Practice</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-gray-200">
                <DetailItem label="Sect/Madhhab" value={user.sect} />
                <DetailItem label="Revert/Convert" value={user.revert} />
                <DetailItem label="Started Practicing" value={user.startedPracticing ? format(new Date(user.startedPracticing), 'PPP') : undefined} />
                <DetailItem label="Pattern of Salaah" value={user.patternOfSalaah} />
                <DetailItem label="Islamic Practice" value={user.islamicPractice} />
                <DetailItem label="Favored Scholars/Speakers" value={user.scholarsSpeakers} />
                <DetailItem label="Genotype" value={user.genotype} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lifestyle & Background</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-gray-200">
                <DetailItem label="Work & Education" value={user.workEducation} />
                <DetailItem label="Personality Traits" value={user.traits} />
              </dl>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>Matching Preferences</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-700">Open to Matches From</h4>
                        <p className="text-sm text-gray-600">{user.openToMatches || "Not specified"}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700">Dealbreakers</h4>
                        <p className="text-sm text-gray-600">{user.dealbreakers || "Not specified"}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-700">Icebreakers</h4>
                        <p className="text-sm text-gray-600">{user.icebreakers || "Not specified"}</p>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
