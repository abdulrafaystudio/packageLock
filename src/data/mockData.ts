
export interface Company {
  id: number;
  title: string;
  industry: string;
  description: string;
  raising: string;
  location: string;
  categoryType: string;
  sector: string;
  dealType: string;
  country: string;
  yearFounded: number;
  grossRevenue: number;
  ebitda: number;
  cashFlow: number;
  employees: number;
  reasonForSelling?: string;
  growthExpansion: string;
  fundingGoal?: number;
  minimumInvestment?: number;
  companyValuation?: number;
  useOfFunds?: string;
}

export const companies: Company[] = [
  {
    id: 1,
    title: "TechStart AI",
    industry: "Artificial Intelligence",
    description: "Revolutionary AI platform for automated business processes",
    raising: "$2,500,000",
    location: "San Francisco, USA",
    categoryType: "Growth Stage",
    sector: "Technology",
    dealType: "raising",
    country: "USA",
    yearFounded: 2021,
    grossRevenue: 850000,
    ebitda: 320000,
    cashFlow: 180000,
    employees: 45,
    reasonForSelling: "Expansion funding",
    growthExpansion: "Looking to expand into European markets and enhance AI capabilities"
  },
  {
    id: 2,
    title: "GreenEnergy Solutions",
    industry: "Green Energy",
    description: "Sustainable solar panel manufacturing and installation",
    raising: "$5,000,000",
    location: "Berlin, Germany",
    categoryType: "Established Business",
    sector: "Energy",
    dealType: "sale",
    country: "Germany",
    yearFounded: 2018,
    grossRevenue: 2400000,
    ebitda: 580000,
    cashFlow: 420000,
    employees: 85,
    reasonForSelling: "Retirement",
    growthExpansion: "Proven track record with established customer base and contracts"
  },
  {
    id: 3,
    title: "EcoFarm Innovations",
    industry: "Agriculture",
    description: "Vertical farming technology for sustainable food production",
    raising: "$750,000",
    location: "Austin, USA",
    categoryType: "Early Stage",
    sector: "Agriculture",
    dealType: "crowdfunding",
    country: "USA",
    yearFounded: 2022,
    grossRevenue: 120000,
    ebitda: 35000,
    cashFlow: 28000,
    employees: 12,
    fundingGoal: 750000,
    minimumInvestment: 100,
    growthExpansion: "Expanding vertical farming operations to 5 new cities"
  },
  {
    id: 4,
    title: "HealthTech Connect",
    industry: "Medical/Healthcare",
    description: "Telemedicine platform connecting rural patients with specialists",
    raising: "$1,200,000",
    location: "Toronto, Canada",
    categoryType: "Growth Stage",
    sector: "Healthcare",
    dealType: "crowdfunding",
    country: "Canada",
    yearFounded: 2020,
    grossRevenue: 450000,
    ebitda: 180000,
    cashFlow: 145000,
    employees: 28,
    fundingGoal: 1200000,
    minimumInvestment: 250,
    growthExpansion: "Scaling to serve remote communities across North America"
  },
  {
    id: 5,
    title: "Artisan Coffee Roasters",
    industry: "Restaurant",
    description: "Premium coffee roasting business with 3 locations",
    raising: "$800,000",
    location: "Portland, USA",
    categoryType: "Established Business",
    sector: "Food & Beverage",
    dealType: "sale",
    country: "USA",
    yearFounded: 2016,
    grossRevenue: 1200000,
    ebitda: 240000,
    cashFlow: 195000,
    employees: 35,
    reasonForSelling: "Owner relocation",
    growthExpansion: "Established brand with loyal customer base and growth potential"
  },
  {
    id: 6,
    title: "Luxury Home Decor",
    industry: "Retail/Clothing",
    description: "High-end home furnishing and decor boutique",
    raising: "$1,500,000",
    location: "Milan, Italy",
    categoryType: "Established Business",
    sector: "Retail",
    dealType: "sale",
    country: "Italy",
    yearFounded: 2015,
    grossRevenue: 980000,
    ebitda: 285000,
    cashFlow: 220000,
    employees: 22,
    reasonForSelling: "Business expansion to new markets",
    growthExpansion: "Prime location with established clientele and supplier relationships"
  },
  {
    id: 7,
    title: "NextGen Robotics",
    industry: "Technology/Web/App",
    description: "Industrial automation and robotics solutions",
    raising: "$3,200,000",
    location: "Munich, Germany",
    categoryType: "Growth Stage",
    sector: "Technology",
    dealType: "raising",
    country: "Germany",
    yearFounded: 2019,
    grossRevenue: 1800000,
    ebitda: 540000,
    cashFlow: 425000,
    employees: 65,
    companyValuation: 12000000,
    useOfFunds: "R&D expansion and market penetration in automotive sector",
    growthExpansion: "Leading position in industrial automation with major automotive clients"
  },
  {
    id: 8,
    title: "CleanWater Systems",
    industry: "Green Energy",
    description: "Water purification technology for developing markets",
    raising: "$2,800,000",
    location: "Amsterdam, Netherlands",
    categoryType: "Growth Stage",
    sector: "Environmental",
    dealType: "raising",
    country: "Netherlands",
    yearFounded: 2020,
    grossRevenue: 950000,
    ebitda: 285000,
    cashFlow: 230000,
    employees: 42,
    companyValuation: 9500000,
    useOfFunds: "International expansion and product development",
    growthExpansion: "Proven technology with strong demand in emerging markets"
  }
];

export const countries = [
  'USA', 'Canada', 'Mexico', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands',
  'Belgium', 'Austria', 'Switzerland', 'Norway', 'Sweden', 'Denmark', 'Finland',
  'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Greece', 'Portugal'
];

export const industries = [
  'Aerospace', 'Agriculture', 'Artificial Intelligence', 'Alcohol/Brewery', 'Automotive',
  'Beauty/Cosmetology', 'Biotech', 'Business Services', 'Cannabis', 'Community Infusion',
  'Construction', 'Cryptocurrency/Blockchain', 'Defense', 'E-Commerce', 'Education',
  'Energy', 'Entertainment', 'Faith-Based', 'Fashion', 'Financial', 'Fintech',
  'Hospitality/Food Service', 'Government', 'Green Energy', 'Health and Wellness',
  'Industrial', 'Invention', 'Manufacturing', 'Marketing', 'Media/Film', 'Medical/Healthcare',
  'Non-Profit', 'Oil/Gas', 'Pets/Animals', 'Restaurant', 'Technology/Web/App', 'Legal',
  'Logistics/Transportation', 'Real Estate', 'Retail/Clothing', 'Sports/Recreation', 'Other'
];
