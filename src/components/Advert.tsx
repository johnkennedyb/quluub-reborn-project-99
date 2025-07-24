import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const Advert: React.FC = () => {
  const { user } = useAuth();

  // Only show for freemium users (matching taofeeq_UI logic)
  if (user?.plan !== 'freemium') {
    return null;
  }

  return (
    <Card className="w-full cursor-pointer">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-slate-700 capitalize">
              Advert
            </h3>
          </div>
          <div>
            <span className="text-sm text-muted-foreground italic">
              This is sponsored
            </span>
          </div>
        </div>
        
        <div className="border-t border-gray-200 my-2"></div>
        
        <p className="text-muted-foreground text-sm">
          Sponsored post placeholder
        </p>
      </CardContent>
    </Card>
  );
};

export default Advert;
