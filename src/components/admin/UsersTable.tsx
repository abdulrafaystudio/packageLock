
import React from 'react';
import UserTableHeader from './UserTableHeader';
import UserTableRow from './UserTableRow';

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

interface UsersTableProps {
  users: UserData[];
  loading?: boolean;
}

const UsersTable: React.FC<UsersTableProps> = ({ users, loading = false }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white dark:bg-gray-800 rounded-lg shadow">
        <UserTableHeader />
        <tbody>
          {users.map((user) => (
            <UserTableRow key={user.user_id} user={user} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;
