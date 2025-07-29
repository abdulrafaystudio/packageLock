export const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK-V4] ${step}${detailsStr}`);
};

export const logError = (error: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.error(`[STRIPE-WEBHOOK-ERROR] ${error}${detailsStr}`);
};