
import React from 'react';
import StepCard from './StepCard';
import { UserPlus, FileText, Handshake } from 'lucide-react';

interface CompanyStepsProps {
  onStepClick: (id: string) => void;
}

const CompanySteps = ({ onStepClick }: CompanyStepsProps) => {
  const steps = [
    {
      id: 'post-deal',
      icon: UserPlus,
      title: 'Post Your Deal',
      description: 'Create your company profile and list your investment opportunity to attract potential investors.',
      color: 'bg-purple-500'
    },
    {
      id: 'connect-investors',
      icon: FileText,
      title: 'Connect with Investors',
      description: 'Browse our extensive investor database and reach out to those who match your funding needs.',
      color: 'bg-purple-600'
    },
    {
      id: 'get-funded',
      icon: Handshake,
      title: 'Get Funded',
      description: 'Manage communications, negotiate terms, and close deals with interested investors.',
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

export default CompanySteps;
