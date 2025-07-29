
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

interface LoadingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  duration?: number;
}

interface EnhancedLoadingStatesProps {
  isLoading: boolean;
  steps: LoadingStep[];
  currentStep?: string;
  title?: string;
  description?: string;
  showRetryOption?: boolean;
  onRetry?: () => void;
}

const EnhancedLoadingStates: React.FC<EnhancedLoadingStatesProps> = ({
  isLoading,
  steps,
  currentStep,
  title = "Processing your request...",
  description = "Please wait while we complete your authentication.",
  showRetryOption = false,
  onRetry
}) => {
  if (!isLoading && steps.every(step => step.status === 'pending')) {
    return null;
  }

  const getStepIcon = (step: LoadingStep) => {
    switch (step.status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepBadge = (step: LoadingStep) => {
    const variants = {
      pending: 'outline' as const,
      processing: 'secondary' as const,
      completed: 'default' as const,
      failed: 'destructive' as const
    };
    
    return (
      <Badge variant={variants[step.status]} className="text-xs">
        {step.status.toUpperCase()}
      </Badge>
    );
  };

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const totalSteps = steps.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Progress Text */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {completedSteps} of {totalSteps} steps completed
          </div>

          {/* Steps List */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div 
                key={step.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  step.id === currentStep 
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                } ${
                  step.status === 'failed' 
                    ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' 
                    : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {getStepIcon(step)}
                  <div>
                    <div className="font-medium text-sm text-gray-900 dark:text-white">
                      {step.label}
                    </div>
                    {step.error && (
                      <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {step.error}
                      </div>
                    )}
                    {step.duration && step.status === 'completed' && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Completed in {step.duration}ms
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStepBadge(step)}
                </div>
              </div>
            ))}
          </div>

          {/* Retry Option */}
          {showRetryOption && onRetry && (
            <div className="text-center pt-2">
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <AlertCircle className="h-4 w-4" />
                Retry Authentication
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedLoadingStates;
