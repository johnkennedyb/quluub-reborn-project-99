import { User } from "@/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Star, UserPlus, Flag } from "lucide-react";
import { format, differenceInYears } from 'date-fns';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userService, relationshipService } from '@/lib/api-client';
import apiClient from '@/lib/api-client';

interface UserProfileViewProps {
  user: User;
  hasReceivedRequestFrom?: boolean;
  requestId?: string;
  isMatched?: boolean;
  relationshipId?: string;
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

const UserProfileView = ({ user, hasReceivedRequestFrom = false, requestId, isMatched = false, relationshipId }: UserProfileViewProps) => {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [hasSentRequest, setHasSentRequest] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [showAlreadySentModal, setShowAlreadySentModal] = useState(false);

  // Report mutation
  const reportMutation = useMutation({
    mutationFn: async (reportData: { reportedUserId: string; reason: string; type: string }) => {
      console.log('Sending report data:', reportData);
      return await apiClient.post('/reports', reportData);
    },
    onSuccess: () => {
      toast.success('Report submitted successfully. Our team will review it.');
      setShowReportDialog(false);
      setReportReason('');
    },
    onError: (error: any) => {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    }
  });

  // Handle report submission
  const handleReport = () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason for reporting this user.');
      return;
    }
    
    const reportData = {
      reportedUserId: user._id,
      reason: reportReason.trim(),
      type: 'user_behavior'
    };
    
    console.log('Submitting report with data:', reportData);
    reportMutation.mutate(reportData);
  };

  // Log profile view when component mounts
  useEffect(() => {
    const logView = async () => {
      if (user?._id) {
        try {
          await userService.logProfileView(user._id);
        } catch (error) {
          console.error('Failed to log profile view:', error);
          // Don't show error to user as this is background tracking
        }
      }
    };

    logView();
  }, [user?._id]);

  // Check favorite status and sent request status
  useEffect(() => {
    const checkUserStatus = async () => {
      if (user?._id) {
        try {
          // Check if user is in favorites
          const favorites = await userService.getFavorites();
          const isInFavorites = favorites.favorites?.some((fav: any) => fav._id === user._id);
          setIsFavorited(isInFavorites);

          // Check if request already sent
          const sentRequestsResponse = await relationshipService.getSentRequests();
          console.log('Sent requests response:', sentRequestsResponse);
          
          // Handle different response structures
          const sentRequestsArray = Array.isArray(sentRequestsResponse) ? sentRequestsResponse : 
                                   sentRequestsResponse?.requests ? sentRequestsResponse.requests : 
                                   sentRequestsResponse?.data ? sentRequestsResponse.data : [];
          
          if (!Array.isArray(sentRequestsArray)) {
            console.warn('Sent requests data is not an array:', sentRequestsArray);
            setHasSentRequest(false);
            return;
          }
          
          const hasRequestSent = sentRequestsArray.some((req: any) => req.followed_user_id === user._id && req.status === 'pending');
          setHasSentRequest(hasRequestSent);
        } catch (error) {
          console.error('Failed to check user status:', error);
        }
      }
    };

    checkUserStatus();
  }, [user?._id]);

  const getInitials = (fname: string, lname: string) => {
    return `${fname.charAt(0)}${lname.charAt(0)}`.toUpperCase();
  };

  const calculateAge = (dob: Date | undefined) => {
    // Task #26: Fix age display issue
    if (!dob) return null;
    try {
      const dobDate = typeof dob === 'string' ? new Date(dob) : dob;
      if (isNaN(dobDate.getTime())) return null;
      return differenceInYears(new Date(), dobDate);
    } catch (error) {
      console.error('Error calculating age:', error);
      return null;
    }
  };

  const getAgeDisplay = (dob: Date | undefined) => {
    const age = calculateAge(dob);
    return age ? `${age} years old` : "Age not provided";
  };

  const getProfileSummary = () => {
    const age = calculateAge(user.dob);
    const ethnicity = user.ethnicity || user.nationality;
    const location = user.country;
    
    let summary = "";
    
    if (age) {
      summary += `${age} year old`;
    }
    
    if (ethnicity) {
      summary += (summary ? " " : "") + ethnicity;
    }
    
    if (location) {
      summary += (summary ? " living in " : "") + location;
    }
    
    return summary || "Profile information not available";
  };

  const handleRequestResponse = async (action: 'accept' | 'reject') => {
    console.log('=== MATCH REQUEST DEBUG ===');
    console.log('requestId:', requestId);
    console.log('requestId type:', typeof requestId);
    console.log('hasReceivedRequestFrom:', hasReceivedRequestFrom);
    console.log('relationshipId:', relationshipId);
    console.log('user._id:', user._id);
    console.log('========================');
    
    if (!requestId) {
      console.error('No requestId provided!');
      toast.error('No request ID found. Cannot process request.');
      return;
    }
    
    // Task #28: Check if wali name and email are provided before accept/reject (only for female users)
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (currentUser.gender === 'female') {
      let waliDetails: { name?: string; email?: string } = {};
      
      try {
        // Handle both string and object formats for waliDetails
        if (typeof currentUser.waliDetails === 'string') {
          waliDetails = JSON.parse(currentUser.waliDetails);
        } else if (typeof currentUser.waliDetails === 'object' && currentUser.waliDetails !== null) {
          waliDetails = currentUser.waliDetails;
        }
      } catch (error) {
        console.error('Error parsing wali details:', error);
        waliDetails = {};
      }
      
      if (!waliDetails.name || !waliDetails.email) {
        toast.error('Please complete your Wali name and email in your profile settings before accepting or rejecting requests.');
        return;
      }
    }
    
    setIsProcessingRequest(true);
    console.log(`Attempting to ${action} request with ID:`, requestId);
    
    try {
      const response = await relationshipService.respondToRequest(requestId, action);
      console.log(`Request ${action}ed successfully:`, response);
      toast.success(`Request ${action}ed successfully`);
      // Optionally refresh the page or update the UI
      window.location.reload();
    } catch (error: any) {
      console.error(`Error ${action}ing request:`, error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        requestId
      });
      
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${action} request`;
      toast.error(errorMessage);
    } finally {
      setIsProcessingRequest(false);
    }
  };



  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column - Main Info & Actions */}
        <div className="lg:col-span-1 space-y-4 lg:space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={user.profile_pic} alt={`${user.fname}'s profile picture`} />
                <AvatarFallback>{getInitials(user.fname, user.lname)}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-bold">{user.fname} {user.lname}</h2>
              <p className="text-sm text-muted-foreground">@{user.username}</p>
              <p className="text-sm text-muted-foreground mt-1">{getProfileSummary()}</p>
              {user.lastSeen && <p className="text-xs text-gray-400 mt-2">Last seen: {format(new Date(user.lastSeen), 'PPp')}</p>}
              <div className="mt-4 flex gap-2 flex-wrap justify-center sm:justify-start">
                {/* Show different buttons based on relationship status */}
                {hasReceivedRequestFrom ? (
                  // User has received a request from this person - show accept/reject
                  <>
                    <Button 
                      onClick={() => handleRequestResponse('accept')}
                      disabled={isProcessingRequest}
                      className="bg-green-600 hover:bg-green-700 text-sm px-3 py-2 sm:px-4 sm:py-2"
                      size="sm"
                    >
                      <UserPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Accept
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleRequestResponse('reject')}
                      disabled={isProcessingRequest}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm px-3 py-2 sm:px-4 sm:py-2"
                      size="sm"
                    >
                      Reject
                    </Button>
                  </>
                ) : isMatched ? (
                  // Users are matched - show chat and withdraw connection
                  <>
                    <Button 
                      onClick={() => {
                        // Navigate to chat with this user
                        window.location.href = `/messages?user=${user._id}`;
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-2 sm:px-4 sm:py-2"
                      size="sm"
                    >
                      <MessageSquare className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Chat
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setShowWithdrawConfirm(true)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm px-3 py-2 sm:px-4 sm:py-2"
                      size="sm"
                    >
                      <span className="hidden sm:inline">Withdraw Connection</span>
                      <span className="sm:hidden">Withdraw</span>
                    </Button>
                  </>
                ) : (
                  // No relationship - show send request and favorite
                  <>
                    <Button 
                      variant={hasSentRequest ? "default" : "outline"}
                      onClick={async () => {
                        if (hasSentRequest) {
                          setShowAlreadySentModal(true);
                          return;
                        }
                        try {
                          await relationshipService.sendRequest(user._id);
                          setHasSentRequest(true);
                          toast.success('Request sent successfully');
                        } catch (error) {
                          console.error('Error sending request:', error);
                          // Check if error is about already sent request
                          if (error.response?.data?.message?.includes('already sent') || 
                              error.response?.data?.message?.includes('already')) {
                            setShowAlreadySentModal(true);
                            setHasSentRequest(true);
                          } else {
                            toast.error('Failed to send request');
                          }
                        }
                      }}
                      className={`text-sm px-3 py-2 sm:px-4 sm:py-2 ${hasSentRequest ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
                      size="sm"
                    >
                      <UserPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
                      <span className="hidden sm:inline">{hasSentRequest ? 'Request Sent' : 'Send Request'}</span>
                      <span className="sm:hidden">{hasSentRequest ? 'Sent' : 'Request'}</span>
                    </Button>
                    <Button 
                      variant={isFavorited ? "default" : "outline"}
                      onClick={async () => {
                        try {
                          if (isFavorited) {
                            await userService.removeFromFavorites(user._id);
                            setIsFavorited(false);
                            toast.success('Removed from favorites');
                          } else {
                            await userService.addToFavorites(user._id);
                            setIsFavorited(true);
                            toast.success('Added to favorites');
                          }
                        } catch (error) {
                          console.error('Error updating favorites:', error);
                          toast.error('Failed to update favorites');
                        }
                      }}
                      className={`text-sm px-3 py-2 sm:px-4 sm:py-2 ${isFavorited ? "bg-yellow-500 hover:bg-yellow-600 text-white" : ""}`}
                      size="sm"
                    >
                      <Star className={`mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 ${isFavorited ? 'fill-current' : ''}`} /> 
                      <span className="hidden sm:inline">{isFavorited ? 'Favorited' : 'Favorite'}</span>
                      <span className="sm:hidden">★</span>
                    </Button>
                  </>
                )}
                <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 text-sm px-3 py-2 sm:px-4 sm:py-2">
                      <Flag className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> 
                      <span className="hidden sm:inline">Report</span>
                      <span className="sm:hidden">⚠</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Report User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Please describe the reason for reporting this user. Your report will be reviewed by our moderation team.
                      </p>
                      <Textarea
                        placeholder="Please describe the reason for reporting this user..."
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        rows={4}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowReportDialog(false);
                            setReportReason('');
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleReport}
                          disabled={reportMutation.isPending || !reportReason.trim()}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{user.summary || "✨ This user hasn't shared their story yet. Encourage them to complete their profile!"}</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Detailed Info */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-gray-200">
                <DetailItem label="Age" value={getAgeDisplay(user.dob)} />
                <DetailItem label="Gender" value={user.gender} />
                <DetailItem label="Marital Status" value={user.maritalStatus} />
                <DetailItem label="Children" value={user.noOfChildren} />
                <DetailItem label="Nationality" value={user.nationality} />
                <DetailItem label="Ethnicity" value={Array.isArray(user.ethnicity) ? user.ethnicity.join(', ') : user.ethnicity} />
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
                <DetailItem label="Appearance" value={user.appearance} />
                <DetailItem label="Skin Color" value={user.skinColor} />
                <DetailItem label="Facial Attractiveness" value={user.facialAttractiveness} />
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

      {/* Withdrawal Confirmation Modal */}
      <Dialog open={showWithdrawConfirm} onOpenChange={setShowWithdrawConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Withdraw Connection</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to withdraw your connection with <strong>{user.fname}</strong>? 
              This action cannot be undone and you will no longer be able to chat with them.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setShowWithdrawConfirm(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={async () => {
                if (relationshipId) {
                  try {
                    await relationshipService.withdrawRequest(relationshipId);
                    toast.success('Connection withdrawn successfully');
                    setShowWithdrawConfirm(false);
                    window.location.reload();
                  } catch (error) {
                    console.error('Error withdrawing connection:', error);
                    toast.error('Failed to withdraw connection');
                  }
                }
              }}
            >
              Withdraw Connection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfileView;
