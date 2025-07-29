// Deprecation utility for gradual migration
const DEPRECATION_WARNINGS_ENABLED = process.env.NODE_ENV === 'development';

interface DeprecationConfig {
  feature: string;
  version: string;
  replacement?: string;
  removalVersion?: string;
  url?: string;
}

const loggedWarnings = new Set<string>();

export const deprecationWarning = (config: DeprecationConfig) => {
  if (!DEPRECATION_WARNINGS_ENABLED) return;

  const key = `${config.feature}_${config.version}`;
  if (loggedWarnings.has(key)) return;

  loggedWarnings.add(key);

  const warningParts = [
    `🚨 DEPRECATION WARNING: ${config.feature}`,
    `Current version: ${config.version}`,
    config.replacement && `Use ${config.replacement} instead`,
    config.removalVersion && `Will be removed in version ${config.removalVersion}`,
    config.url && `More info: ${config.url}`
  ].filter(Boolean);

  console.warn(warningParts.join('\n'));
};

// Hook to warn about deprecated profile.package_type usage
export const useDeprecatedProfilePackageType = (packageType: string) => {
  if (DEPRECATION_WARNINGS_ENABLED) {
    deprecationWarning({
      feature: 'profiles.package_type field',
      version: '1.0',
      replacement: 'subscribers.subscription_tier from useSecureSubscriptionCore hook',
      removalVersion: '2.0',
      url: 'https://docs.example.com/migration-guide'
    });
  }
  
  return packageType;
};

// Utility to mark fields as deprecated
export const markAsDeprecated = <T>(
  value: T,
  feature: string,
  replacement?: string
): T => {
  if (DEPRECATION_WARNINGS_ENABLED) {
    deprecationWarning({
      feature,
      version: '1.0',
      replacement,
      removalVersion: '2.0'
    });
  }
  
  return value;
};