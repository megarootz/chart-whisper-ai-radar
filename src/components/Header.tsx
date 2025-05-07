
import React from 'react';
import { ChartCandlestick, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const Header = () => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '#' },
    { label: 'Analysis History', href: '#' },
    { label: 'Learn', href: '#' },
    { label: 'Pricing', href: '#' },
  ];

  return (
    <header className="w-full py-4 px-6 bg-gradient-to-r from-chart-bg to-chart-card border-b border-gray-800 sticky top-0 z-30 backdrop-blur-lg bg-opacity-90">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <ChartCandlestick className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            ForexRadar<span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">7</span>
          </h1>
        </div>
        
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
                    <div className="bg-primary/10 p-2 rounded-xl">
                      <ChartCandlestick className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-white">
                      ForexRadar<span className="text-primary">7</span>
                    </h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                    <X className="h-5 w-5 text-white" />
                  </Button>
                </div>
                
                <nav className="flex flex-col space-y-5">
                  {navItems.map((item) => (
                    <a 
                      key={item.label}
                      href={item.href}
                      className="px-2 py-2 text-lg text-white hover:text-primary transition-colors duration-200"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
                
                <div className="flex flex-col space-y-3 mt-4">
                  <Button variant="outline" className="w-full border-gray-700 hover:bg-gray-800 text-white">
                    Sign In
                  </Button>
                  <Button className="w-full">
                    Get Started
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <div className="flex items-center space-x-6">
            <nav className="flex items-center space-x-6">
              {navItems.map((item) => (
                <a 
                  key={item.label}
                  href={item.href}
                  className="text-chart-text hover:text-white transition-colors duration-200"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="border-gray-700 hover:bg-gray-800 text-white">
                Sign In
              </Button>
              <Button className="bg-gradient-to-r from-primary to-purple-500 hover:opacity-90 transition-opacity">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
