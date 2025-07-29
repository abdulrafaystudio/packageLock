import React from 'react';
import { Search, Grid, List } from 'lucide-react';
import { formatInvestmentTypeForDisplay } from '@/utils/investmentTypeExtraction';

interface InvestorFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearchSubmit: (term: string) => void;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
  selectedInvestorType: string;
  setSelectedInvestorType: (type: string) => void;
  selectedInvestmentType: string;
  setSelectedInvestmentType: (type: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  availableCountries: string[];
  availableInvestmentTypes: string[];
  availableInvestorTypes?: string[];
}

const InvestorFilters: React.FC<InvestorFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  onSearchSubmit,
  selectedCountry,
  setSelectedCountry,
  selectedInvestorType,
  setSelectedInvestorType,
  selectedInvestmentType,
  setSelectedInvestmentType,
  viewMode,
  setViewMode,
  availableCountries,
  availableInvestmentTypes,
  availableInvestorTypes = [],
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearchSubmit(searchTerm);
    }
  };

  // List of valid countries to filter against
  const validCountries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Czechia', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Timor-Leste', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Côte d\'Ivoire', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'North Korea', 'South Korea', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Burma', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
  ];

  // Filter availableCountries to only include valid countries
  const filteredCountries = availableCountries.filter(country => {
    const normalizedCountry = country.toLowerCase().trim();
    return validCountries.some(validCountry => 
      validCountry.toLowerCase() === normalizedCountry ||
      normalizedCountry.includes(validCountry.toLowerCase()) ||
      validCountry.toLowerCase().includes(normalizedCountry)
    );
  });

  // Sort countries with United States first, then alphabetically
  const sortedCountries = [...new Set(filteredCountries)].sort((a, b) => {
    if (a === 'United States') return -1;
    if (b === 'United States') return 1;
    return a.localeCompare(b);
  });


  console.log('InvestorFilters - Available investor types:', availableInvestorTypes);
  console.log('InvestorFilters - Selected investor type:', selectedInvestorType);

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 mb-8 transition-colors duration-300">
      <div className="flex justify-between items-end">
        <div className="flex-1 flex justify-center">
          <div className="grid md:grid-cols-4 gap-4 items-end max-w-4xl">
            <div>
              <label className="block text-gray-900 dark:text-gray-300 text-sm font-medium mb-2 transition-colors duration-300">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="Search investors... (Press Enter)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-600 transition-colors duration-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-900 dark:text-gray-300 text-sm font-medium mb-2 transition-colors duration-300">Country</label>
              <select
                id="countryDropdown"
                value={selectedCountry}
                onChange={(e) => {
                  console.log('Country dropdown changed:', e.target.value);
                  setSelectedCountry(e.target.value);
                }}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 transition-colors duration-300"
              >
                <option value="">All Countries</option>
                {sortedCountries.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-900 dark:text-gray-300 text-sm font-medium mb-2 transition-colors duration-300">Investor Type</label>
              <select
                id="investorTypeDropdown"
                value={selectedInvestorType}
                onChange={(e) => {
                  console.log('Investor type dropdown changed:', e.target.value);
                  setSelectedInvestorType(e.target.value);
                }}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 transition-colors duration-300"
              >
                <option value="">All Investor Types</option>
                {availableInvestorTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-900 dark:text-gray-300 text-sm font-medium mb-2 transition-colors duration-300">Preferred Investment Types</label>
              <select
                id="investmentTypeDropdown"
                value={selectedInvestmentType}
                onChange={(e) => setSelectedInvestmentType(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-600 transition-colors duration-300"
              >
                <option value="">All Investment Types</option>
                {availableInvestmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {formatInvestmentTypeForDisplay(type)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="ml-6 hidden md:block">
          <label className="block text-gray-900 dark:text-gray-300 text-sm font-medium mb-2 transition-colors duration-300">View</label>
          <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-colors duration-300 ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors duration-300 ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorFilters;
