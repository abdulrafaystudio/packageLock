-- Phase 1: Clean up all conflicting RLS policies on deals table and create new clean ones

-- Drop all existing conflicting policies on deals table
DROP POLICY IF EXISTS "Anyone can view published deals" ON public.deals;
DROP POLICY IF EXISTS "Authenticated users can view deals" ON public.deals;
DROP POLICY IF EXISTS "Users can create their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can delete their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can insert their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can update their own deals" ON public.deals;
DROP POLICY IF EXISTS "Users can view their own deals" ON public.deals;
DROP POLICY IF EXISTS "admins_can_manage_all_deals" ON public.deals;
DROP POLICY IF EXISTS "deals_delete_own" ON public.deals;
DROP POLICY IF EXISTS "deals_insert_authenticated" ON public.deals;
DROP POLICY IF EXISTS "deals_select_public" ON public.deals;
DROP POLICY IF EXISTS "deals_update_own" ON public.deals;
DROP POLICY IF EXISTS "service_role_deals_all" ON public.deals;
DROP POLICY IF EXISTS "users_can_create_own_deals" ON public.deals;
DROP POLICY IF EXISTS "users_can_delete_own_deals" ON public.deals;
DROP POLICY IF EXISTS "users_can_update_own_deals" ON public.deals;
DROP POLICY IF EXISTS "users_can_view_own_deals" ON public.deals;

-- Create 6 clean, non-overlapping policies

-- 1. Public read access for deal cards (any visitor can see basic deal info for active deals)
CREATE POLICY "deals_public_read_cards" 
ON public.deals 
FOR SELECT 
USING (status = 'Active');

-- 2. Authenticated read access for full deal details (logged-in users see full details)
CREATE POLICY "deals_authenticated_read_full" 
ON public.deals 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- 3. Standard+ plans only for INSERT operations (only standard/premium/enterprise/premium pro can create deals)
CREATE POLICY "deals_standard_plus_insert" 
ON public.deals 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND package_type IN ('standard', 'premium', 'enterprise', 'premiumpro')
  )
  AND auth.uid() = user_id
);

-- 4. Own deals only for UPDATE (users can only edit their own deals)
CREATE POLICY "deals_own_update" 
ON public.deals 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 5. Own deals only for DELETE (users can only delete their own deals)  
CREATE POLICY "deals_own_delete" 
ON public.deals 
FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Admin full access (admins can do everything)
CREATE POLICY "deals_admin_full_access" 
ON public.deals 
FOR ALL 
USING (public.is_admin_user());

-- 7. Service role full access (for backend operations)
CREATE POLICY "deals_service_role_full_access" 
ON public.deals 
FOR ALL 
USING (current_setting('role') = 'service_role');