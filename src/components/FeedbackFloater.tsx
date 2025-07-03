
import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface FeedbackFloaterProps {
  onClose: () => void;
}

export function FeedbackFloater({ onClose }: FeedbackFloaterProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    if (!rating) {
      toast({
        title: "Please select a rating",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would send data to an API
    toast({
      title: "Feedback submitted",
      description: "Thank you for your valuable feedback!",
    });
    
    onClose();
  };

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-sm bg-white p-6 rounded-lg shadow-lg border border-primary/20 transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      } z-50`}
    >
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
      
      <h3 className="text-lg font-semibold mb-4">Rate Your Experience</h3>
      <p className="text-muted-foreground mb-3 text-sm">
        Your feedback helps us improve Quluub for the Muslim community.
      </p>
      
      <div className="flex justify-center mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            className="focus:outline-none"
          >
            <Star
              className={`w-8 h-8 ${
                (hover || rating) && star <= (hover || rating!)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      
      <Textarea
        placeholder="Share your thoughts with us (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mb-4 text-sm"
        rows={3}
      />
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Later
        </Button>
        <Button onClick={handleSubmit}>
          Submit Feedback
        </Button>
      </div>
    </div>
  );
}
