import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TopBarItem {
  title: string;
  number: number;
  stats: number;
  icon: React.ReactNode;
  color: string;
}

interface DashboardTopBarProps {
  topBar: TopBarItem[];
  setTop: (index: number) => void;
}

const DashboardTopBar: React.FC<DashboardTopBarProps> = ({ topBar, setTop }) => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {topBar.map(({ icon, number, title, stats, color }, index, arr) => (
        <Card
          key={title}
          className="cursor-pointer hover:shadow-md transition-shadow"
          style={{ borderLeft: `3px solid ${color}` }}
          onClick={() =>
            index === arr.length - 1
              ? navigate("/notifications")
              : setTop(index)
          }
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold text-slate-700 mt-1">{number}</p>
                
                <div className="border-t border-gray-200 my-2"></div>
                
                <div className="flex items-center gap-1 text-xs">
                  <span
                    className={`flex items-center font-bold ${
                      stats === 0 ? 'text-gray-500' : stats > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stats === 0 ? (
                      <Minus className="w-3 h-3 mr-1" />
                    ) : stats > 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    {Math.abs(stats)}%
                  </span>
                  <span className="text-muted-foreground">this week</span>
                </div>
              </div>
              <div className="ml-4">
                {icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardTopBar;
