
import React from 'react';

interface GuaranteeSectionProps {
  activeTab: string;
}

const GuaranteeSection = ({ activeTab }: GuaranteeSectionProps) => {
  const getBackgroundImage = () => {
    if (activeTab === "brokers") {
      return "/lovable-uploads/26f73e6d-84b4-44ac-b28d-337199b36d49.png";
    }
    return "/lovable-uploads/ad937388-c70c-4a39-9726-6aa0983f2ee6.png";
  };

  const getGuaranteeContent = () => {
    if (activeTab === "brokers") {
      return {
        title: "Scale With Confidence",
        description: "EasyFund isn't just a platform — it's a growth engine for brokers and advisors. Showcase unlimited deals, connect with verified global investors, and manage all your client activity from one place. Whether you're representing startups or established companies, EasyFund helps you deliver results and grow your business — faster and more efficiently."
      };
    }
    return {
      title: "100% Success Guaranteed",
      description: "We stand behind our platform! If you don't secure funding within 12 months of using EasyFund, your next idea gets full access to our Premium package, absolutely free!"
    };
  };

  const content = getGuaranteeContent();

  return (
    <div className="relative bg-cover bg-center bg-no-repeat rounded-2xl overflow-hidden mb-16" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('${getBackgroundImage()}')`
    }}>
      <div className="px-8 py-16 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{content.title}</h2>
        <p className="text-xl text-white max-w-4xl mx-auto mb-8">{content.description}</p>
      </div>
    </div>
  );
};

export default GuaranteeSection;
