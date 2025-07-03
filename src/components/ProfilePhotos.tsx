
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ProfilePhotosProps {
  photos: string[];
  editable?: boolean;
}

const ProfilePhotos = ({ photos, editable = false }: ProfilePhotosProps) => {
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  
  // Mock handler for photo click in edit mode
  const handlePhotoClick = (index: number) => {
    if (editable) {
      console.log(`Clicked photo at index ${index}`);
    }
  };
  
  // Handle image loading error
  const handleImageError = (index: number) => {
    setImageErrors(prev => ({ ...prev, [index]: true }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Photos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <div 
              key={index} 
              className={cn(
                "aspect-square rounded-md overflow-hidden cursor-pointer",
                editable && "hover:opacity-80 transition-opacity"
              )}
              onClick={() => handlePhotoClick(index)}
            >
              {imageErrors[index] ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                  Image not available
                </div>
              ) : (
                <img 
                  src={photo || "/placeholder.svg"} 
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(index)}
                />
              )}
            </div>
          ))}
          
          {editable && photos.length < 6 && (
            <div 
              className="aspect-square rounded-md border-2 border-dashed border-muted flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => console.log("Add photo")}
            >
              <span className="text-2xl text-muted-foreground">+</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfilePhotos;
