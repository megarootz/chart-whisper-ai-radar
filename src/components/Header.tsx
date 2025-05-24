import React, { useState } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
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

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Analyze', href: '/analyze' },
    { label: 'History', href: '/history' },
    { label: 'Profile', href: '/profile' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <header className={`w-full sticky top-0 z-30 bg-black border-b border-gray-800 ${isMobile ? 'py-3 px-3' : 'py-4 px-6'}`}>
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 px-1 md:px-0">
          <h1 className={cn("font-bold text-primary", isMobile ? "text-xl" : "text-2xl")}>
            ForexRadar7
          </h1>
        </Link>
        
        {isMobile ? (
          <div className="flex items-center">
            {/* Show menu button only if user is authenticated */}
            {user && (
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-white">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
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
                    
                    <div className="px-4 py-3 border-t border-gray-700">
                      <div className="mb-3 text-sm text-gray-400">
                        {user.email}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full border-gray-700 hover:bg-gray-800 text-white text-sm"
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-2 h-3 w-3" />
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        ) : (
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
