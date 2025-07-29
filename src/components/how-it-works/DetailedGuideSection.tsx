
import React from 'react';
import { CheckCircle } from 'lucide-react';

interface DetailedGuideSectionProps {
  id?: string;
  title: string;
  children: React.ReactNode;
  showFeatures?: boolean;
  features?: string[];
}

const DetailedGuideSection = ({ id, title, children, showFeatures = false, features = [] }: DetailedGuideSectionProps) => {
  return (
    <div id={id} className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700 scroll-mt-20">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        {title}
      </h3>
      <div className="text-gray-600 dark:text-gray-300 space-y-4 text-lg leading-relaxed">
        {children}
        {showFeatures && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-8 mx-auto max-w-4xl">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center justify-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className={index === features.length - 1 ? "font-bold" : "font-semibold"}>{feature}</span>
                </div>
              ))}
            </div>
            <p className="font-semibold text-xl text-gray-900 dark:text-white mb-2 mt-8">
              Ready to start?
            </p>
            <p>
              Create your account, publish your deals, and join the growing community of brokers and advisors who trust EasyFund to power their business.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default DetailedGuideSection;
