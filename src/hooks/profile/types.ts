
export interface PersonalInfo {
  fullName: string;
  email: string;
  companyName: string;
  packageType: 'free' | 'standard' | 'premium' | 'enterprise' | 'premiumpro' | 'freepro';
}

export interface ProfileCache {
  data: PersonalInfo;
  timestamp: number;
  expiresIn: number;
}
