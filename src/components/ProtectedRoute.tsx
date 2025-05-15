
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [hasShownToast, setHasShownToast] = useState(false);
  const [checkCount, setCheckCount] = useState(0);

  // Add notification when user is redirected to auth page, but only once
  useEffect(() => {
    if (!loading && !user && !hasShownToast && !location.pathname.includes("/auth")) {
      setHasShownToast(true);
      toast({
        title: "Authentication required",
        description: "Please sign in to access this page.",
      });
    }
  }, [loading, user, hasShownToast, location.pathname]);

  // Only increment the check count when loading changes
  useEffect(() => {
    if (!loading) {
      setCheckCount(prev => prev + 1);
    }
  }, [loading]);

  // Show loading indicator while checking auth status
  // Only show loading on the first check to prevent flickering during redirects
  if (loading && checkCount === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-chart-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth page if not logged in
  // Only redirect if we've checked at least once and user is still not authenticated
  if (!user && !loading) {
    console.log("User not authenticated, redirecting to auth page");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  console.log("User is authenticated, rendering protected content");
  return <>{children}</>;
}
