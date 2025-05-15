
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Initialize with the current window width if in browser environment
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }
    // Default to false if not in browser
    return false;
  });

  React.useEffect(() => {
    // Function to check if the screen is mobile
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initial check
    checkIsMobile();

    // Add event listener
    window.addEventListener("resize", checkIsMobile);

    // Add viewport meta tag to disable zooming for mobile
    if (typeof document !== 'undefined') {
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
      }
      
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }

    // Clean up
    return () => {
      window.removeEventListener("resize", checkIsMobile);
    };
  }, []);

  return isMobile;
}
