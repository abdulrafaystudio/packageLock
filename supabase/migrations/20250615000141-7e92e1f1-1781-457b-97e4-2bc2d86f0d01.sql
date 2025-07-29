
-- Phase 1 Cleanup (Part 2): Ensure updated_at triggers are in place

-- Step 1: Re-confirm the function to update timestamps exists.
-- This is idempotent and safe to run again.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Apply the trigger to the `profiles` table.
-- This ensures `profiles.updated_at` is automatically updated whenever a profile is modified.
DROP TRIGGER IF EXISTS handle_updated_at_profiles ON public.profiles;
CREATE TRIGGER handle_updated_at_profiles
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

-- Step 3: Apply the trigger to the `deals` table.
-- This ensures `deals.updated_at` is automatically updated whenever a deal is modified.
DROP TRIGGER IF EXISTS handle_updated_at_deals ON public.deals;
CREATE TRIGGER handle_updated_at_deals
BEFORE UPDATE ON public.deals
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();
