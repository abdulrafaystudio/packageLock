import { Plan } from './types';

export const brokerPlans: Plan[] = [
  {
    name: "Free",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    description: "Browse and explore company listings",
    features: [
      "Access your dashboard",
      "Access to detailed company profiles",
      "Direct messaging to companies",
      "Search and filter capabilities",
      "Create 1 deal listing",
      "Advanced Profile page capabilities",
      "Access to Investors Page",
      "View all investor details",
      "Contact investors directly",
      "Unlimited investor outreach"
    ],
    includedFeatures: [
      "Access your dashboard",
      "Access to detailed company profiles",
      "Direct messaging to companies",
      "Search and filter capabilities"
    ],
    buttonText: "Get Started Free",
    popular: false,
    authLink: "/auth-free"
  },
  {
    name: "Enterprise",
    monthlyPrice: "$59",
    yearlyPrice: "$59",
    monthlyOriginalPrice: "$74",
    yearlyOriginalPrice: "$74",
    description: "Advanced broker capabilities",
    features: [
      "Access your dashboard",
      "Access to detailed company profiles",
      "Direct messaging to companies",
      "Search and filter capabilities",
      "Create 1 deal listing", 
      "Advanced Profile page capabilities",
      "Access to Investors Page",
      "View all investor details",
      "Contact investors directly",
      "Unlimited investor outreach"
    ],
    buttonText: "Upgrade to Enterprise",
    popular: false,
    authLink: "/auth-enterprise"
  },
  {
    name: "Premium Pro",
    monthlyPrice: "$166",
    yearlyPrice: "$166",
    monthlyOriginalPrice: "$199",
    yearlyOriginalPrice: "$199", 
    description: "Premium broker features with unlimited access",
    features: [
      "Access your dashboard",
      "Access to detailed company profiles",
      "Direct messaging to companies",
      "Search and filter capabilities",
      "Create 1 deal listing",
      "Advanced Profile page capabilities", 
      "Access to Investors Page",
      "View all investor details",
      "Contact investors directly",
      "Unlimited investor outreach"
    ],
    buttonText: "Upgrade to Premium Pro",
    popular: true,
    authLink: "/auth-premiumpro"
  }
];