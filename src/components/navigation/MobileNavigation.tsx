
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MobileNavigationProps {
  user: any;
  isMenuOpen: boolean;
  onMenuClose: () => void;
  onSignOut: () => Promise<void>;
}

const MobileNavigation = ({ user, isMenuOpen, onMenuClose, onSignOut }: MobileNavigationProps) => {
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  if (!isMenuOpen) return null;

  const handleLinkClick = () => {
    onMenuClose();
  };

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      await onSignOut();
      onMenuClose();
    } catch (error) {
      console.error('MobileNavigation: Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="px-6 pt-2 pb-3 space-y-1">
        <Link
          to="/companies"
          className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 py-2"
          onClick={handleLinkClick}
        >
          Companies
        </Link>
        <Link
          to="/investors"
          className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 py-2"
          onClick={handleLinkClick}
        >
          Investors
        </Link>
        {isAdmin && (
          <Link
            to="/process-investors"
            className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 py-2"
            onClick={handleLinkClick}
          >
            Process Investors
          </Link>
        )}
        <Link
          to="/pricing"
          className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 py-2"
          onClick={handleLinkClick}
        >
          Pricing
        </Link>
        <Link
          to="/about-us"
          className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 py-2"
          onClick={handleLinkClick}
        >
          About Us
        </Link>
        <Link
          to="/how-it-works"
          className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 py-2"
          onClick={handleLinkClick}
        >
          How It Works
        </Link>
        <Link
          to="/help-center"
          className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 py-2"
          onClick={handleLinkClick}
        >
          Help Center
        </Link>
        
        {user ? (
          <>
            <Link
              to="/profile"
              className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 py-2"
              onClick={handleLinkClick}
            >
              Profile
            </Link>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 py-2 w-full text-left disabled:opacity-50"
            >
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="block text-gray-700 dark:text-gray-300 hover:text-primary-600 py-2"
            onClick={handleLinkClick}
          >
            Login
          </Link>
        )}
      </div>
    </div>
  );
};

export default MobileNavigation;
