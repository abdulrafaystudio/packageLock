
import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HowItWorksHero from '@/components/how-it-works/HowItWorksHero';
import CompanySteps from '@/components/how-it-works/CompanySteps';
import BrokerSteps from '@/components/how-it-works/BrokerSteps';
import CompanyDetailedGuide from '@/components/how-it-works/CompanyDetailedGuide';
import BrokerDetailedGuide from '@/components/how-it-works/BrokerDetailedGuide';

const HowItWorks = () => {
  const handleStepClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100; // Offset for navigation bar and extra space
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <HowItWorksHero />

          <div className="mb-16">
            <Tabs defaultValue="startups" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-12 bg-purple-200 dark:bg-purple-300">
                <TabsTrigger value="startups" className="text-gray-700 dark:text-white data-[state=active]:bg-purple-400 data-[state=active]:text-white">For Companies</TabsTrigger>
                <TabsTrigger value="investors" className="text-gray-700 dark:text-white data-[state=active]:bg-purple-400 data-[state=active]:text-white">For Brokers</TabsTrigger>
              </TabsList>
              
              <TabsContent value="startups">
                <CompanySteps onStepClick={handleStepClick} />
                <CompanyDetailedGuide />
              </TabsContent>

              <TabsContent value="investors">
                <BrokerSteps onStepClick={handleStepClick} />
                <BrokerDetailedGuide />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;
