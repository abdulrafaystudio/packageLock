
import React from 'react';
import PackageBadge from './PackageBadge';
import StatusBadge from './StatusBadge';

interface UserData {
  user_id: string;
  full_name: string;
  email: string;
  company_name: string;
  package_type: string;
  subscription_start_date: string;
  subscription_end_date: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
  days_since_signup?: number;
}

interface UserTableRowProps {
  user: UserData;
}

const UserTableRow: React.FC<UserTableRowProps> = ({ user }) => {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="p-3 text-gray-900 dark:text-gray-300">{user.full_name || 'Not set'}</td>
      <td className="p-3 text-gray-900 dark:text-gray-300">{user.email}</td>
      <td className="p-3 text-gray-900 dark:text-gray-300">{user.company_name || 'Not set'}</td>
      <td className="p-3">
        <PackageBadge packageType={user.package_type as 'free' | 'standard' | 'premium' | 'enterprise' | 'premiumpro' | 'freepro'} />
      </td>
      <td className="p-3">
        <StatusBadge isActive={user.is_active} />
      </td>
      <td className="p-3 text-gray-900 dark:text-gray-300">
        {new Date(user.created_at).toLocaleDateString()}
      </td>
      <td className="p-3 text-gray-900 dark:text-gray-300">
        {user.days_since_signup || 0} days
      </td>
    </tr>
  );
};

export default UserTableRow;
