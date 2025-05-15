import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Analyze', href: '/analyze' },
    { label: 'History', href: '/history' },
    { label: 'Profile', href: '/profile' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(err => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`);
        });
      }
    }
  };

  // Check fullscreen status when it changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Updated header with a cleaner mobile layout and hidden hamburger menu
  return (
    <header className={`w-full sticky top-0 z-30 bg-black border-b border-gray-800 ${isMobile ? 'py-2 px-2' : 'py-4 px-6'}`}>
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 px-1 md:px-0">
          <h1 className={cn("font-bold text-primary", isMobile ? "text-xl" : "text-2xl")}>
            ForexRadar7
          </h1>
        </Link>
        
        {isMobile ? (
          // Mobile view with fullscreen toggle button
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleFullscreen} 
              className="text-white mr-1 active:bg-transparent focus:bg-transparent hover:bg-transparent p-1"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
            
            {/* We keep the Sheet component but hide the trigger on mobile since we have bottom nav */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              {/* Mobile menu button is now hidden since we use bottom navigation */}
              <div className="hidden">
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white mr-4">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              </div>
              <SheetContent side="right" className="bg-chart-card border-l border-gray-700 w-full sm:w-[80%] pt-12 p-0">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-between items-center absolute top-2 right-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsMenuOpen(false)}>
                      <X className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                  
                  <nav className="flex flex-col space-y-0">
                    {navItems.map((item) => (
                      <Link
                        key={item.label}
                        to={item.href}
                        className="px-4 py-3 text-base text-white hover:bg-gray-800 hover:text-primary transition-colors duration-200 border-b border-gray-700"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                  
                  <div className="px-4 py-3">
                    {user ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full border-gray-700 hover:bg-gray-800 text-white text-sm"
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-2 h-3 w-3" />
                        Sign Out
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full border-gray-700 hover:bg-gray-800 text-white text-sm"
                        onClick={() => {
                          navigate('/auth');
                          setIsMenuOpen(false);
                        }}
                      >
                        <User className="mr-2 h-3 w-3" />
                        Sign In
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        ) : (
          // Desktop view (unchanged)
          <div className="flex items-center space-x-6">
            <nav className="flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="text-white hover:text-primary transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center space-x-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" className="bg-primary hover:bg-primary/90 text-white">
                      <User className="mr-2 h-4 w-4" />
                      Account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-chart-card border-gray-700">
                    <div className="px-3 py-2 text-sm text-gray-300">
                      {user.email}
                    </div>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem 
                      className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                      onClick={() => navigate('/profile')}
                    >
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-700" />
                    <DropdownMenuItem 
                      className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                      onClick={handleSignOut}
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white"
                  onClick={() => navigate('/auth')}
                >
                  Get Started
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

// Helper function for className conditionals - needed since we're importing it
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};
