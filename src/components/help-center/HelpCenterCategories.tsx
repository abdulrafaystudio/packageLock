
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Users, HelpCircle, Building, Handshake } from 'lucide-react';

const HelpCenterCategories = () => {
  const handleHowItWorksClick = () => {
    // Scroll to top when navigating to How it Works
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const helpCategories = [
    {
      icon: Users,
      title: "Getting Started",
      description: "Let's walk you through setting up your profile and posting your first deal.",
      articles: [
        { title: "Step-by-step tutorial", id: "tutorial", isExternal: true, link: "/how-it-works" },
        { title: "How to create your account", id: "create-account" },
        { title: "Navigating the Companies & Investors pages", id: "navigate-pages" },
        { title: "Understanding your dashboard and deal types", id: "dashboard-deal-types" },
        { title: "Understanding Subscription tiers", id: "subscription-tiers" }
      ]
    },
    {
      icon: HelpCircle,
      title: "Who is it for?",
      description: "Whether you're crowdfunding, growing a startup, or advising clients, here's how EasyFund fits your goals.",
      articles: [
        { title: "How startups raise capital on EasyFund", id: "startups-raise-capital" },
        { title: "How to promote your crowdfunding campaign", id: "promote-crowdfunding" },
        { title: "Why EasyFund works for small & medium-size businesses", id: "smb-businesses" },
        { title: "Using EasyFund as a financial advisor or broker", id: "financial-advisors-brokers" }
      ]
    },
    {
      icon: Building,
      title: "For Companies",
      description: "Ready to raise funds or sell your company? Here's everything you need to know.",
      articles: [
        { title: "Posting your first deal (Capital, Sale, or Crowdfunding)", id: "posting-first-deal" },
        { title: "Editing or updating a deal", id: "editing-updating-deal" },
        { title: "How to access and contact investors", id: "access-contact-investors" },
        { title: "What investors look for in a deal", id: "what-investors-look-for" },
        { title: "Tips for getting more visibility", id: "getting-more-visibility" },
        { title: "Keeping sensitive company info private", id: "keeping-sensitive-info-private" }
      ]
    },
    {
      icon: Handshake,
      title: "For Brokers",
      description: "Manage multiple deals and represent clients with ease.",
      articles: [
        { title: "How to post deals as a broker or advisor", id: "post-deals-as-broker" },
        { title: "Unlimited deal posting explained", id: "unlimited-deal-posting" },
        { title: "Using filters to find the right investors for each client", id: "using-filters-for-clients" },
        { title: "Responding to investor inquiries as a broker", id: "responding-to-inquiries" },
        { title: "Connecting clients with investors", id: "connecting-clients-investors" }
      ]
    }
  ];

  return (
    <div className="mb-16">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12 transition-colors duration-300">
        Browse by Category
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {helpCategories.map((category, index) => (
          <Card key={index} className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="bg-primary-100 dark:bg-primary-900 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <category.icon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                {category.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 transition-colors duration-300">
                {category.description}
              </p>
              <ul className="space-y-2">
                {category.articles.map((article, articleIndex) => (
                  <li key={articleIndex}>
                    <Link 
                      to={article.isExternal ? article.link : `/library?topic=${article.id}`} 
                      className="text-primary-600 hover:text-primary-700 text-sm transition-colors"
                      onClick={article.link === "/how-it-works" ? handleHowItWorksClick : undefined}
                    >
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HelpCenterCategories;
