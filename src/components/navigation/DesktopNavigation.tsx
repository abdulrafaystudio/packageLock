
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ResourcesDropdown from './ResourcesDropdown';
import UserMenu from './UserMenu';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DesktopNavigationProps {
  user: any;
  onSignOut: () => Promise<void>;
}

const DesktopNavigation = ({ user, onSignOut }: DesktopNavigationProps) => {
  const location = useLocation();
  
  // Check if user is admin
  const { data: isAdmin = false } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('Admin check error:', error);
          return false;
        }
        
        return !!data;
      } catch (error) {
        console.error('Admin check exception:', error);
        return false;
      }
    },
    enabled: !!user?.id,
  });

  const isActiveTab = (path: string) => {
    return location.pathname === path;
  };

  const getTabClassName = (path: string) => {
    const baseClass = "px-4 py-2 rounded-full transition-colors";
    if (isActiveTab(path)) {
      return `${baseClass} bg-primary-600 text-white hover:text-white`;
    }
    return `${baseClass} text-gray-700 dark:text-gray-300 hover:text-primary-600`;
  };

  return (
    <div className="hidden md:block">
      <div className="ml-10 flex items-center space-x-2">
        <Link to="/companies" className={getTabClassName('/companies')}>
          Companies
        </Link>
        <Link to="/investors" className={getTabClassName('/investors')}>
          Investors
        </Link>
        {isAdmin && (
          <>
            <Link to="/process-investors" className={getTabClassName('/process-investors')}>
              Process Investors
            </Link>
            <Link to="/admin" className={getTabClassName('/admin')}>
              Admin Dashboard
            </Link>
          </>
        )}
        <Link to="/pricing" className={getTabClassName('/pricing')}>
          Pricing
        </Link>
        <ResourcesDropdown />
        <UserMenu user={user} onSignOut={onSignOut} />
      </div>
    </div>
  );
};

export default DesktopNavigation;
