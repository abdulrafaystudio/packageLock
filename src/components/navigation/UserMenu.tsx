
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserMenuProps {
  user: any;
  onSignOut: () => Promise<void>;
}

const UserMenu = ({ user, onSignOut }: UserMenuProps) => {
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) {
    return (
      <Link to="/login">
        <Button className="rounded-full bg-primary-600 hover:bg-primary-700 text-white hover:text-white">
          Login
        </Button>
      </Link>
    );
  }

  const handleSignOut = async () => {
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    try {
      await onSignOut();
    } catch (error) {
      console.error('UserMenu: Sign out error:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-gray-700 dark:text-gray-300 hover:text-white" disabled={isSigningOut}>
          {isSigningOut ? 'Signing out...' : 'Account'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg">
        <DropdownMenuItem asChild className="hover:bg-primary-600 hover:text-white focus:bg-primary-600 focus:text-white">
          <Link to="/profile" className="text-gray-700 dark:text-gray-300 hover:text-white focus:text-white w-full block">
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSignOut} 
          disabled={isSigningOut}
          className="text-gray-700 dark:text-gray-300 hover:bg-primary-600 hover:text-white focus:bg-primary-600 focus:text-white disabled:opacity-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
