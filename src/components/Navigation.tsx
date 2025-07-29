
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import DarkModeToggle from './navigation/DarkModeToggle';
import DesktopNavigation from './navigation/DesktopNavigation';
import MobileNavigation from './navigation/MobileNavigation';


const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, loading: authLoading, subscriptionLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      console.log('🔄 Navigation: Starting sign out process...');
      await signOut();
      
      // Navigate to home page after successful sign out
      navigate('/');
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
      
      console.log('✅ Navigation: Sign out completed successfully');
    } catch (error: any) {
      console.error('💥 Navigation: Sign out failed:', error);
      
      // Even if there's an error, still navigate home and show success
      // because the auth state has been cleared
      navigate('/');
      
      toast({
        title: "Signed out",
        description: "You have been signed out of your account.",
      });
    }
  };

  // Only show dark mode toggle on profile page
  const showDarkModeToggle = location.pathname === '/profile';

  // Show loading state only for auth loading (not subscription loading)
  if (authLoading) {
    return (
      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/">
                <img src="/lovable-uploads/7a960451-f962-4360-8add-80c4cf6390da.png" alt="EasyFund Logo" className="h-10 w-auto" />
              </Link>
            </div>
            <div className="animate-pulse">
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {showDarkModeToggle && <DarkModeToggle />}

      <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-50 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/">
                <img src="/lovable-uploads/7a960451-f962-4360-8add-80c4cf6390da.png" alt="EasyFund Logo" className="h-10 w-auto" />
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <DesktopNavigation user={user} onSignOut={handleSignOut} />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600"
                aria-label="Toggle mobile menu"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        <MobileNavigation 
          user={user}
          isMenuOpen={isMenuOpen}
          onMenuClose={() => setIsMenuOpen(false)}
          onSignOut={handleSignOut}
        />
      </nav>
    </>
  );
};

export default Navigation;
