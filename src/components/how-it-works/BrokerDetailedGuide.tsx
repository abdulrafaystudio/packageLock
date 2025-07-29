
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, FileText, Handshake, Plus, LayoutDashboard, MessageSquare, Zap } from 'lucide-react';

const BrokerDetailedGuide = () => {
  const steps = [
    {
      id: 'post-deal',
      icon: UserPlus,
      title: "Post Your Deals",
      description: "Getting started on EasyFund is simple and fast. Just click \"Sign Up\" or \"Get Started\" on our homepage to create your account. You'll be directed to the Pricing page, where you can select the plan that fits your business goals - whether you're raising capital or selling company for your client. Enterprise and Premium Pro are packages designed for brokers and you can find them on \"For Brokers\" on Pricing page.",
      details: [
        "Once you've submitted your details, head over to your Account (top-right corner) and click on \"Profile\". There, you'll find a \"Create Deal\" button. Select your deal type - Capital Raising, Selling, or Crowdfunding - and fill out all the key details that potential investors would want to see.",
        "Want to stand out? Provide as much information and videos you have to make your deal more compelling.",
        "When you're ready, hit the \"Publish Deal\" button at the bottom right. Your deal will instantly be featured on our Companies page, accessible to active investors from around the world."
      ]
    },
    {
      id: 'get-leads',
      icon: FileText,
      title: "Get Leads",
      description: "There are two powerful ways to get noticed by investors:",
      details: [
        "• Organic Exposure: Once your deal is live on EasyFund, it becomes visible to a global network of investors browsing for opportunities daily. Many of our success stories started here - just by being visible on the platform.",
        "• Direct Access with Premium (Highly Recommended): Want to take control of your investor outreach? Upgrade to our Premium Package to unlock access to thousands of verified, global investors. Use powerful filters to search by location, industry, investor type, and investment focus.",
        "Unlike other platforms, there are no messaging limits, so you can reach out to as many investors as you need to close your next round faster.",
        "Tip: Most funded companies on EasyFund use the Premium plan to speed up conversations and build their investor pipeline efficiently."
      ]
    },
    {
      id: 'close-deals',
      icon: Handshake,
      title: "Close Deals",
      description: "Whether you're raising capital, selling your business, or launching a new idea - EasyFund helps you achieve your goals faster.",
      details: [
        "We're more than just a listing site - we're your growth partner. Thousands of companies have used EasyFund to get funded, grow, and exit successfully."
      ],
      features: [
        "✅ Faster Outreach",
        "✅ Verified Investors",
        "✅ Increased Visibility",
        "✅ Centralized Management"
      ],
      conclusion: "Ready to start? Create your account, publish your deals, and join the growing community of entrepreneurs who trust EasyFund to power their funding journey."
    }
  ];

  const features = [
    {
      icon: Plus,
      title: "Unlimited Deal Posting",
      description: "Manage multiple client opportunities under one account and scale your outreach without limits"
    },
    {
      icon: LayoutDashboard,
      title: "Centralized Dashboard",
      description: "Access all your deals and investor interactions in one simple, organized space without toggling between tools"
    },
    {
      icon: MessageSquare,
      title: "Direct Investor Access",
      description: "Engage with investors directly on behalf of your clients, without intermediaries or bottlenecks"
    },
    {
      icon: Zap,
      title: "Workflow Efficiency",
      description: "Streamline your process with tools built to help brokers close faster, work smarter, and support more clients"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          How It Works
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Follow this comprehensive guide to maximize your success as a broker on our platform
        </p>
      </div>

      <div className="grid gap-8">
        {steps.map((step, index) => (
          <Card key={step.id} id={step.id} className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-grow">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-600 text-white text-sm font-bold rounded-full">
                      {index + 1}
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {step.description}
                  </p>
                   <div className="space-y-3">
                     {step.details.map((detail, detailIndex) => (
                       <p key={detailIndex} className="text-gray-600 dark:text-gray-300">
                         {detail}
                       </p>
                     ))}
                     {step.features && (
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6 mb-6 py-4">
                         {step.features.map((feature, featureIndex) => (
                           <div key={featureIndex} className="text-center text-sm font-bold text-gray-600 dark:text-gray-300">
                             {feature}
                           </div>
                         ))}
                       </div>
                     )}
                     {step.conclusion && (
                       <p className="text-gray-600 dark:text-gray-300 mt-4">
                         {step.conclusion}
                       </p>
                     )}
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Key Platform Features
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                      <feature.icon className="h-5 w-5 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrokerDetailedGuide;