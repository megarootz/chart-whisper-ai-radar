
import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { ChartCandlestick, Lock, Mail, User } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "@/components/ui/use-toast";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, signUp, signInWithGoogle, resetPassword, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/analyze";
  
  // Effect to handle navigation when authentication state changes
  useEffect(() => {
    let redirectTimeout: NodeJS.Timeout;
    
    if (user && !loading) {
      console.log("User is authenticated, redirecting to:", from);
      
      // Small delay to ensure state is fully processed before redirect
      redirectTimeout = setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);
    }
    
    // Check if we have a reset=true in URL params for password reset flow
    const isReset = searchParams.get('reset') === 'true';
    if (isReset) {
      toast({
        title: "Password Reset Link Sent",
        description: "Check your email for a link to reset your password.",
      });
    }
    
    return () => {
      if (redirectTimeout) clearTimeout(redirectTimeout);
    };
  }, [user, loading, navigate, from, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide both email and password.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await signIn(email, password);
      toast({
        title: "Success!",
        description: "You've been signed in successfully.",
      });
      // Navigation will happen through the auth state change listener in useEffect
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message || "Please check your credentials and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide both email and password.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await signUp(email, password);
      toast({
        title: "Account created!",
        description: "You're now signed in. Redirecting to dashboard...",
      });
      // Navigation will happen through the auth state change listener in useEffect
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An error occurred during sign up.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // The redirect will be handled by the auth state change listener in useEffect
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign In Failed",
        description: "There was an error signing in with Google.",
      });
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please provide your email address to reset your password.",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
      toast({
        title: "Reset Link Sent",
        description: "Check your email for a link to reset your password.",
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        variant: "destructive",
        title: "Password Reset Failed",
        description: error.message || "An error occurred during password reset.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle between sign-in form and reset password form
  const toggleResetForm = () => {
    setShowResetForm(!showResetForm);
    setResetSent(false);
  };

  // If already authenticated and not in the process of loading, show loading state
  if (user && !loading) {
    return (
      <div className="min-h-screen bg-chart-bg flex flex-col items-center justify-center p-4">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Authentication successful. Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show loading state during authentication check
  if (loading) {
    return (
      <div className="min-h-screen bg-chart-bg flex flex-col items-center justify-center p-4">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Render password reset form
  if (showResetForm) {
    return (
      <div className="min-h-screen bg-chart-bg flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <ChartCandlestick className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-white">ForexRadar7</h1>
            <p className="text-gray-400 mt-1">Reset your password</p>
          </div>
          
          <Card className="border-gray-800 bg-chart-card">
            <form onSubmit={handleResetPassword}>
              <CardHeader>
                <CardTitle className="text-white">Forgot Password</CardTitle>
                <CardDescription>
                  {resetSent 
                    ? "Check your email for a password reset link" 
                    : "Enter your email to receive a password reset link"}
                </CardDescription>
              </CardHeader>
              
              {!resetSent && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-white">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10 bg-gray-900 border-gray-700 text-white"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              )}
              
              <CardFooter className="flex flex-col space-y-3">
                {!resetSent ? (
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                ) : (
                  <Button 
                    type="button"
                    variant="outline"
                    className="w-full border-gray-700 text-white hover:bg-gray-800"
                    onClick={() => setResetSent(false)}
                  >
                    Send Again
                  </Button>
                )}
                
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-primary hover:text-primary/90 hover:bg-transparent"
                  onClick={toggleResetForm}
                >
                  Back to Sign In
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    );
  }

  // Render auth form
  return (
    <div className="min-h-screen bg-chart-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-2">
            <ChartCandlestick className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">ForexRadar7</h1>
          <p className="text-gray-400 mt-1">Sign in to analyze your charts</p>
        </div>
        
        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <Card className="border-gray-800 bg-chart-card">
              <form onSubmit={handleSignIn}>
                <CardHeader>
                  <CardTitle className="text-white">Sign In</CardTitle>
                  <CardDescription>Enter your email and password to access your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10 bg-gray-900 border-gray-700 text-white"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-gray-900 border-gray-700 text-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-primary text-sm hover:text-primary/90"
                      onClick={toggleResetForm}
                    >
                      Forgot password?
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  
                  <div className="relative w-full my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-chart-card text-gray-400">or continue with</span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <FcGoogle className="mr-2 h-5 w-5" />
                    Google
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card className="border-gray-800 bg-chart-card">
              <form onSubmit={handleSignUp}>
                <CardHeader>
                  <CardTitle className="text-white">Sign Up</CardTitle>
                  <CardDescription>Create an account to start analyzing charts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-white">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10 bg-gray-900 border-gray-700 text-white"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white">Username (Optional)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="yourname"
                        className="pl-10 bg-gray-900 border-gray-700 text-white"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-white">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10 bg-gray-900 border-gray-700 text-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                  
                  <div className="relative w-full my-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-chart-card text-gray-400">or sign up with</span>
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full bg-white text-gray-900 hover:bg-gray-100 border border-gray-300"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                  >
                    <FcGoogle className="mr-2 h-5 w-5" />
                    Google
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
