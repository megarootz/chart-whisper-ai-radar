
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Check if this might be a SPA routing issue (common paths that should exist)
  const commonPaths = ['/analyze', '/history', '/profile', '/auth'];
  const isSPARoutingIssue = commonPaths.some(path => location.pathname.startsWith(path));

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
              This appears to be a server configuration issue. If you refreshed the page or accessed this URL directly, 
              the server needs to be configured to serve the React app for all routes.
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
            <p>For developers: Configure your server to serve index.html for all routes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotFound;
