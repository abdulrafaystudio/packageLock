
export interface Plan {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  monthlyOriginalPrice?: string;
  yearlyOriginalPrice?: string;
  description: string;
  features: string[];
  includedFeatures?: string[];
  buttonText: string;
  popular: boolean;
  authLink: string;
}
