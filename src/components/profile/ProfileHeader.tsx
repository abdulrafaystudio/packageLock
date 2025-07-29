
import React from 'react';

const ProfileHeader = () => {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white transition-colors duration-300">
        My <span className="text-primary-600">Profile</span>
      </h1>
      <p className="text-xl max-w-2xl mx-auto text-gray-600 dark:text-gray-300 transition-colors duration-300">
        Manage your account settings and track your investment activities
      </p>
    </div>
  );
};

export default ProfileHeader;
