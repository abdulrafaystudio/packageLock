
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StepCardProps {
  icon: LucideIcon;
  number: string;
  title: string;
  description: string;
  size?: 'large' | 'small';
  onClick?: () => void;
}

const StepCard = ({ icon: Icon, number, title, description, size = 'large', onClick }: StepCardProps) => {
  const isLarge = size === 'large';
  
  return (
    <Card 
      onClick={onClick}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      <CardContent className="p-0">
        <div className={`bg-purple-100 dark:bg-purple-200 rounded-full ${isLarge ? 'w-24 h-24' : 'w-16 h-16'} flex items-center justify-center mx-auto ${isLarge ? 'mb-8' : 'mb-4'}`}>
          <Icon className={`${isLarge ? 'h-12 w-12' : 'h-8 w-8'} text-purple-600`} />
        </div>
        <div className={`text-purple-600 ${isLarge ? 'text-6xl' : 'text-3xl'} font-bold ${isLarge ? 'mb-6' : 'mb-2'}`}>
          {number}
        </div>
        <h3 className={`${isLarge ? 'text-2xl' : 'text-xl'} font-bold text-gray-900 dark:text-white mb-4`}>
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">
          {description}
        </p>
      </CardContent>
    </Card>
  );
};

export default StepCard;
