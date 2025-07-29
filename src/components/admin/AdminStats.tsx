
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsData {
  free: number;
  standard: number;
  premium: number;
  enterprise: number;
  premiumpro: number;
  freepro: number;
  total: number;
}

interface AdminStatsProps {
  totalUsers?: number;
  activeUsers?: number;
  freeUsers?: number;
  premiumUsers?: number;
  stats?: StatsData;
}

const AdminStats: React.FC<AdminStatsProps> = ({ 
  totalUsers, 
  activeUsers, 
  freeUsers, 
  premiumUsers,
  stats
}) => {
  // Use stats object if provided, otherwise use individual props with fallback
  const data = stats ? {
    totalUsers: stats.total,
    freeCompanies: stats.free,
    freeBrokers: stats.freepro,
    standard: stats.standard,
    premium: stats.premium,
    premiumPro: stats.premiumpro,
    enterprise: stats.enterprise
  } : {
    totalUsers: totalUsers || 0,
    freeCompanies: freeUsers || 0,
    freeBrokers: 0,
    standard: 0,
    premium: premiumUsers || 0,
    premiumPro: 0,
    enterprise: 0
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-6 mb-8">
      <Card className="bg-white dark:bg-gray-800 border-purple-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {data.totalUsers}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-purple-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Free (Companies)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {data.freeCompanies}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-purple-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Free Pro (Brokers)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-cyan-600">
            {data.freeBrokers}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-purple-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Standard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {data.standard}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-purple-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Premium
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {data.premium}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-purple-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Premium Pro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-600">
            {data.premiumPro}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-purple-300">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Enterprise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {data.enterprise}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;
