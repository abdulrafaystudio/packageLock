
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const HelpCenterFAQ = () => {
  const faqs = [
    {
      question: "What is EasyFund and who is it for?",
      answer: "EasyFund is a platform that connects companies, entrepreneurs, and advisors with verified investors globally. Whether you're raising capital, selling a business, or launching a crowdfunding campaign, this is your space to be seen."
    },
    {
      question: "How long does it take to set up an account?",
      answer: "Setting up an account takes less than 5 minutes. You can start browsing companies right away or post your Deal if you are subscribed to the right package."
    },
    {
      question: "How long does it take to post my Deal?",
      answer: "To post your Deal will take you less than 10 minutes. Your Deal will automatically posted on the Companies page for investors to see."
    },
    {
      question: "Can anyone post a deal?",
      answer: "Yes! If you're an individual, startup, company or broker, you can post a deal once you're on a qualifying plan. Just choose your deal type: Raising Capital, Selling a Business, or Crowdfunding."
    },
    {
      question: "What information do I need to post a deal?",
      answer: "You'll need basic details like title, industry, description, and either a funding target or asking price. You can also include optional info like revenue, valuation, patents, or a video link. The more complete your deal, the more interest it will attract."
    },
    {
      question: "Can I edit a deal after it's posted?",
      answer: "Absolutely. You can edit your deal at any time through your profile page."
    },
    {
      question: "Are deals visible to the public?",
      answer: "Yes, your deal appears on the Companies page. Anyone can see a brief preview (title, industry, location, funding target/asking price), but only logged-in users can view full details."
    },
    {
      question: "Is my information secure?",
      answer: "Yes, we use enterprise-grade security measures and only share information with verified users."
    },
    {
      question: "What are the fees?",
      answer: "We offer different subscription based fees. Free users can browse companies, while paid plans provide access to detailed profiles and direct contact capabilities."
    },
    {
      question: "Is there a success fee or any hidden fee?",
      answer: "No! You pay on EasyFund what you can see on Pricing page. EasyFund will never ask you for a success fee or any type of payment except for subscription fee that you can cancel any time."
    },
    {
      question: "How do I contact investors?",
      answer: "Once you're subscribed to the Premium or PremiumPro plan, you'll get full access to the investor database. Just search by filters like location or industry and send a message. They'll receive it by email and reply directly."
    },
    {
      question: "How do I know if the investor is legitimate?",
      answer: "All investors on our platform go through a verification process. We verify their identity, investment history, and credentials before approval."
    },
    {
      question: "Can I browse investors before subscribing?",
      answer: "To keep things secure, investor profiles are only visible once you're subscribed to a qualifying plan."
    },
    {
      question: "Are there new investors on the platform?",
      answer: "Yes! We add new investors every month so you can extend your reach even further and increase your chances of getting funded."
    },
    {
      question: "Can brokers post on behalf of multiple clients?",
      answer: "Yes! That's what the Enterprise and PremiumPro packages are made for. You can post as many deals as needed, and you're free to keep sensitive details private until the right investor shows interest."
    },
    {
      question: "What types of companies can use EasyFund?",
      answer: "EasyFund is perfect platform for crowdfunding companies, startups, small and medium sized companies. We welcome all stages, from pre-seed to Series C and beyond, across all industries and geographies."
    },
    {
      question: "Is EasyFund a crowdfunding platform?",
      answer: "We are not a crowdfunding platform, but we can help your crowdfunding stage by increasing your visibility. Simply post your deal and add your link from another crowdfunding platform and the right people will see you and either contact you via platform or be redirected to your crowdfunding platform."
    },
    {
      question: "How do I upgrade or downgrade my plan?",
      answer: "It's simple. You can upgrade anytime by paying the difference, and if you downgrade, your current plan stays active until the next billing cycle."
    },
    {
      question: "How do I get help if I need it?",
      answer: "Our support team is here for you! Just submit a ticket or email us anytime and we'll make sure you're back on track fast."
    }
  ];

  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Find quick answers to common questions about using EasyFund
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-6"
            >
              <AccordionTrigger className="text-left text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300 pt-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default HelpCenterFAQ;
