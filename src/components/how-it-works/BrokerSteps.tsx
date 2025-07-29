import React from 'react';
import StepCard from './StepCard';
import { UserPlus, FileText, Handshake } from 'lucide-react';

interface BrokerStepsProps {
  onStepClick: (id: string) => void;
}

const BrokerSteps = ({ onStepClick }: BrokerStepsProps) => {
  const steps = [
    {
      id: 'post-deal',
      icon: UserPlus,
      title: 'Post Your Deals',
      description: 'Create deals for your clients and list their investment opportunities to attract potential investors.',
      color: 'bg-purple-500'
    },
    {
      id: 'get-leads',
      icon: FileText,
      title: 'Get Leads',
      description: 'Access thousands of verified investors and use powerful filters to find the right match for your deals.',
      color: 'bg-purple-600'
    },
    {
      id: 'close-deals',
      icon: Handshake,
      title: 'Close Deals',
      description: 'Manage communications, coordinate meetings, and help your clients close deals with interested investors.',
      color: 'bg-purple-700'
    }
  ];

  return (
    <div className="mb-16">
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            number={String(index + 1).padStart(2, '0')}
            icon={step.icon}
            title={step.title}
            description={step.description}
            onClick={() => onStepClick(step.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default BrokerSteps;