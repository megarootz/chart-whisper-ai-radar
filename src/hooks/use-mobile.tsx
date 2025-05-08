
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

    // Add event listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Use the appropriate event listener method
    if (mql.addEventListener) {
      mql.addEventListener("change", checkIsMobile);
    } else {
      // Fallback for older browsers
      window.addEventListener("resize", checkIsMobile);
    }

    // Clean up
    return () => {
      if (mql.removeEventListener) {
        mql.removeEventListener("change", checkIsMobile);
      } else {
        window.removeEventListener("resize", checkIsMobile);
      }
    };
  }, []);

  return isMobile;
}
