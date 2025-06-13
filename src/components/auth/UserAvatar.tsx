import { User } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface UserAvatarProps {
  user: SupabaseUser;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function UserAvatar({
  user,
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  // Get profile picture from user metadata
  const getProfilePicture = () => {
    // Check user_metadata for Google profile picture
    if (user.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }

    // Check user_metadata for picture (another common field)
    if (user.user_metadata?.picture) {
      return user.user_metadata.picture;
    }

    // Check identities for Google profile picture
    const googleIdentity = user.identities?.find(
      (identity) => identity.provider === 'google'
    );
    if (googleIdentity?.identity_data?.picture) {
      return googleIdentity.identity_data.picture;
    }

    return null;
  };

  // Get initials from name or email
  const getInitials = () => {
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }

    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }

    return 'U';
  };

  const profilePicture = getProfilePicture();
  const initials = getInitials();

  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (profilePicture && !imageError) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 ${className}`}
      >
        <Image
          src={profilePicture}
          alt={user.user_metadata?.full_name || user.email || 'User'}
          width={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
          height={size === 'sm' ? 24 : size === 'md' ? 32 : 48}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center ${className}`}
    >
      {initials ? (
        <span
          className={`${textSizeClasses[size]} font-medium text-blue-600 dark:text-blue-400`}
        >
          {initials}
        </span>
      ) : (
        <User
          className={`${iconSizeClasses[size]} text-blue-600 dark:text-blue-400`}
        />
      )}
    </div>
  );
}
