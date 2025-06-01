import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, AlertCircle } from "lucide-react";
import { updatePageMeta } from "@/utils/seoUtils";

// Declare gtag as a global function for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Update SEO for 404 page
    updatePageMeta(
      '404 - Page Not Found | ForexRadar7',
      'The page you are looking for does not exist. Return to ForexRadar7 for AI-powered forex chart analysis.',
      `https://forexradar7.com${location.pathname}`
    );
    
    // Log 404 for debugging
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // Track 404s for Google Search Console (only if gtag is available)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_not_found', {
        page_path: location.pathname,
        page_title: '404 - Page Not Found'
      });
    }
  }, [location.pathname]);

  // Check if this might be a SPA routing issue
  const protectedPaths = ['/analyze', '/history', '/profile'];
  const publicPaths = ['/pricing', '/auth'];
  const dynamicPaths = ['/analysis/'];
  
  const isProtectedRoute = protectedPaths.some(path => location.pathname.startsWith(path));
  const isPublicRoute = publicPaths.some(path => location.pathname.startsWith(path));
  const isDynamicRoute = dynamicPaths.some(path => location.pathname.startsWith(path));
  const isSPARoutingIssue = isProtectedRoute || isPublicRoute || isDynamicRoute;

  return (
    <div className="min-h-screen flex items-center justify-center bg-chart-bg">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white mb-2">404</h1>
          <h2 className="text-xl text-gray-300 mb-4">Page Not Found</h2>
        </div>

        {isSPARoutingIssue ? (
          <div className="bg-yellow-900/20 border border-yellow-800/50 rounded-lg p-4 mb-6">
            <p className="text-yellow-400 text-sm mb-2">
              <strong>Routing Issue Detected</strong>
            </p>
            <p className="text-gray-300 text-sm">
              {isProtectedRoute ? 
                "This page requires authentication. Please sign in to access this feature." :
                "This appears to be a server configuration issue. If you refreshed the page or accessed this URL directly, try navigating from the homepage."
              }
            </p>
          </div>
        ) : (
          <p className="text-gray-400 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>
        )}

        <div className="space-y-3">
          <Button asChild className="w-full bg-primary hover:bg-primary/90">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
            <button onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </button>
          </Button>
        </div>

        {isSPARoutingIssue && (
          <div className="mt-6 text-xs text-gray-500">
            <p>Having trouble? <Link to="/auth" className="text-primary hover:underline">Try signing in</Link> or <Link to="/" className="text-primary hover:underline">return to homepage</Link></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;
