import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { userService } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types/user";
import { parseJsonField } from "@/utils/dataUtils";

// Define form schema
const profileSchema = z.object({
  fname: z.string().min(1, "First name is required"),
  lname: z.string().min(1, "Last name is required"),
  parentEmail: z.string().email("Valid parent email is required"),
  kunya: z.string().optional(),
  dob: z.date().optional(),
  nationality: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  build: z.string().optional(),
  appearance: z.string().optional(),
  maritalStatus: z.string().optional(),
  noOfChildren: z.string().optional(),
  ethnicity: z.string().optional(),
  patternOfSalaah: z.string().optional(),
  genotype: z.string().optional(),
  summary: z.string().optional(),
  workEducation: z.string().optional(),
  waliName: z.string().optional(),
  waliEmail: z.string().optional(),
  waliWhatsapp: z.string().optional(),
  waliTelegram: z.string().optional(),
  waliOtherNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  user: User;
  onSaved?: () => void;
}

const ProfileEditForm = ({ user, onSaved }: ProfileEditFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Parse wali details if it exists
  const waliDetails = user.waliDetails ? parseJsonField(user.waliDetails) : null;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fname: user.fname || "",
      lname: user.lname || "",
      parentEmail: user.parentEmail || "",
      kunya: user.kunya || "",
      dob: user.dob ? new Date(user.dob) : undefined,
      nationality: user.nationality || "",
      country: user.country || "",
      region: user.region || "",
      build: user.build || "",
      appearance: user.appearance || "",
      maritalStatus: user.maritalStatus || "",
      noOfChildren: user.noOfChildren || "",
      ethnicity: user.ethnicity || "",
      patternOfSalaah: user.patternOfSalaah || "",
      genotype: user.genotype || "",
      summary: user.summary || "",
      workEducation: user.workEducation || "",
      waliName: waliDetails?.name || "",
      waliEmail: waliDetails?.email || "",
      waliWhatsapp: waliDetails?.whatsapp || "",
      waliTelegram: waliDetails?.telegram || "",
      waliOtherNumber: waliDetails?.otherNumber || "",
    },
  });

  // Update form when user data changes
  useEffect(() => {
    const waliDetails = user.waliDetails ? parseJsonField(user.waliDetails) : null;
    
    form.reset({
      fname: user.fname || "",
      lname: user.lname || "",
      parentEmail: user.parentEmail || "",
      kunya: user.kunya || "",
      dob: user.dob ? new Date(user.dob) : undefined,
      nationality: user.nationality || "",
      country: user.country || "",
      region: user.region || "",
      build: user.build || "",
      appearance: user.appearance || "",
      maritalStatus: user.maritalStatus || "",
      noOfChildren: user.noOfChildren || "",
      ethnicity: user.ethnicity || "",
      patternOfSalaah: user.patternOfSalaah || "",
      genotype: user.genotype || "",
      summary: user.summary || "",
      workEducation: user.workEducation || "",
      waliName: waliDetails?.name || "",
      waliEmail: waliDetails?.email || "",
      waliWhatsapp: waliDetails?.whatsapp || "",
      waliTelegram: waliDetails?.telegram || "",
      waliOtherNumber: waliDetails?.otherNumber || "",
    });
  }, [user, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Prepare wali details
      const waliDetails = JSON.stringify({
        name: values.waliName,
        email: values.waliEmail,
        whatsapp: values.waliWhatsapp,
        telegram: values.waliTelegram,
        otherNumber: values.waliOtherNumber,
      });
      
      // Remove wali detail fields
      const { 
        waliName, waliEmail, waliWhatsapp, waliTelegram, waliOtherNumber,
        ...otherValues 
      } = values;
      
      const updateData = {
        ...otherValues,
        waliDetails,
      };
      
      console.log("Updating profile with values:", updateData);
      await userService.updateProfile(user._id!, updateData);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lname"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="parentEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Email <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Parent's email address (required for video calls and chat monitoring)" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-sm text-muted-foreground">
                    This email will receive notifications and access links for video calls and chat monitoring.
                  </p>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="kunya"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nickname/Kunya</FormLabel>
                    <FormControl>
                      <Input placeholder="Nickname or Kunya" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth</FormLabel>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      disabled={isSubmitting}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nationality"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nationality</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your nationality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Nigerian">Nigerian</SelectItem>
                        <SelectItem value="Ghanaian">Ghanaian</SelectItem>
                        <SelectItem value="Saudi">Saudi</SelectItem>
                        <SelectItem value="American">American</SelectItem>
                        <SelectItem value="British">British</SelectItem>
                        <SelectItem value="Pakistani">Pakistani</SelectItem>
                        <SelectItem value="Indian">Indian</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Nigeria">Nigeria</SelectItem>
                        <SelectItem value="Ghana">Ghana</SelectItem>
                        <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        <SelectItem value="Pakistan">Pakistan</SelectItem>
                        <SelectItem value="India">India</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Region/State</FormLabel>
                  <FormControl>
                    <Input placeholder="Your region or state" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maritalStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marital Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your marital status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="noOfChildren"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Children</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of children" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">None</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5+">5 or more</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="build"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Build</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select build type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Slim">Slim</SelectItem>
                        <SelectItem value="Athletic">Athletic</SelectItem>
                        <SelectItem value="Average">Average</SelectItem>
                        <SelectItem value="Sporty">Sporty</SelectItem>
                        <SelectItem value="Curvy">Curvy</SelectItem>
                        <SelectItem value="Plus Size">Plus Size</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="appearance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Appearance</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select appearance" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Standout">Standout</SelectItem>
                        <SelectItem value="Attractive">Attractive</SelectItem>
                        <SelectItem value="Average">Average</SelectItem>
                        <SelectItem value="Simple">Simple</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="genotype"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genotype</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select genotype" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AA">AA</SelectItem>
                        <SelectItem value="AS">AS</SelectItem>
                        <SelectItem value="SS">SS</SelectItem>
                        <SelectItem value="AC">AC</SelectItem>
                        <SelectItem value="SC">SC</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="ethnicity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ethnicity</FormLabel>
                  <FormControl>
                    <Input placeholder="Your ethnicity" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="patternOfSalaah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pattern of Salaah</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your pattern" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="always">Always prays</SelectItem>
                      <SelectItem value="usually">Usually prays</SelectItem>
                      <SelectItem value="sometimes">Sometimes prays</SelectItem>
                      <SelectItem value="rarely">Rarely prays</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="workEducation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work & Education</FormLabel>
                  <FormControl>
                    <Input placeholder="Describe your work and education" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About Me</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell others about yourself" 
                      className="min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-4">Wali Details</h3>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="waliName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wali Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Name of your wali" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="waliEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wali Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Email of your wali" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="waliWhatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wali WhatsApp</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="WhatsApp number of your wali" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="waliTelegram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Wali Telegram</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Telegram username of your wali" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="waliOtherNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wali Other Contact</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Other contact number for your wali" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => form.reset()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default ProfileEditForm;
