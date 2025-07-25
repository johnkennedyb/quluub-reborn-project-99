import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@/types/user';
import UserCard from './UserCard';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardTabsProps {
  receivedRequestArray: User[];
  sentRequestArray: User[];
  matchesArray: User[];
  favoritesArray?: User[];
  isLoading: boolean;
  top: number;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({
  receivedRequestArray,
  sentRequestArray,
  matchesArray,
  favoritesArray = [],
  isLoading,
  top,
}) => {
  const [activeTab, setActiveTab] = useState('matches');
  const { user } = useAuth();

  useEffect(() => {
    const tabs = ['matches', 'received', 'sent'];
    setActiveTab(tabs[top] || 'matches');
  }, [top]);

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4">📭</div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  // Desktop view with tabs
  const DesktopView = () => (
    <div className="hidden sm:block">
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="matches">
                Matches ({matchesArray?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="received">
                Received Requests ({receivedRequestArray?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="sent">
                Sent Requests ({sentRequestArray?.length || 0})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="matches" className="mt-0">
              <div className="max-h-[63.25vh] overflow-y-auto p-4 space-y-4">
                {matchesArray?.length > 0 ? (
                  matchesArray.map((user) => (
                    <UserCard 
                      key={user._id || user.username} 
                      user={user} 
                      showChatButton={true}
                      showViewProfileButton={true}
                    />
                  ))
                ) : (
                  <EmptyState message="No matches yet" />
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="received" className="mt-0">
              <div className="max-h-[63.25vh] overflow-y-auto p-4 space-y-4">
                {receivedRequestArray?.length > 0 ? (
                  receivedRequestArray.map((user) => (
                    <UserCard key={user._id || user.username} user={user} />
                  ))
                ) : (
                  <EmptyState message="No pending received requests yet" />
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="sent" className="mt-0">
              <div className="max-h-[63.25vh] overflow-y-auto p-4 space-y-4">
                {sentRequestArray?.length > 0 ? (
                  sentRequestArray.map((user) => (
                    <UserCard key={user._id || user.username} user={user} />
                  ))
                ) : (
                  <EmptyState message="No pending sent requests yet" />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  // Mobile view with accordion
  const MobileView = () => (
    <div className="block sm:hidden pb-4">
      <Accordion type="single" collapsible value={activeTab} onValueChange={setActiveTab}>
        <AccordionItem value="matches">
          <AccordionTrigger>
            Matches ({matchesArray?.length || 0})
          </AccordionTrigger>
          <AccordionContent>
            <div className="max-h-64 overflow-y-auto space-y-4 p-2">
              {matchesArray?.length > 0 ? (
                matchesArray.map((user) => (
                  <UserCard key={user._id || user.username} user={user} />
                ))
              ) : (
                <EmptyState message="No matches yet" />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="received">
          <AccordionTrigger>
            Received Requests ({receivedRequestArray?.length || 0})
          </AccordionTrigger>
          <AccordionContent>
            <div className="max-h-64 overflow-y-auto space-y-4 p-2">
              {receivedRequestArray?.length > 0 ? (
                receivedRequestArray.map((user) => (
                  <UserCard key={user._id || user.username} user={user} />
                ))
              ) : (
                <EmptyState message="No pending received requests yet" />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="sent">
          <AccordionTrigger>
            Sent Requests ({sentRequestArray?.length || 0})
          </AccordionTrigger>
          <AccordionContent>
            <div className="max-h-64 overflow-y-auto space-y-4 p-2">
              {sentRequestArray?.length > 0 ? (
                sentRequestArray.map((user) => (
                  <UserCard key={user._id || user.username} user={user} />
                ))
              ) : (
                <EmptyState message="No pending sent requests yet" />
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  return (
    <>
      <DesktopView />
      <MobileView />
    </>
  );
};

export default DashboardTabs;
