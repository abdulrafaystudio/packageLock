
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireBasicAccess?: boolean;
  requireInvestorAccess?: boolean;
  requireDealCreation?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireBasicAccess = false,
  requireInvestorAccess = false,
  requireDealCreation = false,
}) => {
  const { user, loading, permissions } = useAuth();

  // Show loading while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user, navigate to auth page
  if (!user) {
    return <Navigate to="/auth-free" replace />;
  }

  // Check basic access if required
  if (requireBasicAccess && !permissions.canAccessBasicFeatures) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Restricted</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You don't have permission to access this feature.
          </p>
          <Navigate to="/pricing" replace />
        </div>
      </div>
    );
  }

  // Check investor access if required
  if (requireInvestorAccess && !permissions.canAccessInvestors) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Premium Access Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need a Premium or higher package to access the investors database.
          </p>
          <Navigate to="/pricing" replace />
        </div>
      </div>
    );
  }

  // Check deal creation if required
  if (requireDealCreation && !permissions.canCreateDeals) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Deal Creation Access Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            You need a Standard or higher package to create deals.
          </p>
          <Navigate to="/pricing" replace />
        </div>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};

export default ProtectedRoute;
