
import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Target, Eye, Heart } from 'lucide-react';

const AboutUs = () => {
  const values = [{
    icon: Target,
    title: "Innovation",
    description: "We leverage cutting-edge technology to streamline the fundraising process and create meaningful connections."
  }, {
    icon: Heart,
    title: "Integrity", 
    description: "We maintain the highest standards of transparency and trust in all our business relationships."
  }, {
    icon: Users,
    title: "Community",
    description: "We believe in building a supportive ecosystem where entrepreneurs and investors can thrive together."
  }, {
    icon: Eye,
    title: "Vision",
    description: "We envision a world where great ideas get the funding they deserve, regardless of background or location."
  }];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      <main className="pt-20 pb-16 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
              About <span className="text-gray-900 dark:text-white">Easy</span><span className="text-primary-600">Fund</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 transition-colors duration-300">
              We're revolutionizing the way startups and investors connect, making fundraising accessible, transparent, and efficient for everyone.
            </p>
          </div>

          {/* Mission and Vision Sections with Grey Background */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 md:p-12 mb-16 transition-colors duration-300">
            {/* Mission Section with Image */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 mb-6 items-center">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
                  Our Mission
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                  To democratize access to capital by creating the world's most intuitive and comprehensive platform connecting companies with the right investors. We empower entrepreneurs of all stages to showcase their vision, while giving investors the tools to discover and support high-potential opportunities with confidence.
                </p>
              </div>
              <div className="order-first md:order-last">
                <img src="/lovable-uploads/85cca6ee-834b-4f26-97fd-9db53d3048cc.png" alt="Global network visualization representing worldwide connections" className="w-full h-64 md:h-80 object-cover rounded-2xl shadow-lg" />
              </div>
            </div>

            {/* Vision Section with Image */}
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <img src="/lovable-uploads/91dbaa89-50b5-47a0-b083-3991a95b5bb6.png" alt="Futuristic tech workspace with data visualization" className="w-full h-64 md:h-80 object-cover rounded-2xl shadow-lg" />
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 transition-colors duration-300">
                  Our Vision
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">
                  To become the global standard for raising capital, where entrepreneurs and investors can connect in the safe environment and  build meaningful partnerships that drive innovation and growth. We envision a world where access to funding is seamless, transparent, and empowering - fueling ideas that shape the future.
                </p>
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12 transition-colors duration-300">
              Our Values
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value, index) => <Card key={index} className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800">
                  <CardContent className="p-6 text-center">
                    <value.icon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>)}
            </div>
          </div>

          {/* Story Section */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-8 md:p-12 transition-colors duration-300">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8 transition-colors duration-300">
              Our Story
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6 transition-colors duration-300">
                <span className="text-gray-900 dark:text-white">Easy</span><span className="text-primary-600">Fund</span> was born from the frustration of watching brilliant entrepreneurs struggle to find the right investors, while investors missed out on incredible opportunities due to inefficient discovery processes.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6 transition-colors duration-300">
                Our founders, having experienced both sides of the fundraising equation, recognized the need for a platform that could bridge this gap. We set out to create a solution that would make fundraising as straightforward as its name suggests - easy.
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed transition-colors duration-300">Today, we're proud to be the trusted platform connecting thousands of startups and investors worldwide, facilitating millions in funding, and helping build the next generation of successful companies.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutUs;
