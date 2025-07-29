
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface CompanyDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CompanyDetailsDialog = ({ isOpen, onClose }: CompanyDetailsDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log('CompanyDetailsDialog - user exists:', !!user, 'isOpen:', isOpen, 'user object:', user);

  const handleSignInClick = () => {
    console.log('Sign In button clicked - navigating to login');
    onClose();
    navigate('/login');
  };

  const handleUpgradeClick = () => {
    console.log('Upgrade Plan button clicked - navigating to pricing');
    onClose();
    navigate('/pricing');
  };

  // Simple boolean check - if no user, they need to sign in
  const userIsLoggedIn = user !== null && user !== undefined;
  console.log('userIsLoggedIn check:', userIsLoggedIn, 'user value:', user);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] mx-auto bg-white border-gray-300 sm:w-full sm:mx-4">
        <DialogHeader>
          <div className="text-center">
            <Lock className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <DialogTitle className="text-2xl font-bold text-black mb-4">
              Sign In Required
            </DialogTitle>
            <p className="text-black mb-6">
              You need to sign in to access this page.
            </p>
            <div className="space-y-3">
              {/* Show Sign In button when user is NOT logged in */}
              {!userIsLoggedIn && (
                <Button 
                  onClick={handleSignInClick}
                  className="w-full bg-purple-400 hover:bg-purple-500 text-white hover:text-white"
                >
                  Sign In
                </Button>
              )}
              
              {/* Always show Upgrade Plan button */}
              <Button 
                onClick={handleUpgradeClick}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white hover:text-white"
              >
                Upgrade Plan
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyDetailsDialog;
