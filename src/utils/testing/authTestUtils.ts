
import { User } from '@supabase/supabase-js';
import { SubscriptionStatus, PackageType } from '@/types/auth';

// Mock user factory
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  phone_confirmed_at: null,
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {},
  identities: [],
  aud: 'authenticated',
  ...overrides
});

// Mock subscription status factory
export const createMockSubscriptionStatus = (
  overrides: Partial<SubscriptionStatus> = {}
): SubscriptionStatus => ({
  subscribed: true,
  subscription_tier: 'premium',
  subscription_status: 'active',
  subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  ...overrides
});

// Test scenarios for subscription states
export const subscriptionTestScenarios = {
  active: createMockSubscriptionStatus(),
  pastDue: createMockSubscriptionStatus({
    subscription_status: 'past_due',
    subscription_end: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
  }),
  cancelled: createMockSubscriptionStatus({
    subscribed: false,
    subscription_status: 'cancelled'
  }),
  expired: createMockSubscriptionStatus({
    subscribed: false,
    subscription_status: 'active',
    subscription_end: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  })
};

// Permission test helpers
export const testPermissions = {
  free: {
    canAccessInvestors: false,
    canCreateDeals: false,
    canAccessProfile: true,
    canAccessBasicFeatures: true,
    maxDeals: 0
  },
  premium: {
    canAccessInvestors: true,
    canCreateDeals: true,
    canAccessProfile: true,
    canAccessBasicFeatures: true,
    maxDeals: 1
  },
  enterprise: {
    canAccessInvestors: true,
    canCreateDeals: true,
    canAccessProfile: true,
    canAccessBasicFeatures: true,
    maxDeals: -1
  }
};

// Webhook test scenarios
export const webhookTestScenarios = {
  customerSubscriptionCreated: {
    id: 'evt_test_webhook',
    object: 'event',
    api_version: '2020-08-27',
    created: 1677649086,
    data: {
      object: {
        id: 'sub_test',
        object: 'subscription',
        cancel_at_period_end: false,
        current_period_end: 1680327486,
        current_period_start: 1677649086,
        customer: 'cus_test',
        status: 'active',
        items: {
          data: [{
            price: {
              id: 'price_premium_monthly',
              nickname: 'Premium Monthly'
            }
          }]
        }
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: 'req_test',
      idempotency_key: null
    },
    type: 'customer.subscription.created'
  },
  invoicePaymentSucceeded: {
    id: 'evt_test_webhook',
    object: 'event',
    api_version: '2020-08-27',
    created: 1677649086,
    data: {
      object: {
        id: 'in_test',
        object: 'invoice',
        amount_paid: 2999,
        customer: 'cus_test',
        status: 'paid',
        subscription: 'sub_test'
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: 'req_test',
      idempotency_key: null
    },
    type: 'invoice.payment_succeeded'
  }
};

// Offline mode simulation helpers
export const offlineModeTestUtils = {
  simulateOffline: () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false
    });
    window.dispatchEvent(new Event('offline'));
  },
  simulateOnline: () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
    window.dispatchEvent(new Event('online'));
  },
  mockFailedNetworkRequest: () => {
    return Promise.reject(new Error('Network request failed'));
  }
};

// Feature access test cases
export const featureAccessTestCases = [
  {
    name: 'Free user accessing investors',
    user: createMockUser(),
    subscription: null,
    feature: 'investors',
    expectedAccess: false,
    expectedReason: 'subscription_required'
  },
  {
    name: 'Premium user accessing investors',
    user: createMockUser(),
    subscription: createMockSubscriptionStatus(),
    feature: 'investors',
    expectedAccess: true
  },
  {
    name: 'Past due user accessing premium features',
    user: createMockUser(),
    subscription: subscriptionTestScenarios.pastDue,
    feature: 'investors',
    expectedAccess: false,
    expectedReason: 'subscription_inactive'
  }
];

// Grace period test scenarios
export const gracePeriodTestScenarios = {
  withinGracePeriod: {
    subscription: createMockSubscriptionStatus({
      subscription_status: 'past_due',
      subscription_end: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    }),
    expectedGracePeriod: true
  },
  beyondGracePeriod: {
    subscription: createMockSubscriptionStatus({
      subscription_status: 'past_due',
      subscription_end: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
    }),
    expectedGracePeriod: false
  }
};
