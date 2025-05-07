
import React, { useState } from 'react';
import { ChartCandlestick, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';

const Header = () => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Analyze', href: '/analyze' },
    { label: 'History', href: '/history' },
  ];

  return (
    <header className="w-full py-4 px-6 bg-black border-b border-gray-800 sticky top-0 z-30">
      <div className="container mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-primary">
            ForexRadar7
          </h1>
        </Link>
        
        {isMobile ? (
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-chart-card border-l border-gray-700 w-[80%]">
              <div className="flex flex-col space-y-6 pt-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-primary">
                      ForexRadar7
                    </h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                    <X className="h-5 w-5 text-white" />
                  </Button>
                </div>
                
                <nav className="flex flex-col space-y-5">
                  {navItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="px-2 py-2 text-lg text-white hover:text-primary transition-colors duration-200"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                
                <div className="flex flex-col space-y-3 mt-4">
                  <Button variant="outline" className="w-full border-gray-700 hover:bg-gray-800 text-white">
                    Sign In / Register
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
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
              <Button className="bg-primary hover:bg-primary/90 text-white">
                Sign In / Register
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
