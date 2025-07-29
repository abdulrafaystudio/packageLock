
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PasswordChangeSection: React.FC = () => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const { toast } = useToast();

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation don't match.",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated."
      });

      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const cancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswords({
      current: false,
      new: false,
      confirm: false
    });
  };

  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-gray-900 dark:text-gray-300 transition-colors duration-300">Password</Label>
        {!isChangingPassword && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsChangingPassword(true)}
            className="text-gray-900 dark:text-gray-300 border-gray-300 dark:border-gray-600 bg-slate-300 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 hover:text-white transition-colors duration-300"
          >
            Change Password
          </Button>
        )}
      </div>

      {isChangingPassword && (
        <div className="space-y-4">
          <div>
            <Label className="text-gray-900 dark:text-gray-300 transition-colors duration-300">New Password</Label>
            <div className="relative">
              <Input 
                type={showPasswords.new ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={e => handlePasswordChange('newPassword', e.target.value)}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 transition-colors duration-300 pr-10"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('new')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Label className="text-gray-900 dark:text-gray-300 transition-colors duration-300">Confirm New Password</Label>
            <div className="relative">
              <Input 
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={e => handlePasswordChange('confirmPassword', e.target.value)}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-300 transition-colors duration-300 pr-10"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handlePasswordUpdate}
              disabled={isUpdatingPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="bg-primary-600 hover:bg-primary-700 text-white hover:text-white"
            >
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </Button>
            <Button 
              variant="outline"
              onClick={cancelPasswordChange}
              className="text-gray-900 dark:text-gray-300 border-gray-300 dark:border-gray-600 bg-slate-300 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 hover:text-white transition-colors duration-300"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordChangeSection;
