
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, FileText, Handshake } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      number: "01",
      title: "Post Your Deal",
      description: "Create a comprehensive profile showcasing your company, funding needs, and growth potential."
    },
    {
      icon: FileText,
      number: "02", 
      title: "Connect with Investors",
      description: "Get discovered by our exclusive network of verified investors actively seeking opportunities."
    },
    {
      icon: Handshake,
      number: "03",
      title: "Get Funded",
      description: "Secure the capital you need to scale your business and achieve your ambitious goals."
    }
  ];

  return (
    <section className="py-20 px-6 lg:px-8 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
            How It <span className="text-purple-600">Works</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto transition-colors duration-300">
            Three simple steps to connect you with the capital you need
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Link key={index} to="/how-it-works" className="block">
              <Card className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-2xl hover:shadow-lg hover:scale-105 transition-all duration-300 animate-slide-up cursor-pointer h-full">
                <CardContent className="p-8 text-center h-full flex flex-col">
                  <div className="bg-purple-100 dark:bg-purple-200 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <step.icon className="h-10 w-10 text-purple-600" />
                  </div>
                  <div className="text-purple-600 font-bold text-5xl mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-bold transition-colors duration-300 text-xl text-gray-900 dark:text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 leading-relaxed flex-grow">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
