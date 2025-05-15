
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [hasShownToast, setHasShownToast] = useState(false);

  // Add notification when user is redirected to auth page, but only once
  useEffect(() => {
    if (!loading && !user && !hasShownToast) {
      setHasShownToast(true);
      toast({
        title: "Authentication required",
        description: "Please sign in to access this page.",
      });
    }
  }, [loading, user, hasShownToast]);

  // Show loading indicator while checking auth status
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-chart-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to auth page if not logged in
  if (!user) {
    console.log("User not authenticated, redirecting to auth page");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  console.log("User is authenticated, rendering protected content");
  return <>{children}</>;
}
