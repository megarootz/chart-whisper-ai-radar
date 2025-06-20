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
    { label: 'Pricing', href: '/pricing' },
    { label: 'Analyze', href: '/analyze' },
    { label: 'History', href: '/history' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  return (
    <header className={`w-full fixed top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800 ${isMobile ? 'py-3 px-3' : 'py-2 px-6'}`}>
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 px-1 md:px-0">
          <h1 className={cn("font-bold text-primary", isMobile ? "text-xl" : "text-2xl")}>
            ForexRadar7
          </h1>
        </Link>
        
        {isMobile ? (
          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" className="bg-primary hover:bg-primary/90 text-white text-sm">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-chart-card border-gray-700" align="end">
                  <div className="px-3 py-2 text-sm text-gray-300">
                    {user.email}
                  </div>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                    onClick={() => navigate('/profile')}
                  >
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem 
                    className="text-white hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                className="bg-primary hover:bg-primary/90 text-white text-sm"
                onClick={() => navigate('/auth')}
              >
                Get Started
              </Button>
            )}
          </div>
        ) : (
          <div className="flex items-center w-full justify-center absolute left-0 right-0 pointer-events-none">
            <nav className="flex items-center space-x-8 pointer-events-auto">
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
          </div>
        )}
        
        {!isMobile && (
          <div className="flex items-center space-x-3 ml-auto">
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
        )}
      </div>
    </header>
  );
};

// Helper function for className conditionals - needed since we're importing it
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export default Header;
