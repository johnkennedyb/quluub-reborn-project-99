import React from 'react';
import { useParams } from 'react-router-dom';
import UserProfile from '@/components/admin/UserProfile';

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();

  if (!userId) {
    return <div>Invalid user ID.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <UserProfile userId={userId} />
    </div>
  );
};

export default UserProfilePage;
