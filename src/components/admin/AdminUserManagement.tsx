
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminStats from './AdminStats';
import UsersTable from './UsersTable';

const AdminUserManagement: React.FC = () => {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_all_users_with_stats');
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.is_active).length;
  const freeUsers = users.filter(user => user.package_type === 'free').length;
  const premiumUsers = users.filter(user => user.package_type !== 'free').length;

  return (
    <div className="space-y-6">
      <AdminStats 
        totalUsers={totalUsers}
        activeUsers={activeUsers}
        freeUsers={freeUsers}
        premiumUsers={premiumUsers}
      />
      <UsersTable users={users} />
    </div>
  );
};

export default AdminUserManagement;
