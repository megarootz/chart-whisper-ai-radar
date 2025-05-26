
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OTPEmailRequest {
  email: string;
  type: 'signup' | 'recovery';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { email, type }: OTPEmailRequest = await req.json();

    console.log(`Processing ${type} OTP request for email:`, email);

    if (type === 'signup') {
      // For signup, use signInWithOtp to send OTP email
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify`
        }
      });

      if (error) {
        console.error('Error sending signup OTP:', error);
        throw error;
      }

      console.log('Signup OTP email sent successfully');
    } else {
      // For password recovery, use resetPasswordForEmail
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify`
      });

      if (error) {
        console.error('Error sending recovery email:', error);
        throw error;
      }

      console.log('Recovery email sent successfully');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'OTP email sent successfully' 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-otp-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
