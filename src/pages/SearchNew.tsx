import React, { useState, useEffect, Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import TopNavbar from "@/components/TopNavbar";
import Navbar from "@/components/Navbar";
import UserCard from "@/components/UserCard";
import Advert from "@/components/Advert";
import { useAuth } from "@/contexts/AuthContext";
import { relationshipService } from "@/lib/api-client";
import { userService } from "@/lib/api-client";
import { isPremiumUser } from "@/utils/premiumUtils";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/types/user";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";

const Search = () => {
  // State matching taofeeq_UI structure
  const [results, setResults] = useState<User[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(10);
  const [lastRequest, setLastRequest] = useState("");

  const [inputs, setInputs] = useState({
    nationality: "",
    country: "",
    ageRange: [22, 45],
    heightRange: [52, 80],
    weightRange: [50, 90],
    build: "",
    appearance: "",
    maritalStatus: "",
    patternOfSalaah: "",
    genotype: "",
    sortBy: "lastSeen",
  });

  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const summaryEnabled = Object.values(inputs).every((val) => !!val);

  // Handler functions matching taofeeq_UI
  const handleToggleChange = (value: string) => {
    setInputs((prev) => ({ ...prev, sortBy: value }));
    const newReq = updateQueryParam(lastRequest, "sortBy", value);
    doSearch(newReq);
  };

  const handleChange = (name: string, value: any) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    setExpanded(false);
    const stringifiedInputs = {
      ...removeNullUndefinedFields(inputs),
    };
    setPage(1);
    const urlParams = new URLSearchParams(stringifiedInputs).toString();
    doSearch("/users/search?" + urlParams);
  };

  const doSearch = async (req: string) => {
    setLoading(true);
    try {
      const response = await userService.searchUsers(req);
      setResults(response.data.returnData || []);
      setTotalPages(response.data.totalPages || 1);
      setLastRequest(req);
    } catch (error) {
      console.error("Search failed:", error);
      toast({
        title: "Search Failed",
        description: "Unable to search users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQueryParam = (relativeUrl: string, key: string, value: string) => {
    const baseUrl = "https://dummy.com";
    let urlObj = new URL(relativeUrl, baseUrl);
    let params = urlObj.searchParams;
    params.set(key, value);
    return urlObj.pathname + urlObj.search;
  };

  const removeNullUndefinedFields = (obj: any) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([_, v]) => v != null && v !== "")
    );
  };

  const camelCaseToWords = (str: string) => {
    return str.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
  };

  // Initial search on component mount
  useEffect(() => {
    doSearch("/users/search");
  }, []);

  const handlePrev = () => {
    if (page >= 2) {
      const newPage = page - 1;
      setPage(newPage);
      const newReq = updateQueryParam(lastRequest, "page", newPage.toString());
      doSearch(newReq);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      const newPage = page + 1;
      setPage(newPage);
      const newReq = updateQueryParam(lastRequest, "page", newPage.toString());
      doSearch(newReq);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar />
      <div className="pt-16 pb-20 px-4 max-w-7xl mx-auto">
        {/* Search Filters Accordion */}
        <Accordion type="single" collapsible value={expanded ? "filters" : ""} onValueChange={(value) => setExpanded(!!value)}>
          <AccordionItem value="filters" className="mb-4">
            <AccordionTrigger className="text-lg font-semibold">
              Set your preferences and we will find your perfect match
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {/* Nationality */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Nationality</Label>
                  <Select value={inputs.nationality} onValueChange={(value) => handleChange("nationality", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any nationality</SelectItem>
                      <SelectItem value="Nigerian">Nigerian</SelectItem>
                      <SelectItem value="British">British</SelectItem>
                      <SelectItem value="American">American</SelectItem>
                      <SelectItem value="Pakistani">Pakistani</SelectItem>
                      <SelectItem value="Indian">Indian</SelectItem>
                      <SelectItem value="Bangladeshi">Bangladeshi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Country */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Country</Label>
                  <Select value={inputs.country} onValueChange={(value) => handleChange("country", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any country</SelectItem>
                      <SelectItem value="Nigeria">Nigeria</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="USA">United States</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Age Range */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Age Range: {inputs.ageRange[0]} - {inputs.ageRange[1]}
                  </Label>
                  <Slider
                    value={inputs.ageRange}
                    onValueChange={(value) => handleChange("ageRange", value)}
                    max={60}
                    min={18}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Height Range */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Height Range: {Math.floor(inputs.heightRange[0] / 12)}'{inputs.heightRange[0] % 12}" - {Math.floor(inputs.heightRange[1] / 12)}'{inputs.heightRange[1] % 12}"
                  </Label>
                  <Slider
                    value={inputs.heightRange}
                    onValueChange={(value) => handleChange("heightRange", value)}
                    max={84}
                    min={48}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Weight Range */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Weight Range: {inputs.weightRange[0]} - {inputs.weightRange[1]} kg
                  </Label>
                  <Slider
                    value={inputs.weightRange}
                    onValueChange={(value) => handleChange("weightRange", value)}
                    max={150}
                    min={40}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Build */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Build</Label>
                  <Select value={inputs.build} onValueChange={(value) => handleChange("build", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any build" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any build</SelectItem>
                      <SelectItem value="Slim">Slim</SelectItem>
                      <SelectItem value="Average">Average</SelectItem>
                      <SelectItem value="Athletic">Athletic</SelectItem>
                      <SelectItem value="Muscular">Muscular</SelectItem>
                      <SelectItem value="Curvy">Curvy</SelectItem>
                      <SelectItem value="Heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Appearance */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Appearance</Label>
                  <Select value={inputs.appearance} onValueChange={(value) => handleChange("appearance", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any appearance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any appearance</SelectItem>
                      <SelectItem value="Very Fair">Very Fair</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Dark">Dark</SelectItem>
                      <SelectItem value="Very Dark">Very Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Marital Status */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Marital Status</Label>
                  <Select value={inputs.maritalStatus} onValueChange={(value) => handleChange("maritalStatus", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any status</SelectItem>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pattern of Salaah */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Pattern of Salaah</Label>
                  <Select value={inputs.patternOfSalaah} onValueChange={(value) => handleChange("patternOfSalaah", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any practice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any practice</SelectItem>
                      <SelectItem value="always">Always prays</SelectItem>
                      <SelectItem value="usually">Usually prays</SelectItem>
                      <SelectItem value="sometimes">Sometimes prays</SelectItem>
                      <SelectItem value="rarely">Rarely prays</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <Button onClick={handleSearch} className="px-8">
                  Search
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Search Summary */}
        {summaryEnabled && !expanded && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                Looking for a {inputs.ageRange[0]} to {inputs.ageRange[1]} year old {inputs.nationality} {currentUser?.gender === "male" ? "sister" : "brother"} who lives in {inputs.country}. 
                {currentUser?.gender === "male" ? "Her" : "His"} build should be {inputs.build} with {inputs.appearance} looks.
                Somewhere between {Math.floor(inputs.heightRange[0] / 12)}'{inputs.heightRange[0] % 12}" to {Math.floor(inputs.heightRange[1] / 12)}'{inputs.heightRange[1] % 12}" in height 
                and weighs from around {inputs.weightRange[0]} to {inputs.weightRange[1]} kg.
                {currentUser?.gender === "male" ? "She" : "He"} should be {inputs.maritalStatus} one who {camelCaseToWords(inputs.patternOfSalaah)} prays {currentUser?.gender === "male" ? "her" : "his"} salaah.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sort Controls */}
        {!loading && (
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Sort by</span>
              <ToggleGroup type="single" value={inputs.sortBy} onValueChange={handleToggleChange}>
                <ToggleGroupItem value="lastSeen">Last Seen</ToggleGroupItem>
                <ToggleGroupItem value="created">Newest</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          (() => {
            const matchedUserIds = new Set(currentUser?.matches?.map(match => match._id) || []);
            const displayedUsers = results.filter(user => !matchedUserIds.has(user._id));

            return (
              <>
                {displayedUsers.length > 0 ? (
                  <div className="space-y-4 pb-16">
                    {displayedUsers.map((user, index) => (
                      <Fragment key={user._id || user.username}>
                        <UserCard user={user} isSearch={true} />
                        {(index + 1) % 5 === 0 && <Advert />}
                      </Fragment>
                    ))}
                
                {/* Pagination */}
                <div className="flex justify-center items-center space-x-4 mt-8">
                  <Button 
                    onClick={handlePrev}
                    disabled={page === 1}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button 
                    onClick={handleNext}
                    disabled={page === totalPages}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">Your search did not return any new results. Try adjusting your filters.</p>
                    </CardContent>
                  </Card>
                )}
              </>
            );
          })()
        )}
      </div>
      <Navbar />
    </div>
  );
};

export default Search;
