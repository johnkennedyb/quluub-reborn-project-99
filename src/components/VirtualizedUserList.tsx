import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { User } from '@/types/user';
import UserCard from './UserCard';

interface VirtualizedUserListProps {
  users: User[];
  height: number;
  itemHeight?: number;
  showChatButton?: boolean;
  showViewProfileButton?: boolean;
  className?: string;
}

interface ListItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    users: User[];
    showChatButton?: boolean;
    showViewProfileButton?: boolean;
  };
}

const ListItem: React.FC<ListItemProps> = ({ index, style, data }) => {
  const { users, showChatButton, showViewProfileButton } = data;
  const user = users[index];

  if (!user) return null;

  return (
    <div style={style} className="px-2 py-1">
      <UserCard
        user={user}
        showChatButton={showChatButton}
        showViewProfileButton={showViewProfileButton}
      />
    </div>
  );
};

const VirtualizedUserList: React.FC<VirtualizedUserListProps> = ({
  users,
  height,
  itemHeight = 200,
  showChatButton = false,
  showViewProfileButton = false,
  className = ''
}) => {
  // Memoize the item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    users,
    showChatButton,
    showViewProfileButton
  }), [users, showChatButton, showViewProfileButton]);

  // Memoize the item count
  const itemCount = useMemo(() => users.length, [users.length]);

  // Memoized item size getter for consistent performance
  const getItemSize = useCallback(() => itemHeight, [itemHeight]);

  if (itemCount === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
        <div className="text-6xl mb-4">📭</div>
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <List
        height={height}
        itemCount={itemCount}
        itemSize={getItemSize}
        itemData={itemData}
        overscanCount={5} // Render 5 extra items for smoother scrolling
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {ListItem}
      </List>
    </div>
  );
};

export default VirtualizedUserList;
