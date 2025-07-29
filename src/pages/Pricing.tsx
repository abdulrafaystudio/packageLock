
import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PricingTabContent from '@/components/pricing/PricingTabContent';
import PricingHero from '@/components/pricing/PricingHero';
import GuaranteeSection from '@/components/pricing/GuaranteeSection';
import { companyPlans, brokerPlans } from '@/components/pricing/PricingPlans';

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(true);
  const [activeTab, setActiveTab] = useState("companies");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <PricingHero />

          <div className="mb-16">
            <Tabs defaultValue="companies" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-12 bg-purple-200 dark:bg-purple-300">
                <TabsTrigger value="companies" className="text-gray-700 dark:text-white data-[state=active]:bg-purple-400 data-[state=active]:text-white">For Companies</TabsTrigger>
                <TabsTrigger value="brokers" className="text-gray-700 dark:text-white data-[state=active]:bg-purple-400 data-[state=active]:text-white">For Brokers</TabsTrigger>
              </TabsList>
              
              <TabsContent value="companies">
                <PricingTabContent plans={companyPlans} isYearly={isYearly} onToggle={() => setIsYearly(!isYearly)} isCompaniesTab={true} />
              </TabsContent>

              <TabsContent value="brokers">
                <PricingTabContent plans={brokerPlans} isYearly={isYearly} onToggle={() => setIsYearly(!isYearly)} />
              </TabsContent>
            </Tabs>
          </div>

          <GuaranteeSection activeTab={activeTab} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
