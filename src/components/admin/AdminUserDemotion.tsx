
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminUserDemotion: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRemoveAdmin = async () => {
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('remove_admin_by_email', {
        user_email: email.trim()
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: `${email} has been removed as an admin`,
        });
        setEmail('');
      } else {
        toast({
          title: "Error",
          description: "User not found or not an admin",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove admin",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-purple-300">
      <CardHeader>
        <CardTitle>Remove Admin Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter email to remove admin access"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleRemoveAdmin()}
          />
          <Button 
            onClick={handleRemoveAdmin} 
            disabled={isLoading}
            variant="destructive"
          >
            {isLoading ? 'Removing...' : 'Remove Admin'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminUserDemotion;
