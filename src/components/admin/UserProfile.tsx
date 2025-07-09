import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Calendar, MapPin, Heart, MessageSquare, Phone, Mail, Shield } from 'lucide-react';

interface UserProfileProps {
  userId: string;
}

const UserProfile = ({ userId }: UserProfileProps) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setUser(data);
        } else {
          throw new Error(data.message || 'Failed to fetch user data');
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Could not fetch user profile.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">User not found.</p>
      </div>
    );
  }

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const age = calculateAge(user.dob);

  const renderInfoItem = (icon: React.ReactNode, label: string, value: any) => (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex-shrink-0 text-gray-500">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-sm">{value || 'Not specified'}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">
                {user.fname?.[0]}{user.lname?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{user.fname} {user.lname}</h1>
                  <p className="text-gray-500">@{user.username}</p>
                  {age && <p className="text-sm text-gray-500">{age} years old</p>}
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                    {user.status}
                  </Badge>
                  <Badge variant={user.plan === 'premium' ? 'default' : 'outline'}>
                    {user.plan === 'freemium' ? 'Free' : user.plan}
                  </Badge>
                  {user.hidden && <Badge variant="destructive">Hidden</Badge>}
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderInfoItem(<MapPin className="h-4 w-4" />, "Location", `${user.country}${user.city ? `, ${user.city}` : ''}`)}
                {renderInfoItem(<Calendar className="h-4 w-4" />, "Joined", new Date(user.createdAt).toLocaleDateString())}
                {renderInfoItem(<User className="h-4 w-4" />, "Gender", user.gender)}
                {renderInfoItem(<Heart className="h-4 w-4" />, "Marital Status", user.maritalStatus)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="islamic">Islamic</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInfoItem(<User className="h-4 w-4" />, "Full Name", `${user.fname} ${user.lname}`)}
              {renderInfoItem(<Calendar className="h-4 w-4" />, "Date of Birth", user.dob ? new Date(user.dob).toLocaleDateString() : null)}
              {renderInfoItem(<MapPin className="h-4 w-4" />, "Nationality", user.nationality)}
              {renderInfoItem(<User className="h-4 w-4" />, "Ethnicity", Array.isArray(user.ethnicity) ? user.ethnicity.join(', ') : user.ethnicity)}
              {renderInfoItem(<User className="h-4 w-4" />, "Build", user.build)}
              {renderInfoItem(<User className="h-4 w-4" />, "Appearance", user.appearance)}
              {renderInfoItem(<Heart className="h-4 w-4" />, "Children", user.noOfChildren)}
              {renderInfoItem(<User className="h-4 w-4" />, "Genotype", user.genotype)}
            </CardContent>
          </Card>

          {user.summary && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{user.summary}</p>
              </CardContent>
            </Card>
          )}

          {user.workEducation && (
            <Card>
              <CardHeader>
                <CardTitle>Work & Education</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{user.workEducation}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="islamic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Islamic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInfoItem(<Calendar className="h-4 w-4" />, "Started Practicing", user.startedPracticing ? new Date(user.startedPracticing).toLocaleDateString() : null)}
              {renderInfoItem(<User className="h-4 w-4" />, "Pattern of Salaah", user.patternOfSalaah)}
              {renderInfoItem(<User className="h-4 w-4" />, "Hijab", user.hijab)}
              {renderInfoItem(<User className="h-4 w-4" />, "Beard", user.beard)}
              {renderInfoItem(<User className="h-4 w-4" />, "Kunya", user.kunya)}
            </CardContent>
          </Card>

          {user.waliDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Wali Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  try {
                    const waliData = JSON.parse(user.waliDetails);
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderInfoItem(<User className="h-4 w-4" />, "Wali Name", waliData.name)}
                        {renderInfoItem(<User className="h-4 w-4" />, "Relationship", waliData.relationship)}
                        {renderInfoItem(<Mail className="h-4 w-4" />, "Email", waliData.email)}
                        {renderInfoItem(<Phone className="h-4 w-4" />, "Phone", waliData.phone)}
                      </div>
                    );
                  } catch (e) {
                    return <p className="text-gray-500">Invalid wali data format</p>;
                  }
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInfoItem(<Mail className="h-4 w-4" />, "Email", user.email)}
              {renderInfoItem(<Mail className="h-4 w-4" />, "Parent Email", user.parentEmail)}
              {renderInfoItem(<MapPin className="h-4 w-4" />, "Country", user.country)}
              {renderInfoItem(<MapPin className="h-4 w-4" />, "City", user.city)}
              {renderInfoItem(<MapPin className="h-4 w-4" />, "Region", user.region)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Activity</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInfoItem(<Calendar className="h-4 w-4" />, "Last Seen", user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never')}
              {renderInfoItem(<Calendar className="h-4 w-4" />, "Account Created", new Date(user.createdAt).toLocaleString())}
              {renderInfoItem(<Mail className="h-4 w-4" />, "Email Verified", user.emailVerified ? 'Yes' : 'No')}
              {renderInfoItem(<User className="h-4 w-4" />, "Referral Code", user.referralCode)}
              {renderInfoItem(<Heart className="h-4 w-4" />, "Total Referrals", user.referralStats?.totalReferrals || 0)}
              {renderInfoItem(<MessageSquare className="h-4 w-4" />, "Video Call Credits", user.videoCallCredits || 0)}
            </CardContent>
          </Card>

          {user.favorites && user.favorites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Favorites ({user.favorites.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">User has {user.favorites.length} profiles in favorites</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
