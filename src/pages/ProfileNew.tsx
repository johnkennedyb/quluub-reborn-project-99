import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import TopNavbar from "@/components/TopNavbar";
import Navbar from "@/components/Navbar";
import ProfileHeading from "@/components/ProfileHeading";
import ProfileBasicInfo from "@/components/ProfileBasicInfo";
import ProfileLocation from "@/components/ProfileLocation";
import ProfileAppearance from "@/components/ProfileAppearance";
import ProfileDeen from "@/components/ProfileDeen";
import ProfileLifestyle from "@/components/ProfileLifestyle";
import ProfileMatching from "@/components/ProfileMatching";
import ProfileWaliInfo from "@/components/ProfileWaliInfo";
import ProfileInterests from "@/components/ProfileInterests";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/types/user";
import { 
  ChevronLeft, 
  ChevronRight, 
  User as UserIcon, 
  MapPin, 
  Eye, 
  Mosque, 
  Heart, 
  Users, 
  Shield,
  Sparkles
} from "lucide-react";

const Profile = () => {
  const { user: currentUser, setUser: setCurrentUser } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const { toast } = useToast();
  
  const [hidden, setHidden] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  
  const carouselRef = useRef(null);
  
  const [inputs, setInputs] = useState({
    fname: "",
    lname: "",
    dob: "",
    kunya: "",
    maritalStatus: "",
    noOfChildren: 0,
    country: "",
    region: "",
    ethnicity: undefined,
    nationality: "",
    height: 0,
    weight: 0,
    build: "",
    appearance: "",
    genotype: "",
    revert: "",
    startedPracticing: "",
    patternOfSalaah: "",
    summary: "",
    scholarsSpeakers: "",
    dressingCovering: "",
    islamicPractice: "",
    workEducation: "",
    otherDetails: "",
    traits: [],
    dealbreakers: [],
    icebreakers: [],
    openToMatches: [],
    waliDetails: {
      name: "",
      email: "",
      whatsapp: "",
      telegram: "",
      otherNumber: "",
    },
  });

  // Menu items matching taofeeq_UI structure
  const menus = [
    {
      text: "Basic Info",
      icon: <UserIcon className="h-5 w-5" />,
      color: "#1976d2",
    },
    {
      text: "Deen",
      icon: <Mosque className="h-5 w-5" />,
      color: "#388e3c",
    },
    {
      text: "Location",
      icon: <MapPin className="h-5 w-5" />,
      color: "#f57c00",
    },
    {
      text: "Appearance",
      icon: <Eye className="h-5 w-5" />,
      color: "#7b1fa2",
    },
    {
      text: "Lifestyle",
      icon: <Sparkles className="h-5 w-5" />,
      color: "#c2185b",
    },
    {
      text: "Interests",
      icon: <Heart className="h-5 w-5" />,
      color: "#d32f2f",
    },
    {
      text: "Matching",
      icon: <Users className="h-5 w-5" />,
      color: "#303f9f",
    },
    {
      text: "Wali Info",
      icon: <Shield className="h-5 w-5" />,
      color: "#689f38",
    },
  ];

  const isOwnProfile = !userId || (currentUser?._id === userId);
  const displayUserId = userId || currentUser?._id;

  // Navigation functions
  const next = () => {
    if (currentSlide < menus.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const previous = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setExpanded(false);
  };

  // Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setInputs((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!currentUser?._id) return;
    
    setLoading(true);
    try {
      const mergedTraits = [...new Set(inputs.traits.filter((item) => !!item))];
      const updatedInputs = { ...inputs, traits: mergedTraits };
      
      await userService.updateProfile(currentUser._id, updatedInputs);
      
      // Update current user context
      setCurrentUser({ ...currentUser, ...updatedInputs });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirm = () => {
    // Validation logic
    if (!inputs.waliDetails.name || !inputs.waliDetails.email) {
      toast({
        title: "Validation Error",
        description: "Please set your wali details to continue",
        variant: "destructive",
      });
      return;
    }

    if (!inputs.dob) {
      toast({
        title: "Validation Error", 
        description: "Please set your date of birth to continue",
        variant: "destructive",
      });
      return;
    }

    if (!inputs.summary || !inputs.nationality || !inputs.country) {
      toast({
        title: "Validation Error",
        description: "Please fill in your Summary, Nationality and Country of Residence to continue",
        variant: "destructive",
      });
      return;
    }

    handleSubmit();
  };

  // Load profile data
  useEffect(() => {
    if (isOwnProfile && currentUser) {
      setInputs({
        fname: currentUser.fname || "",
        lname: currentUser.lname || "",
        dob: currentUser.dob || "",
        kunya: currentUser.kunya || "",
        maritalStatus: currentUser.maritalStatus || "",
        noOfChildren: currentUser.noOfChildren || 0,
        country: currentUser.country || "",
        region: currentUser.region || "",
        ethnicity: currentUser.ethnicity,
        nationality: currentUser.nationality || "",
        height: currentUser.height || 0,
        weight: currentUser.weight || 0,
        build: currentUser.build || "",
        appearance: currentUser.appearance || "",
        genotype: currentUser.genotype || "",
        revert: currentUser.revert || "",
        startedPracticing: currentUser.startedPracticing || "",
        patternOfSalaah: currentUser.patternOfSalaah || "",
        summary: currentUser.summary || "",
        scholarsSpeakers: currentUser.scholarsSpeakers || "",
        dressingCovering: currentUser.dressingCovering || "",
        islamicPractice: currentUser.islamicPractice || "",
        workEducation: currentUser.workEducation || "",
        otherDetails: currentUser.otherDetails || "",
        traits: currentUser.traits || [],
        dealbreakers: currentUser.dealbreakers || [],
        icebreakers: currentUser.icebreakers || [],
        openToMatches: currentUser.openToMatches || [],
        waliDetails: currentUser.waliDetails || {
          name: "",
          email: "",
          whatsapp: "",
          telegram: "",
          otherNumber: "",
        },
      });
      setProfileUser(currentUser);
    } else if (userId) {
      // Load other user's profile
      const fetchProfile = async () => {
        try {
          setLoading(true);
          const userData = await userService.getProfile(userId);
          setProfileUser(userData);
        } catch (error) {
          console.error("Failed to fetch profile:", error);
          toast({
            title: "Error",
            description: "Failed to load user profile",
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [currentUser, userId, isOwnProfile, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavbar />
        <div className="pt-16 pb-20 px-4 max-w-7xl mx-auto">
          <Skeleton className="h-96 w-full" />
        </div>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar />
      <div className="pt-16 pb-20 px-4 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Menu */}
          <div className="lg:col-span-1">
            <Accordion type="single" collapsible value={expanded ? "menu" : ""} onValueChange={(value) => setExpanded(!!value)}>
              <AccordionItem value="menu">
                <AccordionTrigger className="text-lg font-semibold">
                  Profile Sections
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {menus.map((menu, index) => (
                      <Button
                        key={menu.text}
                        variant={currentSlide === index ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => goToSlide(index)}
                        style={{ 
                          borderLeft: currentSlide === index ? `3px solid ${menu.color}` : 'none'
                        }}
                      >
                        {menu.icon}
                        <span className="ml-2">{menu.text}</span>
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Profile Heading */}
              <ProfileHeading 
                inputs={inputs} 
                user={profileUser} 
                canChat={false}
                refetch={() => {}}
              />

              {/* Navigation and Carousel */}
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previous}
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex-1">
                  <div className="relative">
                    {/* Carousel Content */}
                    <div className="overflow-hidden">
                      <div 
                        className="flex transition-transform duration-300 ease-in-out"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                      >
                        <div className="w-full flex-shrink-0">
                          <ProfileBasicInfo
                            menu={menus[0]}
                            inputs={inputs}
                            handleChange={handleChange}
                            isOwnProfile={isOwnProfile}
                          />
                        </div>
                        <div className="w-full flex-shrink-0">
                          <ProfileDeen
                            menu={menus[1]}
                            inputs={inputs}
                            handleChange={handleChange}
                            isOwnProfile={isOwnProfile}
                          />
                        </div>
                        <div className="w-full flex-shrink-0">
                          <ProfileLocation
                            menu={menus[2]}
                            inputs={inputs}
                            handleChange={handleChange}
                            isOwnProfile={isOwnProfile}
                          />
                        </div>
                        <div className="w-full flex-shrink-0">
                          <ProfileAppearance
                            menu={menus[3]}
                            inputs={inputs}
                            handleChange={handleChange}
                            isOwnProfile={isOwnProfile}
                          />
                        </div>
                        <div className="w-full flex-shrink-0">
                          <ProfileLifestyle
                            menu={menus[4]}
                            inputs={inputs}
                            handleChange={handleChange}
                            isOwnProfile={isOwnProfile}
                          />
                        </div>
                        <div className="w-full flex-shrink-0">
                          <ProfileInterests
                            menu={menus[5]}
                            inputs={inputs}
                            handleChange={handleChange}
                            isOwnProfile={isOwnProfile}
                          />
                        </div>
                        <div className="w-full flex-shrink-0">
                          <ProfileMatching
                            menu={menus[6]}
                            inputs={inputs}
                            handleChange={handleChange}
                            isOwnProfile={isOwnProfile}
                          />
                        </div>
                        <div className="w-full flex-shrink-0">
                          <ProfileWaliInfo
                            menu={menus[7]}
                            inputs={inputs}
                            handleChange={handleChange}
                            isOwnProfile={isOwnProfile}
                            canSeeWaliDetails={true}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={next}
                  disabled={currentSlide === menus.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Update Button for Own Profile */}
              {isOwnProfile && (
                <Card>
                  <CardContent className="p-4">
                    <Button 
                      onClick={confirm} 
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? "Updating..." : "Update my profile"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default Profile;
