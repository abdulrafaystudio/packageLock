
export const validateAuthentication = (authHeader: string | null): boolean => {
  if (!authHeader) {
    console.error("No authorization header provided");
    return false;
  }
  return true;
};
