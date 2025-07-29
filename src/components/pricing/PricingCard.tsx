"use client"

import React, { useState } from "react"
import { Check, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { useCentralizedProfile } from "@/hooks/profile/useCentralizedProfile"
import { useStripeCheckout } from "@/hooks/useStripeCheckout"
import { supabase } from "@/integrations/supabase/client"
import DowngradeConfirmDialog from "./DowngradeConfirmDialog"
import DowngradeSuccessDialog from "./DowngradeSuccessDialog"
import type { Plan } from "./types"

interface PricingCardProps {
  plan: Plan
  isYearly: boolean
  isCompaniesTab?: boolean
}

const PricingCard = ({ plan, isYearly, isCompaniesTab = false }: PricingCardProps) => {
  const { user } = useAuth()
  const { personalInfo, userProfile, refreshProfile } = useCentralizedProfile(user)

  // Listen for upgrade-complete event to refresh profile
  // Listen for upgrade-complete event and poll for profile update to ensure fast UI refresh
  React.useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null
    let pollCount = 0
    const handleUpgradeComplete = () => {
      if (typeof refreshProfile === "function") {
        refreshProfile()
        // Poll every 1s for up to 10s to ensure profile is updated quickly
        pollCount = 0
        pollInterval = setInterval(() => {
          pollCount++
          refreshProfile()
          if (pollCount >= 10) {
            if (pollInterval) clearInterval(pollInterval)
          }
        }, 1000)
      }
    }

    window.addEventListener("upgrade-complete", handleUpgradeComplete)
    return () => {
      window.removeEventListener("upgrade-complete", handleUpgradeComplete)
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [refreshProfile])

  const [localCurrentPlan, setLocalCurrentPlan] = useState<string | null>(null)

  // Cancel subscription handler
  const [isCancelling, setIsCancelling] = useState(false)
  const handleCancelSubscription = async () => {
    if (!user?.id || !user?.email) return

    // --- Added logging for user data on cancel ---
    console.log('[Cancel Subscription] User data:', user, { personalInfo, userProfile });
    // --- End added logging ---

    // --- Call backend to cancel subscription ---
    try {
      const response = await supabase.functions.invoke('cancel-subscription', {
        body: {
          userId: user.id,
          stripeCustomerId: user.user_metadata?.stripe_customer_id,
          email: user.email,
        },
      });
      console.log('[Cancel Subscription] API response:', response);
      if (response.error) {
        console.error('[Cancel Subscription] API error:', response.error);
      }
    } catch (apiError) {
      console.error('[Cancel Subscription] Exception during API call:', apiError);
    }
    // --- End backend call ---

    setIsCancelling(true)

    // Store cancellation state in localStorage to persist across refreshes
    localStorage.setItem(`user_cancelled_${user.id}`, "true")

    // Immediately update UI to show free plan as current
    setLocalCurrentPlan("free")

    // Dispatch event to notify other components
    window.dispatchEvent(
      new CustomEvent("upgrade-complete", {
        detail: {
          user_id: user.id,
          package_type: "free",
          cancelled: true,
        },
      }),
    )

    setIsCancelling(false)
  }

  // Check if user has cancelled their subscription (persists across refreshes)
  const isUserCancelled = () => {
    if (!user?.id) return false
    return localStorage.getItem(`user_cancelled_${user.id}`) === "true"
  }

  const { upgradeSubscription, isLoading } = useStripeCheckout()
  const navigate = useNavigate()
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState({
    planName: "",
    effectiveDate: "",
    isError: false,
    errorMessage: "",
  })

  const renderPricing = () => {
    // For Free plan, show $0 with same structure as paid plans
    if (plan.name === "Free") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60px] sm:min-h-[80px]">
          {/* Empty space to match strikethrough height in paid plans */}
          <div className="h-4 sm:h-6 mb-1"></div>
          <div className="flex items-baseline">
            <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              $0
            </span>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2 transition-colors duration-300">
              /month
            </span>
          </div>
          {/* Empty space to match billing info height in paid plans */}
          <div className="h-3 sm:h-5"></div>
        </div>
      )
    }

    // For paid plans, show strikethrough original price and discounted price
    const currentPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice
    const originalPrice = isYearly ? plan.yearlyOriginalPrice : plan.monthlyOriginalPrice

    return (
      <div className="flex flex-col items-center justify-center min-h-[60px] sm:min-h-[80px]">
        {originalPrice ? (
          <div className="text-base sm:text-lg text-gray-400 line-through mb-1 h-4 sm:h-6">{originalPrice}/month</div>
        ) : (
          <div className="h-4 sm:h-6 mb-1"></div>
        )}
        <div className="flex items-baseline">
          <span className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
            {currentPrice}
          </span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2 transition-colors duration-300">
            /month
          </span>
        </div>
        {isYearly ? (
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300 h-3 sm:h-5 text-center">
            (billed annually)
          </span>
        ) : (
          <div className="h-3 sm:h-5"></div>
        )}
      </div>
    )
  }

  const getPlanHierarchy = (planName: string): number => {
    const hierarchy = {
      free: 0,
      freepro: 0, // Same level as free
      standard: 1,
      enterprise: 2,
      premium: 3,
      "premium pro": 4,
    }
    return hierarchy[planName.toLowerCase()] ?? 0
  }

  const getButtonText = () => {
    if (!user) {
      return plan.buttonText
    }

    // Check if user cancelled - if so, treat them as free plan user
    const currentPackage =
      localCurrentPlan ||
      (isUserCancelled() ? "free" : userProfile?.subscription_tier || personalInfo?.packageType) ||
      "free"
    const planName = plan.name.toLowerCase()
    let currentPlanName = currentPackage.toLowerCase()
    if (currentPlanName === "premiumpro") currentPlanName = "premium pro"

    // If user is on Free plan (after cancel), show 'Current Plan' for Free, 'Upgrade Now' for others
    if (currentPlanName === "free") {
      return planName === "free" ? "Current Plan" : "Upgrade Now"
    }

    // If user is on a paid plan but viewing Free plan, show 'Downgrade Now'
    if (planName === "free" && currentPlanName !== "free") {
      return "Downgrade Now"
    }

    // Otherwise, normal logic
    const isCurrentPlan = currentPlanName === planName
    if (isCurrentPlan) {
      return "Current Plan"
    }

    const currentPlanLevel = getPlanHierarchy(currentPlanName)
    const targetPlanLevel = getPlanHierarchy(planName)

    if (targetPlanLevel > currentPlanLevel) {
      return "Upgrade Now"
    } else {
      return "Downgrade Now"
    }
  }

  const formatPlanNameForUrl = (planName: string) => {
    return planName.toLowerCase().replace(/\s+/g, "")
  }

  const handleClick = () => {
    if (!user) {
      // User not logged in - send to auth pages
      if (plan.name === "Free" && plan.authLink === "/auth-free") {
        const billingParam = isYearly ? "?billing=yearly" : "?billing=monthly"
        navigate(`/auth-free${billingParam}`, {
          state: {
            from: isCompaniesTab ? "companies" : "brokers",
          },
        })
      } else {
        const billingParam = isYearly ? "?billing=yearly" : "?billing=monthly"
        navigate(`${plan.authLink}${billingParam}`)
      }
    } else {
      // User is logged in - handle upgrade/downgrade logic
      const currentPackage =
        localCurrentPlan ||
        (isUserCancelled() ? "free" : userProfile?.subscription_tier || personalInfo?.packageType) ||
        "free"
      let currentPlanName = currentPackage.toLowerCase()
      if (currentPlanName === "premiumpro") currentPlanName = "premium pro"

      const currentPlanLevel = getPlanHierarchy(currentPlanName)
      const targetPlanLevel = getPlanHierarchy(plan.name.toLowerCase())

      if (plan.name.toLowerCase() === "free") {
        // This is a downgrade to Free, show confirmation dialog
        setShowDowngradeDialog(true)
      } else if (targetPlanLevel < currentPlanLevel) {
        // This is a downgrade, show confirmation dialog
        setShowDowngradeDialog(true)
      } else if (targetPlanLevel > currentPlanLevel) {
        // This is an upgrade - when upgrading from cancelled state, clear the cancelled flag
        if (isUserCancelled()) {
          localStorage.removeItem(`user_cancelled_${user.id}`)
        }
        proceedWithUpgrade()
      }
      // If same level, nothing happens (current plan case is handled in render)
    }
  }

  const proceedWithUpgrade = async () => {
    if (!user) {
      // User not authenticated, redirect to auth page
      const formattedPlanName = formatPlanNameForUrl(plan.name)
      navigate(`/upgrade-plan?plan=${formattedPlanName}&billing=${isYearly ? "yearly" : "monthly"}`)
      return
    }

    try {
      // Clear cancelled state when upgrading
      if (isUserCancelled()) {
        localStorage.removeItem(`user_cancelled_${user.id}`)
      }

      // Map plan name to package type for Stripe
      const packageTypeMap: { [key: string]: string } = {
        standard: "standard",
        premium: "premium",
        enterprise: "enterprise",
        "premium pro": "premiumpro",
      }

      const packageType = packageTypeMap[plan.name.toLowerCase()]
      if (!packageType) {
        throw new Error(`Invalid plan selected: ${plan.name}`)
      }

      console.log("🚀 Starting upgrade flow - user will be redirected to Stripe:", {
        planName: plan.name,
        packageType,
        billingFrequency: isYearly ? "yearly" : "monthly",
        userEmail: user.email,
      })

      // Call the upgrade subscription function - this will ALWAYS redirect to Stripe
      await upgradeSubscription({
        packageType,
        billingFrequency: isYearly ? "yearly" : "monthly",
      })

      // Immediately update local plan and refresh profile for instant UI
      setLocalCurrentPlan(plan.name.toLowerCase())
      if (typeof refreshProfile === "function") refreshProfile()

      window.dispatchEvent(
        new CustomEvent("upgrade-complete", {
          detail: {
            user_id: user.id,
            package_type: plan.name.toLowerCase(),
            upgraded: true,
          },
        }),
      )
    } catch (error) {
      console.error("Upgrade initiation error:", error)
      // Fallback to upgrade page if something goes wrong
      const formattedPlanName = formatPlanNameForUrl(plan.name)
      navigate(`/upgrade-plan?plan=${formattedPlanName}&billing=${isYearly ? "yearly" : "monthly"}`)
    }
  }

  const proceedWithDowngrade = async () => {
    try {
      // Validate required data
      if (!user?.id || !user?.email) {
        throw new Error("User information not available")
      }

      // Immediately update UI if downgrading to free
      if (plan.name.toLowerCase() === "free") {
        setLocalCurrentPlan("free")
      }

      // Process the downgrade request via Supabase edge function
      const { data, error } = await supabase.functions.invoke("process-downgrade", {
        body: {
          targetPlan: plan.name.toLowerCase(),
          billing: isYearly ? "yearly" : "monthly",
          userId: user.id,
          email: user.email,
        },
      })

      if (error) {
        console.error("Supabase function error:", error)
        // Revert UI change if downgrade failed
        setLocalCurrentPlan(null)
        throw new Error(error.message || "Failed to process downgrade")
      }

      if (!data?.success) {
        // Revert UI change if downgrade failed
        setLocalCurrentPlan(null)
        throw new Error(data?.error || "Failed to process downgrade")
      }

      const formattedDate = data.effective_date
        ? new Date(data.effective_date).toLocaleDateString()
        : "your next billing cycle"

      setSuccessMessage({
        planName: plan.name,
        effectiveDate: formattedDate,
        isError: false,
        errorMessage: "",
      })

      setShowSuccessDialog(true)
      setShowDowngradeDialog(false)

      // Refresh profile to sync with backend
      if (typeof refreshProfile === "function") refreshProfile()
    } catch (error) {
      console.error("Downgrade error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      setSuccessMessage({
        planName: plan.name,
        effectiveDate: "",
        isError: true,
        errorMessage: `Failed to process downgrade: ${errorMessage}. Please try again or contact support.`,
      })
      setShowSuccessDialog(true)
    }
  }

  // Sync localCurrentPlan with backend profile after refresh
  React.useEffect(() => {
    // Sync localCurrentPlan with backend profile after refresh
    const currentPackage = userProfile?.subscription_tier || personalInfo?.packageType || "free"
    if (localCurrentPlan && localCurrentPlan !== currentPackage) {
      setLocalCurrentPlan(null)
    }
  }, [userProfile?.subscription_tier, personalInfo?.packageType])

  // Determine if this is the user's current plan
  const currentPackage =
    localCurrentPlan ||
    (isUserCancelled() ? "free" : userProfile?.subscription_tier || personalInfo?.packageType) ||
    "free"
  const planName = plan.name.toLowerCase()

  // Handle plan name mappings
  let currentPlanName = currentPackage.toLowerCase()
  if (currentPlanName === "premiumpro") currentPlanName = "premium pro"

  const isCurrentPlan = user && currentPlanName === planName

  const renderFeatures = () => {
    // If includedFeatures exists, use it to determine which features to show with checkmarks
    if (plan.includedFeatures) {
      return plan.features.map((feature, featureIndex) => {
        const isIncluded = plan.includedFeatures!.includes(feature)
        return (
          <li key={featureIndex} className="flex items-start py-1">
            {isIncluded ? (
              <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 sm:mr-3 mt-1 flex-shrink-0" />
            ) : (
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3 mt-1 flex-shrink-0" />
            )}
            <span
              className={`${isIncluded ? "text-gray-600 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"} transition-colors duration-300 text-sm leading-relaxed`}
            >
              {feature}
            </span>
          </li>
        )
      })
    }

    // Default behavior - all features are included
    return plan.features.map((feature, featureIndex) => (
      <li key={featureIndex} className="flex items-start py-1">
        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 mr-2 sm:mr-3 mt-1 flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-300 transition-colors duration-300 text-sm leading-relaxed">
          {feature}
        </span>
      </li>
    ))
  }

  // Realtime subscription to update UI on subscription tier change
  React.useEffect(() => {
    if (!user?.id) return

    // Subscribe to changes in the subscribers table for this user
    const channel = supabase
      .channel("subscribers")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "subscribers" }, (payload) => {
        if (payload.new.user_id === user.id) {
          // Instantly refresh profile and update UI
          if (typeof refreshProfile === "function") refreshProfile()
          // Optionally update localCurrentPlan for instant UI
          if (payload.new.subscription_tier) {
            setLocalCurrentPlan(payload.new.subscription_tier)
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, refreshProfile])

  return (
    <>
      <Card
        className={`relative bg-white dark:bg-gray-800 border-2 ${plan.popular ? "border-primary-600 shadow-lg" : "border-gray-200 dark:border-gray-700"} rounded-2xl overflow-hidden transition-colors duration-300 flex flex-col h-full`}
      >
        {plan.popular && (
          <div className="absolute top-0 left-0 right-0 bg-primary-600 text-white text-center py-2 text-sm font-semibold">
            Most Popular
          </div>
        )}

        <CardContent
          className={`p-4 sm:p-6 lg:p-8 ${plan.popular ? "pt-8 sm:pt-10 lg:pt-12" : ""} flex flex-col h-full`}
        >
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 transition-colors duration-300">
              {plan.name}
            </h3>
            <div className="mb-3 sm:mb-4">{renderPricing()}</div>
            <div className="flex items-center justify-center min-h-[48px] sm:min-h-[60px]">
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 text-center text-sm sm:text-base px-2">
                {plan.description}
              </p>
            </div>
          </div>

          <ul className="space-y-1 mb-6 sm:mb-8 flex-grow text-sm sm:text-base font-semibold">{renderFeatures()}</ul>

          {isCurrentPlan ? (
            <>
              <Button
                disabled
                className="w-full rounded-full py-3 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm sm:text-base"
              >
                {getButtonText()}
              </Button>
              {/* Cancel Subscription button for current plan (not Free) */}
              {planName !== "free" && (
                <Button
                  onClick={handleCancelSubscription}
                  disabled={isCancelling}
                  className="w-full mt-2 rounded-full py-3 bg-red-600 hover:bg-red-700 text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  {isCancelling ? "Cancelling..." : "Cancel Subscription"}
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={handleClick}
              disabled={isLoading}
              className={`w-full rounded-full py-3 ${plan.popular ? "bg-primary-600 hover:bg-primary-700 hover:text-white" : "bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 hover:text-white"} text-white transition-colors duration-300 text-sm sm:text-base hover-scale disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? "Redirecting to Payment..." : getButtonText()}
            </Button>
          )}
        </CardContent>
      </Card>

      <DowngradeConfirmDialog
        open={showDowngradeDialog}
        onOpenChange={setShowDowngradeDialog}
        onConfirm={() => {
          setShowDowngradeDialog(false)
          proceedWithDowngrade()
        }}
        planName={plan.name}
        currentPlan={currentPlanName.charAt(0).toUpperCase() + currentPlanName.slice(1)}
      />

      <DowngradeSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        planName={successMessage.planName}
        effectiveDate={successMessage.effectiveDate}
        isError={successMessage.isError}
        errorMessage={successMessage.errorMessage}
      />
    </>
  )
}

export default PricingCard
