
import { ReactNode } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
  valueClassName?: string;
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend, 
  className,
  valueClassName
}: StatsCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          {icon && <div className="p-2 bg-primary/10 text-primary rounded-full">{icon}</div>}
          <div className={cn("text-right", !icon && "w-full text-left")}>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn("text-2xl font-bold", valueClassName)}>
              {value}
            </p>
            {trend && (
              <p className={cn(
                "text-xs mt-1",
                trend.positive ? "text-green-600" : "text-red-600"
              )}>
                {trend.positive ? "+" : "-"}{trend.value}%
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
