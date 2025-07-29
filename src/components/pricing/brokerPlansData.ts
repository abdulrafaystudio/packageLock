
import { Plan } from './types';

export const brokerPlans: Plan[] = [{
  name: "Free",
  monthlyPrice: "$0",
  yearlyPrice: "$0",
  description: "Browse and explore company listings",
  features: [
    "Access your dashboard",
    "Access to detailed company profiles",
    "Direct messaging to companies",
    "Search and filter capabilities",
    "Create unlimited deal listings",
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
  buttonText: "Join for Free",
  popular: false,
  authLink: "/auth-free"
}, {
  name: "Enterprise",
  monthlyPrice: "$74",
  yearlyPrice: "$59",
  monthlyOriginalPrice: "$185",
  yearlyOriginalPrice: "$154",
  description: "Unlimited deal creation for brokers",
  features: [
    "Access your dashboard",
    "Access to detailed company profiles",
    "Direct messaging to companies",
    "Search and filter capabilities",
    "Create unlimited deal listings",
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
    "Search and filter capabilities",
    "Create unlimited deal listings",
    "Advanced Profile page capabilities"
  ],
  buttonText: "Subscribe Now",
  popular: true,
  authLink: "/auth-enterprise"
}, {
  name: "Premium Pro",
  monthlyPrice: "$199",
  yearlyPrice: "$166",
  monthlyOriginalPrice: "$497",
  yearlyOriginalPrice: "$414",
  description: "Complete access with unlimited deals",
  features: [
    "Access your dashboard",
    "Access to detailed company profiles",
    "Direct messaging to companies",
    "Search and filter capabilities",
    "Create unlimited deal listings",
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
    "Search and filter capabilities",
    "Create unlimited deal listings",
    "Advanced Profile page capabilities",
    "Access to Investors Page",
    "View all investor details",
    "Contact investors directly",
    "Unlimited investor outreach"
  ],
  buttonText: "Subscribe Now",
  popular: false,
  authLink: "/auth-premium-pro"
}];
