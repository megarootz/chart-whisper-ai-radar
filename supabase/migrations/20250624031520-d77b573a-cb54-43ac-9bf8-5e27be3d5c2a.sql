
-- Add deep analysis usage tracking columns to usage_tracking table
ALTER TABLE public.usage_tracking 
ADD COLUMN deep_analysis_daily_count INTEGER DEFAULT 0,
ADD COLUMN deep_analysis_monthly_count INTEGER DEFAULT 0;

-- Update the check_usage_limits function to include deep analysis limits
CREATE OR REPLACE FUNCTION public.check_usage_limits(p_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_date_val DATE := CURRENT_DATE;
  current_month_val TEXT := to_char(CURRENT_DATE, 'YYYY-MM');
  daily_count_val INTEGER := 0;
  monthly_count_val INTEGER := 0;
  deep_analysis_daily_count_val INTEGER := 0;
  deep_analysis_monthly_count_val INTEGER := 0;
  subscription_tier_val TEXT := 'free';
  daily_limit INTEGER;
  monthly_limit INTEGER;
  deep_analysis_daily_limit INTEGER;
  deep_analysis_monthly_limit INTEGER;
  result JSON;
BEGIN
  -- Get subscription tier
  SELECT COALESCE(subscription_tier, 'free') INTO subscription_tier_val
  FROM public.subscribers 
  WHERE user_id = p_user_id;
  
  -- Set limits based on subscription tier
  CASE subscription_tier_val
    WHEN 'starter' THEN
      daily_limit := 15;
      monthly_limit := 450;
      deep_analysis_daily_limit := 5;
      deep_analysis_monthly_limit := 150;
    WHEN 'pro' THEN
      daily_limit := 30;
      monthly_limit := 900;
      deep_analysis_daily_limit := 15;
      deep_analysis_monthly_limit := 450;
    ELSE -- 'free'
      daily_limit := 3;
      monthly_limit := 90;
      deep_analysis_daily_limit := 1;
      deep_analysis_monthly_limit := 30;
  END CASE;
  
  -- Get current daily usage
  SELECT COALESCE(daily_count, 0), COALESCE(deep_analysis_daily_count, 0) 
  INTO daily_count_val, deep_analysis_daily_count_val
  FROM public.usage_tracking 
  WHERE user_id = p_user_id AND date = current_date_val;
  
  -- Calculate total monthly count by summing all daily counts for this month
  SELECT COALESCE(SUM(daily_count), 0), COALESCE(SUM(deep_analysis_daily_count), 0) 
  INTO monthly_count_val, deep_analysis_monthly_count_val
  FROM public.usage_tracking 
  WHERE user_id = p_user_id AND month_year = current_month_val;
  
  -- Return usage info
  result := json_build_object(
    'daily_count', daily_count_val,
    'monthly_count', monthly_count_val,
    'daily_limit', daily_limit,
    'monthly_limit', monthly_limit,
    'deep_analysis_daily_count', deep_analysis_daily_count_val,
    'deep_analysis_monthly_count', deep_analysis_monthly_count_val,
    'deep_analysis_daily_limit', deep_analysis_daily_limit,
    'deep_analysis_monthly_limit', deep_analysis_monthly_limit,
    'subscription_tier', subscription_tier_val,
    'daily_remaining', GREATEST(0, daily_limit - daily_count_val),
    'monthly_remaining', GREATEST(0, monthly_limit - monthly_count_val),
    'deep_analysis_daily_remaining', GREATEST(0, deep_analysis_daily_limit - deep_analysis_daily_count_val),
    'deep_analysis_monthly_remaining', GREATEST(0, deep_analysis_monthly_limit - deep_analysis_monthly_count_val),
    'can_analyze', (daily_count_val < daily_limit AND monthly_count_val < monthly_limit),
    'can_deep_analyze', (deep_analysis_daily_count_val < deep_analysis_daily_limit AND deep_analysis_monthly_count_val < deep_analysis_monthly_limit)
  );
  
  RETURN result;
END;
$function$;

-- Create increment function for deep analysis usage
CREATE OR REPLACE FUNCTION public.increment_deep_analysis_usage(p_user_id uuid, p_email text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  current_date_val DATE := CURRENT_DATE;
  current_month_val TEXT := to_char(CURRENT_DATE, 'YYYY-MM');
  deep_analysis_daily_count_val INTEGER := 0;
  deep_analysis_monthly_count_val INTEGER := 0;
  subscription_tier_val TEXT := 'free';
  deep_analysis_daily_limit INTEGER;
  deep_analysis_monthly_limit INTEGER;
  result JSON;
BEGIN
  -- Get subscription tier
  SELECT COALESCE(subscription_tier, 'free') INTO subscription_tier_val
  FROM public.subscribers 
  WHERE user_id = p_user_id;
  
  -- Set limits based on subscription tier
  CASE subscription_tier_val
    WHEN 'starter' THEN
      deep_analysis_daily_limit := 5;
      deep_analysis_monthly_limit := 150;
    WHEN 'pro' THEN
      deep_analysis_daily_limit := 15;
      deep_analysis_monthly_limit := 450;
    ELSE -- 'free'
      deep_analysis_daily_limit := 1;
      deep_analysis_monthly_limit := 30;
  END CASE;
  
  -- Insert or update deep analysis usage for today's date
  INSERT INTO public.usage_tracking (user_id, email, date, month_year, daily_count, deep_analysis_daily_count)
  VALUES (p_user_id, p_email, current_date_val, current_month_val, 0, 1)
  ON CONFLICT (user_id, date) 
  DO UPDATE SET 
    deep_analysis_daily_count = COALESCE(usage_tracking.deep_analysis_daily_count, 0) + 1,
    updated_at = now()
  RETURNING deep_analysis_daily_count INTO deep_analysis_daily_count_val;
  
  -- Calculate total monthly deep analysis count
  SELECT COALESCE(SUM(deep_analysis_daily_count), 0) INTO deep_analysis_monthly_count_val
  FROM public.usage_tracking 
  WHERE user_id = p_user_id AND month_year = current_month_val;
  
  -- Return usage info
  result := json_build_object(
    'deep_analysis_daily_count', deep_analysis_daily_count_val,
    'deep_analysis_monthly_count', deep_analysis_monthly_count_val,
    'deep_analysis_daily_limit', deep_analysis_daily_limit,
    'deep_analysis_monthly_limit', deep_analysis_monthly_limit,
    'subscription_tier', subscription_tier_val,
    'deep_analysis_daily_remaining', GREATEST(0, deep_analysis_daily_limit - deep_analysis_daily_count_val),
    'deep_analysis_monthly_remaining', GREATEST(0, deep_analysis_monthly_limit - deep_analysis_monthly_count_val),
    'can_deep_analyze', (deep_analysis_daily_count_val < deep_analysis_daily_limit AND deep_analysis_monthly_count_val < deep_analysis_monthly_limit)
  );
  
  RETURN result;
END;
$function$;
