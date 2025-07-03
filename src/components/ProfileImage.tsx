
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileImageProps {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const ProfileImage = ({ 
  src, 
  alt, 
  fallback, 
  className = "", 
  size = "md" 
}: ProfileImageProps) => {
  const [error, setError] = useState(false);
  
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-16 w-16",
    lg: "h-24 w-24",
    xl: "h-32 w-32"
  };
  
  const initials = fallback || alt.substring(0, 2).toUpperCase();
  
  // Use a default placeholder if the image URL is empty or invalid
  const imageSrc = (src && src.trim() !== "") ? src : "/placeholder.svg";
  
  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage 
        src={error ? "/placeholder.svg" : imageSrc} 
        alt={alt}
        onError={() => setError(true)} 
      />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
};

export default ProfileImage;
