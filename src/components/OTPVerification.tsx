
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { ChartCandlestick, Mail, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface OTPVerificationProps {
  email: string;
  type: 'signup' | 'recovery';
  onVerified: () => void;
  onBack: () => void;
}

export default function OTPVerification({ email, type, onVerified, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { signIn } = useAuth();

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        variant: "destructive",
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit code.",
      });
      return;
    }

    setIsLoading(true);
    try {
      if (type === 'signup') {
        // For signup, we need to verify the OTP and complete the signup process
        // This would typically involve calling your backend to verify the OTP
        // For now, we'll simulate this process
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
          title: "Email Verified!",
          description: "Your account has been verified successfully.",
        });
        onVerified();
      } else {
        // For password recovery, verify OTP and allow password reset
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({
          title: "Code Verified!",
          description: "You can now reset your password.",
        });
        onVerified();
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Invalid or expired code. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      // Call your backend to resend OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Resend Failed",
        description: "Failed to resend verification code. Please try again.",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-chart-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <ChartCandlestick className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">ForexRadar7</h1>
          <p className="text-gray-400 mt-1">Verify your email address</p>
        </div>
        
        <Card className="border-gray-800 bg-chart-card">
          <form onSubmit={handleVerifyOTP}>
            <CardHeader>
              <CardTitle className="text-white">Email Verification</CardTitle>
              <CardDescription>
                We've sent a 6-digit verification code to <strong>{email}</strong>. 
                Enter the code below to {type === 'signup' ? 'complete your account setup' : 'reset your password'}.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-white">Verification Code</Label>
                <div className="flex justify-center">
                  <InputOTP
                    value={otp}
                    onChange={(value) => setOtp(value)}
                    maxLength={6}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="bg-gray-900 border-gray-700 text-white" />
                      <InputOTPSlot index={1} className="bg-gray-900 border-gray-700 text-white" />
                      <InputOTPSlot index={2} className="bg-gray-900 border-gray-700 text-white" />
                      <InputOTPSlot index={3} className="bg-gray-900 border-gray-700 text-white" />
                      <InputOTPSlot index={4} className="bg-gray-900 border-gray-700 text-white" />
                      <InputOTPSlot index={5} className="bg-gray-900 border-gray-700 text-white" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-2">
                  Didn't receive the code?
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto text-primary hover:text-primary/90"
                  onClick={handleResendOTP}
                  disabled={isResending}
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Code
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-3">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full text-primary hover:text-primary/90 hover:bg-transparent"
                onClick={onBack}
              >
                Back to {type === 'signup' ? 'Sign Up' : 'Sign In'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
