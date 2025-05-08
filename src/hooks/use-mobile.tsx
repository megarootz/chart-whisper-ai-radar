
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Function to check if the screen is mobile
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Set the initial value
    checkIsMobile();

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

  // Return false until the effect has run
  return isMobile === undefined ? false : isMobile;
}
