
import React from 'react';
import { UserPlus, FileText, Handshake } from 'lucide-react';
import StepCard from './StepCard';

interface InvestorStepsProps {
  onStepClick: (id: string) => void;
}

const InvestorSteps = ({ onStepClick }: InvestorStepsProps) => {
  const steps = [
    {
      id: "broker-step-1",
      icon: UserPlus,
      number: "01",
      title: "Post Your Deals",
      description: "Create comprehensive profiles showcasing your client's companies, funding needs, and growth potential."
    },
    {
      id: "broker-step-2",
      icon: FileText,
      number: "02",
      title: "Get Leads",
      description: "Get discovered by our exclusive network of companies and investors actively seeking opportunities."
    },
    {
      id: "broker-step-3",
      icon: Handshake,
      number: "03",
      title: "Close Deals",
      description: "Secure the capital your clients need to scale their business and position yourself as the go-to broker."
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
      {steps.map((step) => (
        <StepCard
          key={step.id}
          icon={step.icon}
          number={step.number}
          title={step.title}
          description={step.description}
          size="large"
          onClick={() => onStepClick(step.id)}
        />
      ))}
    </div>
  );
};

export default InvestorSteps;
