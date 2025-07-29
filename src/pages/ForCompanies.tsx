import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const ForCompanies = () => {
  const [isYearly, setIsYearly] = useState(true);

  const plans = [
    {
      name: "Free",
      monthlyPrice: "$0",
      yearlyPrice: "$0",
      description: "Browse and explore companies",
      features: [
        "Browse companies on Companies Page",
        "View company details",
        "Search and filter capabilities",
        "Basic profile access"
      ],
      buttonText: "Join for Free",
      popular: false,
      authLink: "/auth-free"
    },
    {
      name: "Standard",
      monthlyPrice: "$29",
      yearlyPrice: "$290",
      description: "Access to company profiles",
      features: [
        "Everything in Free",
        "Access to detailed company profiles",
        "Contact company information",
        "Advanced search filters",
        "Priority support"
      ],
      buttonText: "Subscribe Now",
      popular: true,
      authLink: "/auth-standard"
    },
    {
      name: "Premium",
      monthlyPrice: "$99",
      yearlyPrice: "$990",
      description: "Full platform access",
      features: [
        "Everything in Standard",
        "Access to Investors Page",
        "View all investor details",
        "Contact investors directly",
        "Premium analytics",
        "Priority matching"
      ],
      buttonText: "Subscribe Now",
      popular: false,
      authLink: "/auth-premium"
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
              Plans for <span className="text-primary-600">Companies</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8 transition-colors duration-300">
              Choose the perfect plan for your company's capital raising needs
            </p>

            {/* Monthly/Yearly Toggle */}
            <div className="flex items-center justify-center space-x-4 mb-12">
              <span className={`text-lg ${!isYearly ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400'} transition-colors duration-300`}>
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isYearly ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isYearly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-lg ${isYearly ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400'} transition-colors duration-300`}>
                Yearly
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative bg-white dark:bg-gray-800 border-2 ${
                  plan.popular ? 'border-primary-600 shadow-lg' : 'border-gray-200 dark:border-gray-700'
                } rounded-2xl overflow-hidden transition-colors duration-300 flex flex-col h-full`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-primary-600 text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                
                <CardContent className={`p-8 ${plan.popular ? 'pt-12' : ''} flex flex-col h-full`}>
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2 transition-colors duration-300">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">{plan.description}</p>
                  </div>

                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="h-5 w-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-300 transition-colors duration-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to={plan.authLink} className="mt-auto">
                    <Button 
                      className={`w-full rounded-full py-3 ${
                        plan.popular 
                          ? 'bg-primary-600 hover:bg-primary-700' 
                          : 'bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600'
                      } text-white transition-colors duration-300`}
                    >
                      {plan.buttonText}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForCompanies;
