
export const clearAllProfileCache = () => {
  console.log('🗑️ ENHANCED: Clearing all profile-related cache');
  
  // Enhanced cache key list with more comprehensive clearing
  const keysToRemove = [
    'easyfund_subscription_cache',
    'subscription_session_check',
    'profile_cache_v3',
    'user_profile_cache',
    'profile_cache',
    'permissions_cache',
    'auth_session_cache',
    'subscription_permissions_cache'
  ];
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.log(`✅ ENHANCED: Cleared localStorage key: ${key}`);
    } catch (error) {
      console.warn(`⚠️ ENHANCED: Failed to clear localStorage key ${key}:`, error);
    }
  });
  
  // Also clear sessionStorage cache
  keysToRemove.forEach(key => {
    try {
      sessionStorage.removeItem(key);
      console.log(`✅ ENHANCED: Cleared sessionStorage key: ${key}`);
    } catch (error) {
      console.warn(`⚠️ ENHANCED: Failed to clear sessionStorage key ${key}:`, error);
    }
  });
  
  // Clear any browser cache-related storage
  try {
    // Clear any cached permission states
    sessionStorage.removeItem('cached_permissions');
    sessionStorage.removeItem('last_permission_check');
    
    console.log('🎯 ENHANCED: All profile cache cleared successfully with enhanced scope');
  } catch (error) {
    console.warn('⚠️ ENHANCED: Error during enhanced cache clearing:', error);
  }
};

export const forceProfileRefresh = () => {
  console.log('🔄 ENHANCED: Forcing complete profile refresh');
  clearAllProfileCache();
  
  // Enhanced refresh with longer delay to ensure all systems update
  setTimeout(() => {
    console.log('🔄 ENHANCED: Executing forced page reload after cache clear');
    window.location.reload();
  }, 1500); // Increased delay for better reliability
};
