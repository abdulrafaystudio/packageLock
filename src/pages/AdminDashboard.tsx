
import React from 'react';
import Footer from '@/components/Footer';
import AdminStats from '@/components/admin/AdminStats';
import AdminControls from '@/components/admin/AdminControls';
import AdminUserDemotion from '@/components/admin/AdminUserDemotion';
import UsersTable from '@/components/admin/UsersTable';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  
  // Check if user is admin
  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
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

  const {
    filteredUsers,
    selectedPackage,
    setSelectedPackage,
    loading,
    stats,
    downloadUserData
  } = useAdminUsers();

  const handleDownloadAll = () => downloadUserData('all');
  const handleDownloadFiltered = () => downloadUserData(selectedPackage);

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="pt-4 flex items-center justify-center min-h-screen">
          <Card className="max-w-md w-full mx-4 bg-white border-gray-300">
            <CardContent className="p-8 text-center">
              <Lock className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-black mb-4">
                Admin Access Required
              </h2>
              <p className="text-black mb-6">
                You need to sign in with an admin account to access this page.
              </p>
              <Link to="/login">
                <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                  Sign In
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="pt-4 flex items-center justify-center min-h-screen">
          <div className="text-gray-900 dark:text-white">Checking admin access...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="pt-4 flex items-center justify-center min-h-screen">
          <Card className="max-w-md w-full mx-4 bg-white border-gray-300">
            <CardContent className="p-8 text-center">
              <Lock className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-black mb-4">
                Access Denied
              </h2>
              <p className="text-black mb-6">
                You don't have admin privileges to access this page.
              </p>
              <Link to="/">
                <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                  Go Home
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="pt-4 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
              Admin <span className="text-primary-600">Dashboard</span>
            </h1>
            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
              Manage and export user data by package type
            </p>
          </div>

          <AdminStats stats={stats} />

          <div className="mb-8">
            <AdminUserDemotion />
          </div>

          <AdminControls
            selectedPackage={selectedPackage}
            onPackageChange={setSelectedPackage}
            onDownloadAll={handleDownloadAll}
            onDownloadFiltered={handleDownloadFiltered}
          />

          <UsersTable users={filteredUsers} loading={loading} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
