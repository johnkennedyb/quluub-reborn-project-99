
import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
}

export function DashboardCard({ title, className, children, icon }: DashboardCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-primary/5 flex flex-row items-center justify-between pb-2 pt-4">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  );
}
