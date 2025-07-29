-- Create a database function to automatically process scheduled downgrades
CREATE OR REPLACE FUNCTION public.process_due_downgrades()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    due_downgrade RECORD;
    processed_count integer := 0;
    failed_count integer := 0;
BEGIN
    -- Process all scheduled downgrades that are due
    FOR due_downgrade IN 
        SELECT * FROM public.subscription_transitions
        WHERE transition_type = 'downgrade'
        AND effective_date <= now()
        ORDER BY created_at ASC
    LOOP
        BEGIN
            -- Update subscriber record
            UPDATE public.subscribers
            SET 
                subscription_tier = due_downgrade.to_plan,
                updated_at = now()
            WHERE user_id = due_downgrade.user_id;
            
            -- Update profiles record
            UPDATE public.profiles
            SET 
                package_type = due_downgrade.to_plan::package_type,
                updated_at = now()
            WHERE id = due_downgrade.user_id;
            
            -- Log the event
            INSERT INTO public.subscription_events (
                user_id,
                event_type,
                metadata
            ) VALUES (
                due_downgrade.user_id,
                'downgrade_executed',
                jsonb_build_object(
                    'from_plan', due_downgrade.from_plan,
                    'to_plan', due_downgrade.to_plan,
                    'original_effective_date', due_downgrade.effective_date,
                    'executed_at', now(),
                    'transition_id', due_downgrade.id
                )
            );
            
            -- Remove the processed transition
            DELETE FROM public.subscription_transitions
            WHERE id = due_downgrade.id;
            
            processed_count := processed_count + 1;
            RAISE LOG '[process_due_downgrades] Successfully processed downgrade for user %', due_downgrade.user_id;
            
        EXCEPTION WHEN OTHERS THEN
            failed_count := failed_count + 1;
            RAISE LOG '[process_due_downgrades] Failed to process downgrade for user %: %', due_downgrade.user_id, SQLERRM;
        END;
    END LOOP;
    
    RETURN jsonb_build_object(
        'success', true,
        'processed_count', processed_count,
        'failed_count', failed_count,
        'message', format('Processed %s downgrades, %s failed', processed_count, failed_count)
    );
END;
$$;