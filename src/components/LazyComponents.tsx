import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

// Loading fallback components for better UX
const ComponentSkeleton = () => (
  <div className="space-y-4">
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardContent>
    </Card>
  </div>
);

const ProfileSkeleton = () => (
  <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Skeleton className="w-24 h-24 rounded-full mb-4" />
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

// Lazy loaded components for code splitting
export const LazyProfileOptimized = lazy(() => import('@/pages/ProfileOptimized'));
export const LazyMessages = lazy(() => import('@/pages/Messages'));
export const LazySearchNew = lazy(() => import('@/pages/SearchNew'));
export const LazySettingsNew = lazy(() => import('@/pages/SettingsNew'));
export const LazyNotificationsNew = lazy(() => import('@/pages/NotificationsNew'));
export const LazyDashboardNew = lazy(() => import('@/pages/DashboardNew'));
export const LazyAdminDashboard = lazy(() => import('@/pages/AdminDashboard'));

// Lazy loaded components with specific skeletons
export const LazyUserProfileView = lazy(() => import('@/components/UserProfileView'));
export const LazyMaterialChatInterface = lazy(() => import('@/components/MaterialChatInterface'));
export const LazyVirtualizedUserList = lazy(() => import('@/components/VirtualizedUserList'));

// Higher-order component for wrapping lazy components with Suspense
export const withLazyLoading = <P extends object>(
  Component: React.LazyExoticComponent<React.ComponentType<P>>,
  fallback: React.ReactNode = <ComponentSkeleton />
) => {
  return (props: P) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};

// Pre-configured lazy components with appropriate skeletons
export const ProfileOptimizedWithSuspense = withLazyLoading(LazyProfileOptimized, <ProfileSkeleton />);
export const MessagesWithSuspense = withLazyLoading(LazyMessages, <ComponentSkeleton />);
export const SearchWithSuspense = withLazyLoading(LazySearchNew, <ComponentSkeleton />);
export const SettingsWithSuspense = withLazyLoading(LazySettingsNew, <ComponentSkeleton />);
export const NotificationsWithSuspense = withLazyLoading(LazyNotificationsNew, <ComponentSkeleton />);
export const DashboardWithSuspense = withLazyLoading(LazyDashboardNew, <ComponentSkeleton />);
export const AdminDashboardWithSuspense = withLazyLoading(LazyAdminDashboard, <ComponentSkeleton />);

// Component-level lazy loading
export const UserProfileViewWithSuspense = withLazyLoading(LazyUserProfileView, <ProfileSkeleton />);
export const ChatInterfaceWithSuspense = withLazyLoading(LazyMaterialChatInterface, <ComponentSkeleton />);
export const VirtualizedListWithSuspense = withLazyLoading(LazyVirtualizedUserList, <ComponentSkeleton />);
