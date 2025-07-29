
import { Plan } from './types';

export const companyPlans: Plan[] = [{
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
  buttonText: "Join for Free",
  popular: false,
  authLink: "/auth-free"
}, {
  name: "Standard",
  monthlyPrice: "$19",
  yearlyPrice: "$15",
  monthlyOriginalPrice: "$48",
  yearlyOriginalPrice: "$40",
  description: "Create deals and access company listings",
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
    "Search and filter capabilities",
    "Create 1 deal listing",
    "Advanced Profile page capabilities"
  ],
  buttonText: "Subscribe Now",
  popular: true,
  authLink: "/auth-standard"
}, {
  name: "Premium",
  monthlyPrice: "$129",
  yearlyPrice: "$107",
  monthlyOriginalPrice: "$322",
  yearlyOriginalPrice: "$268",
  description: "Full investor access and deal creation",
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
    "Search and filter capabilities",
    "Create 1 deal listing",
    "Advanced Profile page capabilities",
    "Access to Investors Page",
    "View all investor details",
    "Contact investors directly",
    "Unlimited investor outreach"
  ],
  buttonText: "Subscribe Now",
  popular: false,
  authLink: "/auth-premium"
}];
