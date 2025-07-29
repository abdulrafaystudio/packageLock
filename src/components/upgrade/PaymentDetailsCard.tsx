
import React, { useState } from 'react';
import { CreditCard, Check, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import UpgradeErrorBoundary from './UpgradeErrorBoundary';

interface PaymentDetailsCardProps {
  plan: any;
  isYearly: boolean;
  isProcessing: boolean;
  onUpgrade: () => Promise<void>;
  currentPackage?: string;
}

const PaymentDetailsCard = ({ 
  plan, 
  isYearly, 
  isProcessing, 
  onUpgrade, 
  currentPackage 
}: PaymentDetailsCardProps) => {
  const [error, setError] = useState<Error | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const savings = isYearly ? (plan.monthlyPrice * 12 - plan.yearlyPrice) : 0;

  const handleUpgrade = async () => {
    try {
      setError(null);
      await onUpgrade();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await handleUpgrade();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleContactSupport = () => {
    window.location.href = '/support';
  };

  if (error) {
    return (
      <UpgradeErrorBoundary
        error={error}
        onRetry={handleRetry}
        onContactSupport={handleContactSupport}
        isRetrying={isRetrying}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300">Plan</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {plan.name}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300">Billing</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {isYearly ? 'Yearly' : 'Monthly'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-300">Amount</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              ${price}{isYearly ? '/year' : '/month'}
            </span>
          </div>
          
          {isYearly && savings > 0 && (
            <div className="flex items-center justify-between text-green-600 dark:text-green-400">
              <span className="flex items-center gap-1">
                <Check className="w-4 h-4" />
                Annual Savings
              </span>
              <span className="font-semibold">
                ${savings}
              </span>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>${price}{isYearly ? '/year' : '/month'}</span>
          </div>
        </div>

        {currentPackage && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">
                Upgrading from {currentPackage} plan
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              Changes will take effect immediately with prorated billing
            </p>
          </div>
        )}

        <Button
          onClick={handleUpgrade}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? 'Processing...' : `Upgrade to ${plan.name}`}
        </Button>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Secure payment processed by Stripe. Cancel anytime.
        </p>
      </CardContent>
    </Card>
  );
};

export default PaymentDetailsCard;
