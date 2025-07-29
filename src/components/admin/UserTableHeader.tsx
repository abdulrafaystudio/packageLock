
import React from 'react';

const UserTableHeader: React.FC = () => {
  return (
    <thead className="bg-gray-50 dark:bg-gray-800">
      <tr>
        <th className="p-3 text-left text-gray-900 dark:text-gray-300 font-semibold">Name</th>
        <th className="p-3 text-left text-gray-900 dark:text-gray-300 font-semibold">Email</th>
        <th className="p-3 text-left text-gray-900 dark:text-gray-300 font-semibold">Company</th>
        <th className="p-3 text-left text-gray-900 dark:text-gray-300 font-semibold">Package</th>
        <th className="p-3 text-left text-gray-900 dark:text-gray-300 font-semibold">Status</th>
        <th className="p-3 text-left text-gray-900 dark:text-gray-300 font-semibold">Signup Date</th>
        <th className="p-3 text-left text-gray-900 dark:text-gray-300 font-semibold">Days Since Signup</th>
      </tr>
    </thead>
  );
};

export default UserTableHeader;
