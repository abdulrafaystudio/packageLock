import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserData {
  user_id: string;
  full_name: string;
  email: string;
  company_name: string;
  package_type: string; // Changed from union type to string to match database function return
  subscription_start_date: string;
  subscription_end_date: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
  days_since_signup?: number;
}

interface StatsData {
  free: number;
  standard: number;
  premium: number;
  enterprise: number;
  premiumpro: number;
  freepro: number;
  total: number;
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<StatsData>({
    free: 0,
    standard: 0,
    premium: 0,
    enterprise: 0,
    premiumpro: 0,
    freepro: 0,
    total: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadAllUsers();
  }, []);

  useEffect(() => {
    if (selectedPackage === 'all') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(user => user.package_type === selectedPackage));
    }
  }, [selectedPackage, users]);

  const loadAllUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_all_users_with_stats');
      
      if (error) throw error;

      setUsers(data || []);
      
      // Calculate stats
      const newStats: Omit<StatsData, 'total'> = {
        free: 0,
        standard: 0,
        premium: 0,
        enterprise: 0,
        premiumpro: 0,
        freepro: 0,
      };
      
      data?.forEach(user => {
        const packageType = user.package_type as keyof typeof newStats;
        if (packageType in newStats) {
          newStats[packageType]++;
        }
      });
      
      setStats({...newStats, total: data?.length || 0});
    } catch (error: any) {
      toast({
        title: "Error loading users",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadUserData = (packageType: string = 'all') => {
    const dataToDownload = packageType === 'all' ? users : filteredUsers;
    
    if (dataToDownload.length === 0) {
      toast({
        title: "No data to download",
        description: "There are no users to export for the selected package type.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = [
      'User ID',
      'Full Name',
      'Email',
      'Company Name',
      'Package Type',
      'Subscription Start',
      'Subscription End',
      'Is Active',
      'Last Login',
      'Created At',
      'Days Since Signup'
    ];

    const csvContent = [
      headers.join(','),
      ...dataToDownload.map(user => [
        user.user_id,
        `"${user.full_name || ''}"`,
        user.email || '',
        `"${user.company_name || ''}"`,
        user.package_type,
        user.subscription_start_date || '',
        user.subscription_end_date || '',
        user.is_active,
        user.last_login || '',
        user.created_at || '',
        user.days_since_signup || 0
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_${packageType}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: `Downloading ${dataToDownload.length} users for ${packageType} package.`,
    });
  };

  return {
    users,
    filteredUsers,
    selectedPackage,
    setSelectedPackage,
    loading,
    stats,
    downloadUserData
  };
};
