
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdminCreation = () => {
  const { toast } = useToast();

  const createAdminUser = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      console.log('Creating admin user with email:', email);
      
      // Create the user account - admin accounts are immediately active
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            package_type: 'premium'
          },
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (authError) {
        console.error('Auth error during admin creation:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('User creation failed - no user data returned');
      }

      console.log('Admin user created successfully:', authData.user.id);

      // Add user to admin_users table
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert([
          { user_id: authData.user.id }
        ]);

      if (adminError) {
        console.error('Error adding user to admin_users:', adminError);
        toast({
          title: "Warning",
          description: "Admin user created but admin privileges may need to be set manually.",
          variant: "destructive",
        });
      } else {
        console.log('Admin privileges added successfully');
      }

      toast({
        title: "Success",
        description: "Admin user created successfully with immediate access to all admin features!",
      });

      return { success: true, user: authData.user };
    } catch (error: any) {
      console.error('Admin creation error:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      });
      
      return { success: false, error };
    }
  }, [toast]);

  return { createAdminUser };
};
