
import React from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import RecoveryProcessor from '@/components/testing/RecoveryProcessor';
import PaymentScanner from '@/components/testing/PaymentScanner';
import ManualRecovery from '@/components/testing/ManualRecovery';
import PasswordFixRunner from '@/components/testing/PasswordFixRunner';
import TestDashboardCard from '@/components/testing/TestDashboardCard';

const TestDashboard = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Testing Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Test and debug various system components and recovery tools.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <TestDashboardCard
              title="Recovery Systems"
              description="Test payment recovery and account creation systems"
              icon="🔄"
              status="active"
            />
            <TestDashboardCard
              title="Payment Processing"
              description="Verify payment flows and Stripe integration"
              icon="💳"
              status="active"
            />
            <TestDashboardCard
              title="Password Management"
              description="Fix password issues for existing accounts"
              icon="🔐"
              status="active"
            />
          </div>

          <div className="grid gap-6">
            <PasswordFixRunner />
            <RecoveryProcessor />
            <PaymentScanner />
            <ManualRecovery />
          </div>
        </div>
      </main>
    </div>
  );
};

export default TestDashboard;
