
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  resetEmail: string;
  onResetEmailChange: (email: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const ForgotPasswordDialog = ({ 
  isOpen, 
  onOpenChange, 
  resetEmail, 
  onResetEmailChange, 
  onSubmit, 
  isLoading 
}: ForgotPasswordDialogProps) => {
  return (
    <div className="text-center mt-4">
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <button className="text-primary-600 hover:text-primary-700 text-sm">
            Forgot Password?
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800 border-purple-300 dark:border-purple-600">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={resetEmail}
                onChange={(e) => onResetEmailChange(e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Submit'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ForgotPasswordDialog;
