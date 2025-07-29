
// Core auth hooks
export { useAuthCore } from './useAuthCore';
export { useSecureSubscriptionCore } from './useSecureSubscriptionCore';
export { useUserProfile } from './useUserProfile';
export { usePermissions } from './usePermissions';
export { useFeatureAccess } from './useFeatureAccess';
export { useOfflineSubscription } from './useOfflineSubscription';

// Unified auth form hook (primary form handler)
export { useUnifiedAuthForm } from './useUnifiedAuthForm';

// Enhanced Phase 3 capabilities - New composed approach
export { useEnhancedAuthFlow } from './useEnhancedAuthFlowComposed';
export { useAuthFlowMonitoring } from './useAuthFlowMonitoring';

// Individual auth operation hooks
export { useAuthOperations } from './useAuthOperations';
export { useAuthErrorHandler } from './useAuthErrorHandler';
export { useAuthLogger } from './useAuthLogger';

// Simple backup auth flow (fallback)
export { useSimpleAuthFlow } from './useSimpleAuthFlow';

// Basic auth flow (emergency fallback)
export { useBasicAuth } from './useBasicAuth';

// Enhanced system health with monitoring
export { useSystemHealth } from './useSystemHealth';

// Specialized hooks with unique functionality
export { useSmartRateLimit } from './useSmartRateLimit';
export { useAdminCreation } from './useAdminCreation';
export { useRequestDeduplication } from './useRequestDeduplication';
